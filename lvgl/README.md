# HonDASH - Dashboard Honda Civic em C / C++ com LVGL (v8 / v9)

Este diretório contém a conversão completa do painel **HonDASH (Cyber HUD)** para **LVGL**, biblioteca gráfica de alta performance desenvolvida para microcontroladores como **ESP32, ESP32-S3, STM32 e Raspberry Pi Pico**.

---

## 📁 Estrutura dos Arquivos

- **`hondash_ui.h`**: Cabeçalho com estruturas de telemetria OBD2/CAN-Bus, paletas de cores, configurações e protótipos das funções da UI.
- **`hondash_ui.c`**: Implementação completa da interface gráfica:
  - **Quadrante 1**: Velocímetro Digital (KM/H ou MPH), Indicador de Marcha, Barra de RPM dinâmica com alerta de Redline (> 7000 RPM).
  - **Quadrante 2**: Relógio Digital HUD com segundos, indicador AM/PM ou 24h, linha com ponto neon pulsante e Data em caixa alta. Clique na área para alternar 12h/24h.
  - **Quadrante 3**: Perfil do Veículo (Civic Wireframe / GIF) com neon underglow e toque para abrir modo tela cheia/expandido. Ao tocar em qualquer lugar do modal ele fecha/minimiza.
  - **Quadrante 4**: Equalizador de Áudio (Audio Spectrum Visualizer) animado com 8 barras em tempo real.
  - **Barra Inferior**: Temperatura do Líquido de Arrefecimento (CLT), Tensão da Bateria (BAT 14.2V), Marcador de Combustível (FUEL), Badges de alerta VTEC e CEL (Check Engine).
- **`main_esp32.cpp`**: Firmware de exemplo para Arduino / ESP32 com inicialização da biblioteca TFT_eSPI, buffer duplo do LVGL, touch e thread FreeRTOS de telemetria.
- **`lv_conf.h`**: Configurações otimizadas do LVGL (16-bit RGB565, fontes Montserrat, widgets habilitados).
- **`platformio.ini`**: Configuração pronta para compilação no VS Code / PlatformIO para ESP32 e ESP32-CYD (Cheap Yellow Display).

---

## 🚀 Como Gravar no ESP32

### Opção 1: PlatformIO (Recomendado)
1. Instale a extensão **PlatformIO IDE** no VS Code.
2. Abra a pasta do projeto.
3. Conecte o ESP32 na porta USB.
4. Clique em **Build** e depois **Upload**.

### Opção 2: Arduino IDE
1. Instale o pacote de placas ESP32 pelo Boards Manager.
2. Instale as bibliotecas:
   - `lvgl` (versão 8.3.x)
   - `TFT_eSPI` (configure o seu display no arquivo `User_Setup.h` da biblioteca)
3. Abra o arquivo `main_esp32.cpp`, inclua `hondash_ui.c` e `hondash_ui.h` na mesma pasta do sketch.
4. Selecione a porta COM e clique em **Carregar**.

---

## 🔌 Conexão com Honda OBD2 / K-Line / CAN-Bus
Para alimentar a telemetria com dados reais do Civic:
- Chame a função:
  ```c
  hondash_telemetry_t telem;
  telem.speed_kmh = obd_get_speed();
  telem.rpm = obd_get_rpm();
  telem.coolant_temp_c = obd_get_clt();
  telem.vtec_active = (telem.rpm >= 5800);
  hondash_update_telemetry(&telem);
  ```
