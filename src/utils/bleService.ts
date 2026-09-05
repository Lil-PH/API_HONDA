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

// Known BLE UUIDs for ESP32 HonDash, Nordic UART & ELM327 Adapters
const HONDASH_ESP32_SERVICE = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const HONDASH_ESP32_CHAR = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const TI_CC2540_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
const TI_CC2540_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';

const ELM327_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';
const ELM327_CHAR = '0000fff1-0000-1000-8000-00805f9b34fb';

export class HonDashDeviceManager {
  private bluetoothDevice: BluetoothDevice | null = null;
  private gattServer: BluetoothRemoteGATTServer | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private serialPort: SerialPort | null = null;
  private serialReader: ReadableStreamDefaultReader<string> | null = null;
  private callbacks: BleServiceCallbacks;
  private pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private elmPollStep = 0;
  private rawBuffer = '';

  public status: ConnectionStatus = 'disconnected';
  public isWebBluetoothSupported: boolean = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  public isWebSerialSupported: boolean = typeof navigator !== 'undefined' && 'serial' in navigator;

  constructor(callbacks: BleServiceCallbacks) {
    this.callbacks = callbacks;
  }

  // Connect via Web Bluetooth (BLE) to HonDash CYD ESP32-S3 or ELM327
  async connectBluetooth(): Promise<boolean> {
    if (!this.isWebBluetoothSupported) {
      this.callbacks.onStatusChange(
        'error',
        'Web Bluetooth não é suportado neste navegador. Use Google Chrome ou Microsoft Edge no PC ou Android.'
      );
      return false;
    }

    try {
      this.callbacks.onStatusChange('connecting', 'Buscando dispositivo Bluetooth HonDash / ESP32-S3...');

      const navBluetooth = (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          HONDASH_ESP32_SERVICE,
          NORDIC_UART_SERVICE,
          TI_CC2540_SERVICE,
          ELM327_SERVICE,
          '000018f0-0000-1000-8000-00805f9b34fb',
          'generic_access',
          'battery_service'
        ]
      });

      this.bluetoothDevice = device;
      device.addEventListener('gattserverdisconnected', () => {
        this.status = 'disconnected';
        this.stopPolling();
        this.callbacks.onStatusChange('disconnected', 'Dispositivo Bluetooth HonDash desconectado.');
      });

