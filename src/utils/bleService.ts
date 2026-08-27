import { TelemetryData } from '../types';

// Web Bluetooth & Web Serial Type Augmentations
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BleServiceCallbacks {
  onStatusChange: (status: ConnectionStatus, message?: string) => void;
  onTelemetryData: (data: Partial<TelemetryData>) => void;
}

// Nordic UART Service & ELM327 Bluetooth UUIDs
const BLE_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const BLE_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const BLE_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

export class HonDashDeviceManager {
  private bluetoothDevice: BluetoothDevice | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private serialPort: SerialPort | null = null;
  private serialReader: ReadableStreamDefaultReader<string> | null = null;
  private callbacks: BleServiceCallbacks;
  public status: ConnectionStatus = 'disconnected';
  public isWebBluetoothSupported: boolean = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  public isWebSerialSupported: boolean = typeof navigator !== 'undefined' && 'serial' in navigator;

  constructor(callbacks: BleServiceCallbacks) {
    this.callbacks = callbacks;
  }

  // Connect via Web Bluetooth (BLE) to CYD ESP32-S3 or ELM327
  async connectBluetooth(): Promise<boolean> {
    if (!this.isWebBluetoothSupported) {
      this.callbacks.onStatusChange('error', 'Web Bluetooth não é suportado neste navegador. Use Chrome/Edge no PC ou Android.');
      return false;
    }

    try {
      this.callbacks.onStatusChange('connecting', 'Procurando dispositivo Bluetooth HonDash / ESP32...');
      
      const navBluetooth = (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          BLE_UART_SERVICE,
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard BLE serial
          '0000fff0-0000-1000-8000-00805f9b34fb',
          'generic_access',
          'battery_service'
        ]
      });