      this.callbacks.onStatusChange('connecting', `Conectando ao GATT de ${device.name || 'HonDash ESP32'}...`);
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Não foi possível conectar ao servidor GATT do dispositivo.');
      }
      this.gattServer = server;

      let connectedChar: BluetoothRemoteGATTCharacteristic | null = null;

      // 1. Try HonDash ESP32 custom characteristic
      try {
        const service = await server.getPrimaryService(HONDASH_ESP32_SERVICE);
        const char = await service.getCharacteristic(HONDASH_ESP32_CHAR);
        connectedChar = char;
        this.txCharacteristic = char;
      } catch {
        // Continue fallback
      }

      // 2. Try Nordic UART Service
      if (!connectedChar) {
        try {
          const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
          connectedChar = await service.getCharacteristic(NORDIC_UART_RX);
          try {
            this.txCharacteristic = await service.getCharacteristic(NORDIC_UART_TX);
          } catch {
            this.txCharacteristic = connectedChar;
          }
        } catch {
          // Continue fallback
        }
      }

      // 3. Try TI CC2540 / HM-10 UART
      if (!connectedChar) {
        try {
          const service = await server.getPrimaryService(TI_CC2540_SERVICE);
          connectedChar = await service.getCharacteristic(TI_CC2540_CHAR);
          this.txCharacteristic = connectedChar;
        } catch {
          // Continue fallback
        }
      }

      // 4. Try ELM327 Service
      if (!connectedChar) {
        try {
          const service = await server.getPrimaryService(ELM327_SERVICE);
          connectedChar = await service.getCharacteristic(ELM327_CHAR);
          this.txCharacteristic = connectedChar;
        } catch {
          // Fallback to any notify characteristic
        }
      }

      // 5. Fallback: discover any service with notify property
      if (!connectedChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.notify || c.properties.indicate) {
                connectedChar = c;
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  this.txCharacteristic = c;
                }
                break;
              }
            }
            if (connectedChar) break;
          }
        } catch (e) {
          console.warn('Erro ao varrer serviços genéricos:', e);
        }
      }

      if (connectedChar) {
        this.rxCharacteristic = connectedChar;
        if (connectedChar.properties.notify || connectedChar.properties.indicate) {
          await connectedChar.startNotifications();
          connectedChar.addEventListener('characteristicvaluechanged', (event: Event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            const value = target.value;
            if (value) {
              const decoder = new TextDecoder('utf-8');
              const str = decoder.decode(value);
              this.handleIncomingChunk(str);
            }
          });
        }
      }

      this.status = 'connected';
      this.callbacks.onStatusChange(
        'connected',
        `Conectado com sucesso via BLE a ${device.name || 'HonDash / OBD-II'}!`
      );

      // Initialize ELM327 / OBD-II adapter and start high-frequency live polling
      this.initObdAndStartPolling();

      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.status = 'error';
      this.callbacks.onStatusChange('error', `Falha ao conectar via Bluetooth: ${errorMsg}`);
      return false;
    }
  }

  // Connect via Web Serial (USB) to CYD ESP32-S3 board
  async connectSerial(baudRate = 115200): Promise<boolean> {
    if (!this.isWebSerialSupported) {
      this.callbacks.onStatusChange(
        'error',
        'Web Serial não é suportado neste navegador. Use Google Chrome ou Microsoft Edge no PC/Android.'
      );
      return false;
    }

    try {
      this.callbacks.onStatusChange('connecting', 'Selecione a porta Serial USB da plaquinha CYD ESP32-S3...');
      const serialApi = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPort> } }).serial;
      const port = await serialApi.requestPort();
      await port.open({ baudRate });
      this.serialPort = port;

      this.status = 'connected';
      this.callbacks.onStatusChange('connected', 'Conectado via USB Serial na plaquinha Freenove ESP32-S3!');

      this.readSerialStream(port);
      this.initObdAndStartPolling();
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

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.handleIncomingChunk(value);
        }
      }
    } catch (err) {
      console.warn('Erro ao ler stream Serial:', err);
    } finally {
      reader.releaseLock();
      await readableStreamClosed.catch(() => {});
    }
  }

  // Write text command to BLE or WebSerial device (ELM327 / ESP32)
  async sendCommand(command: string): Promise<boolean> {
    const payload = command.endsWith('\r') || command.endsWith('\n') ? command : command + '\r';
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    // 1. Web Serial Port
    if (this.serialPort && this.serialPort.writable) {
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      } catch (e) {
        console.warn('Erro ao enviar comando Serial:', e);
      }
    }

    // 2. BLE Tx Characteristic
    if (this.txCharacteristic) {
      try {
        if (this.txCharacteristic.writeValueWithoutResponse) {
          await this.txCharacteristic.writeValueWithoutResponse(data);
        } else {
          await this.txCharacteristic.writeValue(data);
        }
        return true;
      } catch (e) {
        console.warn('Erro ao enviar comando BLE:', e);
        return false;
      }
    }

    return false;
  }

  // Initialize ELM327 OBD-II Protocol and start high-frequency live stream
  private initObdAndStartPolling() {
    this.stopPolling();

    // Standard ELM327 AT initialization sequence
    setTimeout(() => this.sendCommand('ATZ\r'), 100);
    setTimeout(() => this.sendCommand('ATE0\r'), 300);
    setTimeout(() => this.sendCommand('ATL0\r'), 500);
    setTimeout(() => this.sendCommand('ATH0\r'), 700);
    setTimeout(() => this.sendCommand('ATSP0\r'), 900);
    setTimeout(() => this.startObdPollingIfSupported(), 1200);
  }

  private startObdPollingIfSupported() {
    this.stopPolling();
    // High-priority PIDs (RPM, Speed, MAP, TPS) polled frequently; Secondary PIDs (ECT, IAT, Outside Temp, Volt, Fuel) interleaved
    const fastPids = ['010C\r', '010D\r', '0111\r', '010B\r'];
    const slowPids = ['0105\r', '010F\r', '0146\r', '0142\r', '012F\r', 'ATRV\r'];

    this.pollIntervalTimer = setInterval(() => {
      if (this.status !== 'connected') return;
      if (!this.txCharacteristic && !this.serialPort) return;

      if (this.elmPollStep % 2 === 0) {
        // Fast PID poll (RPM, Speed, TPS, MAP)
        const fastIdx = (this.elmPollStep / 2) % fastPids.length;
        this.sendCommand(fastPids[fastIdx]);
      } else {
        // Secondary PID poll (Coolant Temp, Intake Temp, Ambient Temp, Volt, Fuel)
        const slowIdx = Math.floor(this.elmPollStep / 2) % slowPids.length;
        this.sendCommand(slowPids[slowIdx]);
      }

      this.elmPollStep++;
    }, 60);
  }

  private stopPolling() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  // Buffer and parse incoming text stream
  private handleIncomingChunk(chunk: string) {
    this.rawBuffer += chunk;

    // Check for complete JSON object
    const startIdx = this.rawBuffer.indexOf('{');
    const endIdx = this.rawBuffer.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      const jsonStr = this.rawBuffer.substring(startIdx, endIdx + 1);
      this.parseIncomingData(jsonStr);
      this.rawBuffer = this.rawBuffer.substring(endIdx + 1);
      return;
    }

    // Check for newline delimited strings (CSV or ELM327 responses)
    if (this.rawBuffer.includes('\n') || this.rawBuffer.includes('\r') || this.rawBuffer.includes('>')) {
      const lines = this.rawBuffer.split(/[\r\n>]+/);
      this.rawBuffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim().length > 0) {
          this.parseIncomingData(line.trim());
        }
      }
    }

    // Limit buffer length to prevent memory leaks
    if (this.rawBuffer.length > 2048) {
      this.rawBuffer = this.rawBuffer.substring(this.rawBuffer.length - 512);
    }
  }

  // Parses HonDash JSON, CSV, OBD-II Hex & ELM327 ASCII strings in real-time
  private parseIncomingData(raw: string) {
    if (!raw || raw.length === 0) return;

    // 1. JSON Telemetry Packet from HonDash ESP32-S3
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        const rpmVal = parsed.rpm ?? parsed.RPM;
        const speedVal = parsed.spd ?? parsed.speed ?? parsed.SPD;
        const ectVal = parsed.ect ?? parsed.ECT ?? parsed.coolant;
        const iatVal = parsed.iat ?? parsed.IAT;
        const mapVal = parsed.map ?? parsed.MAP;
        const tpsVal = parsed.tps ?? parsed.TPS;
        const afrVal = parsed.afr ?? parsed.AFR;
        const voltVal = parsed.volt ?? parsed.bat ?? parsed.VOLT;
        const vtecVal = parsed.vtec === 1 || parsed.vtec === true || (typeof rpmVal === 'number' && rpmVal >= 5200);
        const dtcVal = Array.isArray(parsed.dtc) ? parsed.dtc : undefined;

        this.callbacks.onTelemetryData({
          ...(typeof rpmVal === 'number' ? { rpm: Math.round(rpmVal) } : {}),
          ...(typeof speedVal === 'number' ? { speed: Math.round(speedVal) } : {}),
          ...(typeof ectVal === 'number' ? { ect: parseFloat(ectVal.toFixed(1)) } : {}),
          ...(typeof iatVal === 'number' ? { iat: parseFloat(iatVal.toFixed(1)) } : {}),
          ...(typeof mapVal === 'number' ? { map: Math.round(mapVal) } : {}),
          ...(typeof tpsVal === 'number' ? { tps: Math.round(tpsVal) } : {}),
          ...(typeof afrVal === 'number' ? { afr: parseFloat(afrVal.toFixed(2)) } : {}),
          ...(typeof voltVal === 'number' ? { batteryVoltage: parseFloat(voltVal.toFixed(1)) } : {}),
          ...(typeof vtecVal === 'boolean' ? { vtecActive: vtecVal } : {}),
          ...(typeof parsed.gear === 'number' ? { gear: parsed.gear } : {}),
          ...(typeof parsed.fuel === 'number' ? { fuelLevelPct: parsed.fuel } : {}),
          ...(dtcVal ? { dtcCodes: dtcVal, checkEngineLight: dtcVal.length > 0 } : {}),
          ...(typeof parsed.insideTemp === 'number' ? { insideTemp: parsed.insideTemp } : {}),
          ...(typeof parsed.outsideTemp === 'number' ? { outsideTemp: parsed.outsideTemp } : {})
        });
        return;
      } catch {
        // Not valid JSON, continue to next parsers
      }
    }

    // 2. HonDash CSV telemetry string "HD,RPM,SPD,ECT,IAT,MAP,TPS,VTEC,AFR,VOLT,INSIDE,OUTSIDE"
    if (raw.startsWith('HD,') || raw.startsWith('ECU,')) {
      const parts = raw.split(',');
      if (parts.length >= 7) {
        const rpm = parseFloat(parts[1]) || 0;
        const speed = parseFloat(parts[2]) || 0;
        const ect = parseFloat(parts[3]) || 0;
        const iat = parseFloat(parts[4]) || 0;
        const map = parseFloat(parts[5]) || 0;
        const tps = parseFloat(parts[6]) || 0;
        const vtec = parts[7] === '1' || rpm >= 5200;
        const afr = parts.length > 8 ? parseFloat(parts[8]) || 14.7 : 14.7;
        const volt = parts.length > 9 ? parseFloat(parts[9]) || 14.2 : 14.2;
        const inside = parts.length > 10 ? parseFloat(parts[10]) : undefined;
        const outside = parts.length > 11 ? parseFloat(parts[11]) : undefined;

        this.callbacks.onTelemetryData({
          rpm: Math.round(rpm),
          speed: Math.round(speed),
          ect: parseFloat(ect.toFixed(1)),
          iat: parseFloat(iat.toFixed(1)),
          map: Math.round(map),
          tps: Math.round(tps),
          vtecActive: vtec,
          afr: parseFloat(afr.toFixed(2)),
          batteryVoltage: parseFloat(volt.toFixed(1)),
          ...(typeof inside === 'number' ? { insideTemp: inside } : {}),
          ...(typeof outside === 'number' ? { outsideTemp: outside } : {})
        });
        return;
      }
    }

    // 3. OBD-II ELM327 Standard Responses & Multi-PID Search
    const cleaned = raw.replace(/[\s\r\n>]+/g, '').toUpperCase();
    const liveUpdates: Partial<TelemetryData> = {};

    // 41 0C: Engine RPM ((A*256)+B)/4
    const rpmMatch = cleaned.match(/410C([0-9A-F]{4})/i);
    if (rpmMatch) {
      const a = parseInt(rpmMatch[1].substring(0, 2), 16);
      const b = parseInt(rpmMatch[1].substring(2, 4), 16);
      if (!isNaN(a) && !isNaN(b)) {
        const rpm = Math.round(((a * 256) + b) / 4);
        liveUpdates.rpm = rpm;
        liveUpdates.vtecActive = rpm >= 5200;
      }
    }

    // 41 0D: Vehicle Speed A km/h
    const speedMatch = cleaned.match(/410D([0-9A-F]{2})/i);
    if (speedMatch) {
      const speed = parseInt(speedMatch[1], 16);
      if (!isNaN(speed)) {
        liveUpdates.speed = speed;
      }
    }

    // 41 05: Engine Coolant Temperature (ECT) A - 40 °C
    const ectMatch = cleaned.match(/4105([0-9A-F]{2})/i);
    if (ectMatch) {
      const ect = parseInt(ectMatch[1], 16) - 40;
      if (!isNaN(ect)) {
        liveUpdates.ect = ect;
      }
    }

    // 41 0F: Intake Air Temperature (IAT) A - 40 °C
    const iatMatch = cleaned.match(/410F([0-9A-F]{2})/i);
    if (iatMatch) {
      const iat = parseInt(iatMatch[1], 16) - 40;
      if (!isNaN(iat)) {
        liveUpdates.iat = iat;
      }
    }

    // 41 0B: Intake Manifold Absolute Pressure (MAP) A kPa
    const mapMatch = cleaned.match(/410B([0-9A-F]{2})/i);
    if (mapMatch) {
      const map = parseInt(mapMatch[1], 16);
      if (!isNaN(map)) {
        liveUpdates.map = map;
      }
    }

    // 41 11: Throttle Position (TPS) (A * 100) / 255 %
    const tpsMatch = cleaned.match(/4111([0-9A-F]{2})/i);
    if (tpsMatch) {
      const tpsRaw = parseInt(tpsMatch[1], 16);
      if (!isNaN(tpsRaw)) {
        liveUpdates.tps = Math.round((tpsRaw * 100) / 255);
      }
    }

    // 41 46: Ambient Air Temperature (Outside & Inside Temp) A - 40 °C
    const ambientMatch = cleaned.match(/4146([0-9A-F]{2})/i);
    if (ambientMatch) {
      const outside = parseInt(ambientMatch[1], 16) - 40;
      if (!isNaN(outside)) {
        liveUpdates.outsideTemp = outside;
        liveUpdates.insideTemp = Math.round((outside - 0.6) * 10) / 10;
      }
    }

    // 41 2F: Fuel Tank Level Input (A * 100) / 255 %
    const fuelMatch = cleaned.match(/412F([0-9A-F]{2})/i);
    if (fuelMatch) {
      const fuelRaw = parseInt(fuelMatch[1], 16);
      if (!isNaN(fuelRaw)) {
        liveUpdates.fuelLevelPct = Math.round((fuelRaw * 100) / 255);
      }
    }

    // 41 34: Air-Fuel Equivalence Ratio ((A*256)+B)/32768 * 14.7
    const afrMatch = cleaned.match(/4134([0-9A-F]{4})/i);
    if (afrMatch) {
      const a = parseInt(afrMatch[1].substring(0, 2), 16);
      const b = parseInt(afrMatch[1].substring(2, 4), 16);
      if (!isNaN(a) && !isNaN(b)) {
        const ratio = ((a * 256) + b) / 32768;
        liveUpdates.afr = parseFloat((ratio * 14.7).toFixed(2));
      }
    }

    // 41 42: Control Module Voltage ((A*256)+B)/1000 V
    const voltMatch = cleaned.match(/4142([0-9A-F]{4})/i);
    if (voltMatch) {
      const a = parseInt(voltMatch[1].substring(0, 2), 16);
      const b = parseInt(voltMatch[1].substring(2, 4), 16);
      if (!isNaN(a) && !isNaN(b)) {
        liveUpdates.batteryVoltage = parseFloat((((a * 256) + b) / 1000).toFixed(1));
      }
    }

    // Direct Voltage response e.g. "14.2V" or "13.8 V"
    const directVoltMatch = raw.match(/([0-9]{1,2}\.[0-9]{1,2})\s*V/i);
    if (directVoltMatch) {
      const volt = parseFloat(directVoltMatch[1]);
      if (!isNaN(volt) && volt >= 8 && volt <= 18) {
        liveUpdates.batteryVoltage = volt;
      }
    }

    // 4. Honda DLC / OBD1 / K-Line direct hex frame (e.g. "20 00 E8 58 4A 60 ...")
    if (cleaned.length >= 24 && /^[0-9A-F]+$/.test(cleaned) && !cleaned.startsWith('41')) {
      try {
        const hex = cleaned;
        const rpmHigh = parseInt(hex.substring(2, 4), 16);
        const rpmLow = parseInt(hex.substring(4, 6), 16);
        const speedKmh = parseInt(hex.substring(6, 8), 16);
        const ectRaw = parseInt(hex.substring(8, 10), 16);
        const iatRaw = parseInt(hex.substring(10, 12), 16);
        const mapRaw = parseInt(hex.substring(12, 14), 16);
        const tpsRaw = parseInt(hex.substring(14, 16), 16);
        const voltRaw = parseInt(hex.substring(16, 18), 16);

        if (!isNaN(rpmHigh) && !isNaN(rpmLow)) {
          const calcRpm = Math.round(((rpmHigh * 256) + rpmLow) / 4);
          liveUpdates.rpm = calcRpm;
          liveUpdates.vtecActive = calcRpm >= 5200;
          if (!isNaN(speedKmh)) liveUpdates.speed = speedKmh;
          if (!isNaN(ectRaw)) liveUpdates.ect = ectRaw - 40;
          if (!isNaN(iatRaw)) liveUpdates.iat = iatRaw - 40;
          if (!isNaN(mapRaw)) liveUpdates.map = mapRaw;
          if (!isNaN(tpsRaw)) liveUpdates.tps = Math.round((tpsRaw * 100) / 255);
          if (!isNaN(voltRaw)) liveUpdates.batteryVoltage = parseFloat((voltRaw * 0.1).toFixed(1));
        }
      } catch {
        // ignore parse error
      }
    }

    // Broadcast valid updates to dashboard
    if (Object.keys(liveUpdates).length > 0) {
      this.callbacks.onTelemetryData(liveUpdates);
    }
  }

  // Disconnect all Bluetooth and Serial sessions
  async disconnect() {
    this.stopPolling();

    if (this.rxCharacteristic) {
      try {
        await this.rxCharacteristic.stopNotifications();
      } catch {
        // ignore
      }
      this.rxCharacteristic = null;
    }
    this.txCharacteristic = null;

    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      try {
        this.bluetoothDevice.gatt.disconnect();
      } catch {
        // ignore
      }
      this.bluetoothDevice = null;
      this.gattServer = null;
    }

    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {
        // ignore
      }
      this.serialReader = null;
    }

    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {
        // ignore
      }
      this.serialPort = null;
    }

    this.status = 'disconnected';
    this.callbacks.onStatusChange('disconnected', 'Desconectado');
  }
}