      this.bluetoothDevice = device;
      device.addEventListener('gattserverdisconnected', () => {
        this.status = 'disconnected';
        this.callbacks.onStatusChange('disconnected', 'Dispositivo Bluetooth desconectado');
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Não foi possível conectar ao servidor GATT');
      }

      // Try finding UART service
      try {
        const service = await server.getPrimaryService(BLE_UART_SERVICE);
        this.rxCharacteristic = await service.getCharacteristic(BLE_UART_RX);
        this.txCharacteristic = await service.getCharacteristic(BLE_UART_TX);

        await this.rxCharacteristic.startNotifications();
        this.rxCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const target = event.target as BluetoothRemoteGATTCharacteristic;
          const value = target.value;
          if (value) {
            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(value);
            this.parseIncomingData(str);
          }
        });
      } catch {
        // Connected in generic mode
      }

      this.status = 'connected';
      this.callbacks.onStatusChange('connected', `Conectado via BLE a ${device.name || 'CYD ESP32-S3'}`);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.status = 'error';
      this.callbacks.onStatusChange('error', `Falha ao conectar: ${errorMsg}`);
      return false;
    }
  }

  // Connect via Web Serial (USB) to CYD ESP32-S3 board
  async connectSerial(baudRate = 115200): Promise<boolean> {
    if (!this.isWebSerialSupported) {
      this.callbacks.onStatusChange('error', 'Web Serial não é suportado neste navegador. Use Google Chrome ou Microsoft Edge no PC/Android.');
      return false;
    }

    try {
      this.callbacks.onStatusChange('connecting', 'Selecione a porta Serial da plaquinha CYD ESP32-S3...');
      const serialApi = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPort> } }).serial;
      const port = await serialApi.requestPort();
      await port.open({ baudRate });
      this.serialPort = port;

      this.status = 'connected';
      this.callbacks.onStatusChange('connected', 'Conectado via USB Serial na plaquinha CYD ESP32-S3!');

      this.readSerialStream(port);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.status = 'error';
      this.callbacks.onStatusChange('error', `Falha na conexão Serial: ${errorMsg}`);
      return false;
    }
  }

  private async readSerialStream(port: SerialPort) {
    if (!port.readable) return;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable as unknown as WritableStream<Uint8Array>);
    const reader = textDecoder.readable.getReader();
    this.serialReader = reader;

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            this.parseIncomingData(line.trim());
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao ler stream Serial:', err);
    } finally {
      reader.releaseLock();
      await readableStreamClosed.catch(() => {});
    }
  }

  // Parses HonDash JSON or OBD-II ASCII strings
  private parseIncomingData(raw: string) {
    if (!raw || raw.length === 0) return;

    // 1. Check JSON format from ESP32
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        this.callbacks.onTelemetryData({
          rpm: parsed.rpm ?? parsed.RPM,
          speed: parsed.spd ?? parsed.speed ?? parsed.SPD,
          ect: parsed.ect ?? parsed.ECT ?? parsed.coolant,
          iat: parsed.iat ?? parsed.IAT,
          map: parsed.map ?? parsed.MAP,
          tps: parsed.tps ?? parsed.TPS,
          afr: parsed.afr ?? parsed.AFR,
          batteryVoltage: parsed.volt ?? parsed.bat ?? parsed.VOLT,
          vtecActive: parsed.vtec === 1 || parsed.vtec === true || (parsed.rpm && parsed.rpm >= 5200),
          insideTemp: parsed.insideTemp,
          outsideTemp: parsed.outsideTemp
        });
        return;
      } catch {
        // Not valid json, continue
      }
    }

    // 2. Check HonDash CSV telemetry string "HD,RPM,SPD,ECT,IAT,MAP,TPS,VTEC,AFR,VOLT"
    if (raw.startsWith('HD,') || raw.startsWith('ECU,')) {
      const parts = raw.split(',');
      if (parts.length >= 7) {
        const rpm = parseFloat(parts[1]) || 0;
        const speed = parseFloat(parts[2]) || 0;
        const ect = parseFloat(parts[3]) || 0;
        const iat = parseFloat(parts[4]) || 0;
        const map = parseFloat(parts[5]) || 0;
        const tps = parseFloat(parts[6]) || 0;
        const vtec = parts[7] === '1' || rpm > 5200;
        const afr = parseFloat(parts[8]) || 14.7;
        const volt = parseFloat(parts[9]) || 14.2;

        this.callbacks.onTelemetryData({
          rpm,
          speed,
          ect,
          iat,
          map,
          tps,
          vtecActive: vtec,
          afr,
          batteryVoltage: volt
        });
        return;
      }
    }

    // 3. Check OBD-II ELM327 hex response (e.g. 41 0C XX XX)
    const cleaned = raw.replace(/\s+/g, '').toUpperCase();
    if (cleaned.startsWith('410C') && cleaned.length >= 8) {
      const a = parseInt(cleaned.substring(4, 6), 16);
      const b = parseInt(cleaned.substring(6, 8), 16);
      const rpm = Math.round(((a * 256) + b) / 4);
      this.callbacks.onTelemetryData({ rpm });
    } else if (cleaned.startsWith('410D') && cleaned.length >= 6) {
      const speed = parseInt(cleaned.substring(4, 6), 16);
      this.callbacks.onTelemetryData({ speed });
    } else if (cleaned.startsWith('4105') && cleaned.length >= 6) {
      const ect = parseInt(cleaned.substring(4, 6), 16) - 40;
      this.callbacks.onTelemetryData({ ect });
    } else if (cleaned.startsWith('410B') && cleaned.length >= 6) {
      const map = parseInt(cleaned.substring(4, 6), 16);
      this.callbacks.onTelemetryData({ map });
    }
  }

  // Disconnect all sessions
  async disconnect() {
    if (this.rxCharacteristic) {
      try {
        await this.rxCharacteristic.stopNotifications();
      } catch {
        // ignore
      }
    }
    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {
        // ignore
      }
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {
        // ignore
      }
    }
    this.status = 'disconnected';
    this.callbacks.onStatusChange('disconnected', 'Desconectado');
  }
}
