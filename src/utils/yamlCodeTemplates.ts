/**
 * Declarative YAML Configurations for HonDASH Cyber HUD
 * Supported platforms: ESPHome (Native LVGL), OpenHASP, Home Assistant Lovelace, and HonDASH Master Spec.
 */

export interface YamlConfigFile {
  id: string;
  name: string;
  category: 'ESPHome LVGL' | 'OpenHASP' | 'Home Assistant' | 'Master Architecture';
  description: string;
  target: string;
  code: string;
}

export const YAML_CONFIG_FILES: YamlConfigFile[] = [
  {
    id: 'hondash_esphome_lvgl',
    name: 'hondash_esphome_lvgl.yaml',
    category: 'ESPHome LVGL',
    description: 'Firmware ESPHome completo com motor LVGL nativo em YAML para ESP32 e ESP32-CYD',
    target: 'ESP32 / ESP32-CYD (ILI9341 + XPT2046)',
    code: `# ==============================================================================
# HonDASH Cyber HUD - ESPHome Native LVGL Firmware (YAML)
# Target: ESP32 / ESP32-CYD (2.8" / 3.2" 320x240 ILI9341 + XPT2046)
# Component: Native ESPHome 'lvgl' Declarative Engine
# ==============================================================================

esphome:
  name: hondash-cyber-hud
  friendly_name: "HonDASH Cyber HUD"
  comment: "Honda Civic Digital Cyber HUD Dashboard powered by ESPHome & LVGL"

esp32:
  board: esp32dev
  framework:
    type: esp-idf

# ------------------------------------------------------------------------------
# Wi-Fi & OTA (Opcional para conectividade e atualizações wireless na garagem)
# ------------------------------------------------------------------------------
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "HonDASH-Hotspot"
    password: "hondashpassword"

captive_portal:

ota:
  - platform: esphome

api:
  encryption:
    key: !secret api_key

logger:
  level: INFO

# ------------------------------------------------------------------------------
# Hardware Pins (SPI Display ILI9341 + Touch XPT2046 do ESP32-CYD)
# ------------------------------------------------------------------------------
spi:
  - id: tft_spi
    clk_pin: GPIO14
    mosi_pin: GPIO13
    miso_pin: GPIO12

display:
  - platform: ili9xxx
    id: hondash_tft
    model: ILI9341
    spi_id: tft_spi
    cs_pin: GPIO15
    dc_pin: GPIO2
    reset_pin: GPIO0
    dimensions:
      width: 320
      height: 240
    rotation: 90
    auto_clear_enabled: false

touchscreen:
  - platform: xpt2046
    id: hondash_touch
    spi_id: tft_spi
    cs_pin: GPIO33
    interrupt_pin: GPIO36
    calibration:
      x_min: 300
      x_max: 3800
      y_min: 300
      y_max: 3800

# ------------------------------------------------------------------------------
# Fontes Tipográficas
# ------------------------------------------------------------------------------
font:
  - file: "gfonts://Orbitron"
    id: font_speed_large
    size: 40
    glyphs: "0123456789 KM/H"

  - file: "gfonts://Orbitron"
    id: font_clock_medium
    size: 26
    glyphs: "0123456789: APM"

  - file: "gfonts://Share Tech Mono"
    id: font_tech_mono
    size: 13

  - file: "gfonts://Share Tech Mono"
    id: font_tech_small
    size: 10

# ------------------------------------------------------------------------------
# Sensores Automotivos de Telemetria (Simulados ou via CAN-Bus / BLE OBD2)
# ------------------------------------------------------------------------------
sensor:
  - platform: template
    id: vehicle_speed
    name: "Vehicle Speed"
    unit_of_measurement: "km/h"
    accuracy_decimals: 0
    update_interval: 100ms
    on_value:
      then:
        - lvgl.label.update:
            id: lbl_speed_val
            text: !lambda return to_string((int)x);

  - platform: template
    id: engine_rpm
    name: "Engine RPM"
    unit_of_measurement: "RPM"
    accuracy_decimals: 0
    update_interval: 50ms
    on_value:
      then:
        - lvgl.bar.update:
            id: bar_rpm_meter
            value: !lambda return (int)x;
        - lvgl.label.update:
            id: lbl_rpm_val
            text: !lambda return to_string((int)x) + " RPM";

  - platform: template
    id: coolant_temp
    name: "Coolant Temp (CLT)"
    unit_of_measurement: "°C"
    accuracy_decimals: 0
    on_value:
      then:
        - lvgl.label.update:
            id: lbl_clt_val
            text: !lambda return to_string((int)x) + "°C";

  - platform: template
    id: battery_voltage
    name: "Battery Voltage"
    unit_of_measurement: "V"
    accuracy_decimals: 1
    on_value:
      then:
        - lvgl.label.update:
            id: lbl_bat_val
            text: !lambda return str_sprintf("%.1fV", x);

  - platform: template
    id: fuel_level
    name: "Fuel Level"
    unit_of_measurement: "%"
    accuracy_decimals: 0
    on_value:
      then:
        - lvgl.label.update:
            id: lbl_fuel_val
            text: !lambda return to_string((int)x) + "%";

binary_sensor:
  - platform: template
    id: vtec_active_sensor
    name: "VTEC Status"
    on_state:
      then:
        - lvgl.obj.update:
            id: pill_vtec_lamp
            bg_color: !lambda return x ? 0xEF4444 : 0x27272A;

# Relógio Interno RTC / SNTP
time:
  - platform: sntp
    id: sntp_time
    timezone: "America/Sao_Paulo"
    on_time:
      - seconds: 0
        minutes: "*"
        then:
          - lvgl.label.update:
              id: lbl_hud_time
              text: !lambda return id(sntp_time).now().strftime("%H:%M");
          - lvgl.label.update:
              id: lbl_hud_date
              text: !lambda return id(sntp_time).now().strftime("%a, %d %b %Y");

# ==============================================================================
# MOTOR DECLARATIVO NATIVO LVGL EM YAML (ESPHOME)
# ==============================================================================
lvgl:
  display: hondash_tft
  touchscreens:
    - hondash_touch
  buffer_size: 50%
  bg_color: 0x09090B
  color_depth: 16

  # ----------------------------------------------------------------------------
  # Estilos Reutilizáveis (Paleta Type R & Cyberpunk)
  # ----------------------------------------------------------------------------
  styles:
    style_card:
      bg_color: 0x121215
      border_color: 0x27272A
      border_width: 1
      radius: 10
      pad_all: 8
      shadow_width: 0

    style_card_active:
      border_color: 0xEF4444
      border_width: 1

    style_text_title:
      text_color: 0xA1A1AA
      text_font: font_tech_small

    style_text_bold:
      text_color: 0xFFFFFF
      text_font: font_tech_mono

  # ----------------------------------------------------------------------------
  # Telas e Layout do HonDASH Cyber HUD
  # ----------------------------------------------------------------------------
  pages:
    - id: main_dash_page
      bg_color: 0x09090B
      widgets:
        # ======================================================================
        # QUADRANTE 1: VELOCIDADE & RPM (Superior Esquerdo)
        # ======================================================================
        - obj:
            id: quad_1_speed
            x: 4
            y: 4
            width: 154
            height: 98
            styles: [style_card]
            widgets:
              - label:
                  x: 6
                  y: 4
                  text: "VELOCIDADE // VEL"
                  styles: [style_text_title]

              - label:
                  id: lbl_speed_val
                  x: 10
                  y: 18
                  text: "0"
                  text_font: font_speed_large
                  text_color: 0xFFFFFF

              - label:
                  x: 75
                  y: 42
                  text: "KM/H"
                  text_font: font_tech_mono
                  text_color: 0xEF4444

              - obj:
                  id: badge_gear
                  x: 116
                  y: 8
                  width: 26
                  height: 26
                  radius: 6
                  bg_color: 0x221215
                  border_color: 0xEF4444
                  border_width: 1
                  widgets:
                    - label:
                        id: lbl_gear_val
                        align: CENTER
                        text: "N"
                        text_font: font_tech_mono
                        text_color: 0xFFFFFF

              # Barra de RPM
              - bar:
                  id: bar_rpm_meter
                  x: 6
                  y: 74
                  width: 138
                  height: 12
                  min_value: 0
                  max_value: 9000
                  value: 0
                  bg_color: 0x1E1E24
                  indicator:
                    bg_color: 0xEF4444
                    radius: 2

              - label:
                  id: lbl_rpm_val
                  x: 6
                  y: 87
                  text: "0 RPM"
                  styles: [style_text_title]

        # ======================================================================
        # QUADRANTE 2: RELÓGIO DIGITAL & DATA HUD (Superior Direito)
        # ======================================================================
        - obj:
            id: quad_2_clock
            x: 162
            y: 4
            width: 154
            height: 98
            styles: [style_card]
            clickable: true
            on_click:
              then:
                - logger.log: "HUD Clock clicado - alternando formato 12/24h"
            widgets:
              - label:
                  x: 6
                  y: 4
                  text: "HORA // DATA HUD"
                  styles: [style_text_title]

              - label:
                  id: lbl_hud_time
                  align: CENTER
                  y: -4
                  text: "12:00"
                  text_font: font_clock_medium
                  text_color: 0xFFFFFF

              - label:
                  id: lbl_hud_date
                  align: BOTTOM_MID
                  y: -6
                  text: "TER, 05 SET 2026"
                  styles: [style_text_title]
                  text_color: 0xEF4444

        # ======================================================================
        # QUADRANTE 3: SILHUETA DO CIVIC (Inferior Esquerdo)
        # ======================================================================
        - obj:
            id: quad_3_civic
            x: 4
            y: 106
            width: 154
            height: 98
            styles: [style_card]
            clickable: true
            on_click:
              then:
                - lvgl.page.show: page_fullscreen_car
            widgets:
              - label:
                  x: 6
                  y: 4
                  text: "CIVIC // DIAGNOSTIC"
                  styles: [style_text_title]

              - label:
                  align: CENTER
                  y: -6
                  text: "==[ CIVIC COUPE ]=="
                  text_font: font_tech_mono
                  text_color: 0xEF4444

              - obj:
                  id: pill_vtec_lamp
                  x: 6
                  y: 72
                  width: 64
                  height: 16
                  radius: 4
                  bg_color: 0x27272A
                  widgets:
                    - label:
                        align: CENTER
                        text: "VTEC"
                        text_font: font_tech_small
                        text_color: 0xFFFFFF

              - obj:
                  id: pill_ecu_online
                  x: 74
                  y: 72
                  width: 70
                  height: 16
                  radius: 4
                  bg_color: 0x14532D
                  widgets:
                    - label:
                        align: CENTER
                        text: "ECU OK"
                        text_font: font_tech_small
                        text_color: 0x86EFAC

        # ======================================================================
        # QUADRANTE 4: ESPECTRO DE ÁUDIO (Inferior Direito)
        # ======================================================================
        - obj:
            id: quad_4_audio
            x: 162
            y: 106
            width: 154
            height: 98
            styles: [style_card]
            widgets:
              - label:
                  x: 6
                  y: 4
                  text: "ÁUDIO // EQUALIZADOR"
                  styles: [style_text_title]

              - bar: { x: 10, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 65, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 26, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 45, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 42, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 80, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 58, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 92, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 74, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 70, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 90, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 55, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 106, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 35, indicator: { bg_color: 0xEF4444 } }
              - bar: { x: 122, y: 28, width: 12, height: 50, min_value: 0, max_value: 100, value: 20, indicator: { bg_color: 0xEF4444 } }

              - label:
                  align: BOTTOM_MID
                  y: -4
                  text: "HONDA CIVIC AUDIO // AUX"
                  styles: [style_text_title]

        # ======================================================================
        # BARRA INFERIOR DE SENSORES DOCK (CLT, BATERIA, COMBUSTÍVEL, VTEC, CEL)
        # ======================================================================
        - obj:
            id: bottom_dock_bar
            x: 4
            y: 208
            width: 312
            height: 28
            styles: [style_card]
            pad_all: 4
            widgets:
              # CLT
              - label:
                  x: 8
                  y: 4
                  text: "CLT:"
                  styles: [style_text_title]
              - label:
                  id: lbl_clt_val
                  x: 34
                  y: 4
                  text: "88°C"
                  styles: [style_text_bold]

              # BATERIA
              - label:
                  x: 86
                  y: 4
                  text: "BAT:"
                  styles: [style_text_title]
              - label:
                  id: lbl_bat_val
                  x: 114
                  y: 4
                  text: "14.2V"
                  styles: [style_text_bold]

              # COMBUSTÍVEL
              - label:
                  x: 168
                  y: 4
                  text: "GAS:"
                  styles: [style_text_title]
              - label:
                  id: lbl_fuel_val
                  x: 198
                  y: 4
                  text: "72%"
                  styles: [style_text_bold]

              # VTEC STATUS
              - label:
                  x: 240
                  y: 4
                  text: "VTEC"
                  text_font: font_tech_mono
                  text_color: 0xEF4444

              # CEL
              - label:
                  x: 280
                  y: 4
                  text: "CEL"
                  text_font: font_tech_mono
                  text_color: 0x52525B

    # ==========================================================================
    # MODAL EXPANDIDO / TELA CHEIA DO CARRO COM RELÓGIO HUD
    # ==========================================================================
    - id: page_fullscreen_car
      bg_color: 0x050507
      clickable: true
      on_click:
        then:
          - lvgl.page.show: main_dash_page
      widgets:
        - label:
            align: TOP_MID
            y: 10
            text: "HONDA CIVIC // TELEMETRIA EXPANDIDA"
            text_font: font_tech_mono
            text_color: 0xEF4444

        - label:
            align: CENTER
            y: -10
            text: "===[ HONDA CIVIC COUPE EJ/EK ]==="
            text_font: font_clock_medium
            text_color: 0xFFFFFF

        - label:
            align: BOTTOM_MID
            y: -15
            text: "[ TOQUE EM QUALQUER LUGAR PARA RETORNAR AO PAINEL ]"
            styles: [style_text_title]
`
  },
  {
    id: 'hondash_master_spec',
    name: 'hondash_master_spec.yaml',
    category: 'Master Architecture',
    description: 'Especificação do sistema completo: PIDs OBD2, temas, layout, áudio e BLE',
    target: 'Universal / Firmware / Web / Mobile',
    code: `# ==============================================================================
# HonDASH Cyber HUD - Master System Architecture & UI Specification
# Format: YAML 1.2
# ==============================================================================
metadata:
  name: "HonDASH Cyber HUD"
  version: "2.4.0"
  author: "HonDASH Embedded Engineering Team"
  license: "MIT"
  description: >
    Especificação declarativa completa em YAML da arquitetura do painel digital
    HonDASH Cyber HUD para Honda Civic (compatível com ESP32, ESPHome, LVGL e Web).

hardware_targets:
  - id: "esp32_cyd"
    name: "ESP32-CYD (Cheap Yellow Display)"
    soc: "ESP32-D0WDQ6-V3 (Dual Core 240MHz)"
    display: "ILI9341 2.8\\" / 3.2\\" 320x240 SPI"
    touch: "XPT2046 Resistive SPI"
  - id: "esp32_s3_cyd4827"
    name: "ESP32-S3 Sunton 4.3\\" / 5.0\\" 480x272 / 800x480"
    soc: "ESP32-S3 (Dual Core 240MHz, 8MB PSRAM, 16MB Flash)"
    display: "ST7262 RGB Interface"
    touch: "GT911 Capacitive I2C"
  - id: "stm32_blackpill"
    name: "STM32F401 / STM32F411 BlackPill + ST7789"
    display: "ST7789 240x240 / 240x320 SPI"

display_settings:
  orientation: "landscape"
  resolution:
    width: 320
    height: 240
    aspect_ratio: "4:3"
  color_depth: "RGB565_16BIT"
  frame_rate_target_fps: 60
  anti_aliasing: true
  double_buffering: true

themes:
  default_theme: "red"
  palettes:
    red:
      name: "Type R Crimson"
      primary: "#ef4444"
      secondary: "#dc2626"
      accent: "#f87171"
      background: "#09090b"
      surface: "#18181b"
      border: "#27272a"
      glow: "rgba(239, 68, 68, 0.35)"
      text_primary: "#ffffff"
      text_secondary: "#a1a1aa"
    cyan:
      name: "Cyber Neon Cyan"
      primary: "#06b6d4"
      secondary: "#0891b2"
      accent: "#22d3ee"
      background: "#080c14"
      surface: "#0e1726"
      border: "#162844"
      glow: "rgba(6, 182, 212, 0.35)"
      text_primary: "#ffffff"
      text_secondary: "#94a3b8"
    amber:
      name: "JDM Vintage Amber"
      primary: "#f59e0b"
      secondary: "#d97706"
      accent: "#fbbf24"
      background: "#0f0c08"
      surface: "#1c170d"
      border: "#2e2515"
      glow: "rgba(245, 158, 11, 0.35)"
      text_primary: "#ffffff"
      text_secondary: "#a8a29e"
    purple:
      name: "Tokyo Night Synthwave"
      primary: "#a855f7"
      secondary: "#9333ea"
      accent: "#c084fc"
      background: "#0c0814"
      surface: "#170f27"
      border: "#281a44"
      glow: "rgba(168, 85, 247, 0.35)"
      text_primary: "#ffffff"
      text_secondary: "#cbd5e1"
    green:
      name: "Spoon Racing Green"
      primary: "#22c55e"
      secondary: "#16a34a"
      accent: "#4ade80"
      background: "#080f0a"
      surface: "#0e1c12"
      border: "#162e1c"
      glow: "rgba(34, 197, 94, 0.35)"
      text_primary: "#ffffff"
      text_secondary: "#94a3b8"
    white:
      name: "Championship Minimalist"
      primary: "#f8fafc"
      secondary: "#e2e8f0"
      accent: "#ffffff"
      background: "#050505"
      surface: "#121212"
      border: "#262626"
      glow: "rgba(248, 250, 252, 0.25)"
      text_primary: "#ffffff"
      text_secondary: "#737373"

ui_layout:
  type: "grid_2x2_plus_bottom_bar"
  padding_px: 6
  gap_px: 6
  quadrants:
    - id: "quadrant_1_speed_rpm"
      name: "Tachometer & Speedometer"
      grid_position: { row: 1, col: 1, row_span: 1, col_span: 1 }
      widgets:
        - type: "digital_number"
          id: "lbl_speed"
          data_source: "telemetry.speed_kmh"
          font_size: "36pt"
          align: "center"
          sub_label: "KM/H"
        - type: "badge"
          id: "badge_gear"
          data_source: "telemetry.gear"
          mapping:
            "-1": "R"
            "0": "N"
            "1": "1"
            "2": "2"
            "3": "3"
            "4": "4"
            "5": "5"
            "6": "6"
        - type: "progress_bar_arc"
          id: "bar_rpm"
          data_source: "telemetry.rpm"
          min: 0
          max: 9000
          redline_start: 7000
          redline_color: "#ef4444"

    - id: "quadrant_2_clock_hud"
      name: "Digital HUD Clock & Calendar"
      grid_position: { row: 1, col: 2, row_span: 1, col_span: 1 }
      interactive: true
      on_click_action: "toggle_time_format_12_24"
      widgets:
        - type: "digital_clock"
          id: "hud_clock_time"
          show_seconds: true
          separator_pulse_hz: 1.0
          font_family: "Orbitron / Montserrat Bold"
          format: "24h_or_12h"
        - type: "calendar_label"
          id: "hud_clock_date"
          format: "%A, %d %b %Y"
          transform: "uppercase"

    - id: "quadrant_3_vehicle_profile"
      name: "Civic Profile & Diagnostic Status"
      grid_position: { row: 2, col: 1, row_span: 1, col_span: 1 }
      interactive: true
      on_click_action: "open_fullscreen_vehicle_modal"
      widgets:
        - type: "silhouette_image"
          id: "civic_silhouette"
          vector_svg_or_png: "civic_coupe_profile"
        - type: "underglow_effect"
          id: "neon_underglow"
          color_binding: "theme.primary"
          pulse_effect: true
        - type: "status_pill"
          id: "vtec_pill"
          label: "VTEC SYSTEM"
          active_when: "telemetry.vtec_active == true"
          active_color: "#ef4444"
        - type: "status_pill"
          id: "ecu_status_pill"
          label: "ECU ONLINE"
          active_when: "connection.online == true"

    - id: "quadrant_4_audio_spectrum"
      name: "Equalizer & Audio Spectrum"
      grid_position: { row: 2, col: 2, row_span: 1, col_span: 1 }
      interactive: true
      on_click_action: "cycle_audio_animation_mode"
      widgets:
        - type: "bar_equalizer"
          id: "audio_fft_bars"
          bands_count: 8
          frequency_labels: ["60Hz", "150Hz", "400Hz", "1kHz", "2.5kHz", "6kHz", "10kHz", "16kHz"]
          bar_color: "theme.primary"
          peak_indicator: true
          decay_rate: 0.88
        - type: "now_playing_marquee"
          id: "track_label"
          default_text: "HONDA CIVIC AUDIO SYSTEM // AUX"

  bottom_bar:
    id: "telemetry_dock"
    grid_position: { row: 3, col: 1, row_span: 1, col_span: 2 }
    height_px: 28
    gauges:
      - id: "gauge_clt"
        label: "CLT"
        unit: "°C"
        data_source: "telemetry.coolant_temp_c"
        warning_above: 102.0
        critical_above: 110.0
      - id: "gauge_battery"
        label: "BAT"
        unit: "V"
        data_source: "telemetry.battery_volts"
        warning_below: 12.0
        warning_above: 15.0
      - id: "gauge_fuel"
        label: "FUEL"
        unit: "%"
        data_source: "telemetry.fuel_pct"
        warning_below: 15.0
      - id: "indicator_vtec"
        label: "VTEC"
        data_source: "telemetry.vtec_active"
        indicator_type: "lamp"
        lamp_color: "#ef4444"
      - id: "indicator_cel"
        label: "CEL"
        data_source: "telemetry.check_engine"
        indicator_type: "lamp"
        lamp_color: "#f59e0b"

telemetry_pids:
  protocol: "ISO 14230-4 KWP / ISO 15765-4 CAN"
  baud_rates: [10400, 38400, 500000]
  pids:
    - name: "ENGINE_RPM"
      service: "0x01"
      pid: "0x0C"
      formula: "((A * 256) + B) / 4"
      unit: "rpm"
    - name: "VEHICLE_SPEED"
      service: "0x01"
      pid: "0x0D"
      formula: "A"
      unit: "km/h"
    - name: "COOLANT_TEMP"
      service: "0x01"
      pid: "0x05"
      formula: "A - 40"
      unit: "celsius"
    - name: "INTAKE_AIR_TEMP"
      service: "0x01"
      pid: "0x0F"
      formula: "A - 40"
      unit: "celsius"
    - name: "THROTTLE_POS"
      service: "0x01"
      pid: "0x11"
      formula: "(A * 100) / 255"
      unit: "percent"
    - name: "CONTROL_MODULE_VOLTAGE"
      service: "0x01"
      pid: "0x42"
      formula: "((A * 256) + B) / 1000"
      unit: "volts"
    - name: "FUEL_LEVEL"
      service: "0x01"
      pid: "0x2F"
      formula: "(A * 100) / 255"
      unit: "percent"
    - name: "HONDA_VTEC_ENGAGEMENT"
      service: "0x22"
      pid: "0x1102"
      formula: "(A & 0x04) != 0"
      unit: "boolean"

bluetooth_ble:
  device_name_filter: ["HonDASH", "OBDII", "VEEPEAK", "OBDLink"]
  service_uuid: "0000fff0-0000-1000-8000-00805f9b34fb"
  characteristic_tx_uuid: "0000fff1-0000-1000-8000-00805f9b34fb"
  characteristic_rx_uuid: "0000fff2-0000-1000-8000-00805f9b34fb"
  polling_interval_ms: 50

sound_alerts:
  vtec_kick:
    enabled: true
    audio_synthesis: "dual_sine_synthesizer"
    base_freq_hz: 520
    boost_freq_hz: 880
    duration_ms: 180
  shift_beep:
    enabled: true
    trigger_rpm: 6900
    tone_freq_hz: 2400
    beep_count: 2
    duration_ms: 80
`
  },
  {
    id: 'hondash_openhasp',
    name: 'hondash_openhasp.yaml',
    category: 'OpenHASP',
    description: 'Definição de objetos e layout para firmware OpenHASP em displays touch ESP32',
    target: 'OpenHASP / ESP32 Touch Screen (320x240)',
    code: `# ==============================================================================
# HonDASH Cyber HUD - OpenHASP Declarative Layout (YAML / JSONL)
# Platform: ESP32 OpenHASP Firmware
# Target: 320x240 Display (ESP32-CYD)
# ==============================================================================

plate:
  name: "hondash-cyd"
  comment: "OpenHASP Cyber HUD for Honda Civic"

pages:
  # ----------------------------------------------------------------------------
  # PÁGINA 1: DASHBOARD PRINCIPAL
  # ----------------------------------------------------------------------------
  - page: 1
    comment: "Main HonDASH Cyber HUD View"
    objects:
      # Fundo do Painel
      - id: 10
        obj: "obj"
        x: 0
        y: 0
        w: 320
        h: 240
        bg_color: "#09090b"
        border_width: 0

      # ------------------------------------------------------------------------
      # QUADRANTE 1: VELOCIDADE & RPM
      # ------------------------------------------------------------------------
      - id: 100
        obj: "obj"
        x: 4
        y: 4
        w: 154
        h: 98
        bg_color: "#121215"
        border_color: "#27272a"
        border_width: 1
        radius: 8

      - id: 101
        obj: "label"
        x: 10
        y: 8
        w: 140
        h: 14
        text: "VELOCIDADE // VEL"
        text_color: "#a1a1aa"
        text_font: 12

      - id: 102
        obj: "label"
        x: 10
        y: 22
        w: 80
        h: 46
        text: "0"
        text_color: "#ffffff"
        text_font: 32

      - id: 103
        obj: "label"
        x: 75
        y: 46
        w: 50
        h: 16
        text: "KM/H"
        text_color: "#ef4444"
        text_font: 14

      - id: 104
        obj: "btn"
        x: 120
        y: 10
        w: 24
        h: 24
        radius: 6
        bg_color: "#201215"
        border_color: "#ef4444"
        border_width: 1
        text: "N"
        text_color: "#ffffff"

      - id: 105
        obj: "bar"
        x: 10
        y: 74
        w: 134
        h: 12
        min: 0
        max: 9000
        val: 0
        bg_color: "#1e1e24"
        indicator_bg_color: "#ef4444"

      - id: 106
        obj: "label"
        x: 10
        y: 87
        w: 134
        h: 12
        text: "0 RPM"
        text_color: "#71717a"
        text_font: 10

      # ------------------------------------------------------------------------
      # QUADRANTE 2: RELÓGIO & DATA HUD
      # ------------------------------------------------------------------------
      - id: 200
        obj: "btn"
        x: 162
        y: 4
        w: 154
        h: 98
        bg_color: "#121215"
        border_color: "#27272a"
        border_width: 1
        radius: 8

      - id: 201
        obj: "label"
        x: 168
        y: 8
        w: 140
        h: 14
        text: "HORA // DATA HUD"
        text_color: "#a1a1aa"
        text_font: 12

      - id: 202
        obj: "label"
        x: 168
        y: 30
        w: 140
        h: 36
        text: "12:00:00"
        text_color: "#ffffff"
        text_font: 24
        align: "center"

      - id: 203
        obj: "label"
        x: 168
        y: 72
        w: 140
        h: 16
        text: "TER, 05 SET 2026"
        text_color: "#ef4444"
        text_font: 12
        align: "center"

      # ------------------------------------------------------------------------
      # QUADRANTE 3: STATUS DO CIVIC
      # ------------------------------------------------------------------------
      - id: 300
        obj: "btn"
        x: 4
        y: 106
        w: 154
        h: 98
        bg_color: "#121215"
        border_color: "#27272a"
        border_width: 1
        radius: 8

      - id: 301
        obj: "label"
        x: 10
        y: 110
        w: 140
        h: 14
        text: "CIVIC // DIAGNOSTIC"
        text_color: "#a1a1aa"
        text_font: 12

      - id: 302
        obj: "label"
        x: 10
        y: 134
        w: 140
        h: 24
        text: "==[ CIVIC COUPE ]=="
        text_color: "#ef4444"
        text_font: 16
        align: "center"

      - id: 303
        obj: "btn"
        x: 12
        y: 172
        w: 60
        h: 20
        radius: 4
        bg_color: "#27272a"
        text: "VTEC"
        text_color: "#ffffff"
        text_font: 10

      - id: 304
        obj: "btn"
        x: 78
        y: 172
        w: 70
        h: 20
        radius: 4
        bg_color: "#14532d"
        text: "ECU OK"
        text_color: "#86efac"
        text_font: 10

      # ------------------------------------------------------------------------
      # QUADRANTE 4: ESPECTRO DE ÁUDIO
      # ------------------------------------------------------------------------
      - id: 400
        obj: "obj"
        x: 162
        y: 106
        w: 154
        h: 98
        bg_color: "#121215"
        border_color: "#27272a"
        border_width: 1
        radius: 8

      - id: 401
        obj: "label"
        x: 168
        y: 110
        w: 140
        h: 14
        text: "ÁUDIO // EQUALIZADOR"
        text_color: "#a1a1aa"
        text_font: 12

      - id: 410
        obj: "bar"
        x: 170
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 65
        indicator_bg_color: "#ef4444"

      - id: 411
        obj: "bar"
        x: 186
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 45
        indicator_bg_color: "#ef4444"

      - id: 412
        obj: "bar"
        x: 202
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 80
        indicator_bg_color: "#ef4444"

      - id: 413
        obj: "bar"
        x: 218
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 92
        indicator_bg_color: "#ef4444"

      - id: 414
        obj: "bar"
        x: 234
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 70
        indicator_bg_color: "#ef4444"

      - id: 415
        obj: "bar"
        x: 250
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 55
        indicator_bg_color: "#ef4444"

      - id: 416
        obj: "bar"
        x: 266
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 35
        indicator_bg_color: "#ef4444"

      - id: 417
        obj: "bar"
        x: 282
        y: 135
        w: 12
        h: 46
        min: 0
        max: 100
        val: 20
        indicator_bg_color: "#ef4444"

      - id: 420
        obj: "label"
        x: 168
        y: 186
        w: 140
        h: 12
        text: "CIVIC AUDIO // AUX"
        text_color: "#71717a"
        text_font: 10
        align: "center"

      # ------------------------------------------------------------------------
      # BARRA INFERIOR DE SENSORES
      # ------------------------------------------------------------------------
      - id: 500
        obj: "obj"
        x: 4
        y: 208
        w: 312
        h: 28
        bg_color: "#121215"
        border_color: "#27272a"
        border_width: 1
        radius: 6

      - id: 501
        obj: "label"
        x: 12
        y: 214
        text: "CLT: 88°C"
        text_color: "#ffffff"
        text_font: 12

      - id: 502
        obj: "label"
        x: 88
        y: 214
        text: "BAT: 14.2V"
        text_color: "#ffffff"
        text_font: 12

      - id: 503
        obj: "label"
        x: 168
        y: 214
        text: "GAS: 72%"
        text_color: "#ffffff"
        text_font: 12

      - id: 504
        obj: "label"
        x: 240
        y: 214
        text: "VTEC"
        text_color: "#ef4444"
        text_font: 12

      - id: 505
        obj: "label"
        x: 282
        y: 214
        text: "CEL"
        text_color: "#52525b"
        text_font: 12
`
  },
  {
    id: 'hondash_homeassistant',
    name: 'hondash_homeassistant.yaml',
    category: 'Home Assistant',
    description: 'Dashboard completo Lovelace para integração com Home Assistant via YAML',
    target: 'Home Assistant Lovelace (Web / Tablet / Car Headunit)',
    code: `# ==============================================================================
# HonDASH Cyber HUD - Home Assistant Lovelace Dashboard (YAML)
# Mode: YAML Storage / lovelace_dashboards
# Theme: Cyberpunk High-Contrast Type R HUD
# ==============================================================================

title: "HonDASH Cyber HUD"
views:
  - title: "Cyber HUD"
    path: "hondash-hud"
    icon: "mdi:car-sports"
    badges:
      - entity: sensor.hondash_vtec_status
        name: "VTEC"
      - entity: sensor.hondash_ecu_connection
        name: "ECU"
      - entity: sensor.hondash_coolant_temp
        name: "CLT"
      - entity: sensor.hondash_battery_voltage
        name: "BATERIA"

    cards:
      # Header HUD Banner
      - type: custom:mushroom-title-card
        title: "HONDASH CYBER HUD"
        subtitle: "HONDA CIVIC TELEMETRY // TYPE R EDITION"

      # 2x2 Quadrant Grid
      - type: grid
        columns: 2
        square: false
        cards:
          # --------------------------------------------------------------------
          # QUADRANTE 1: VELOCÍMETRO & RPM
          # --------------------------------------------------------------------
          - type: vertical-stack
            cards:
              - type: custom:gauge-card
                entity: sensor.hondash_speed_kmh
                title: "VELOCIDADE"
                unit: "KM/H"
                min: 0
                max: 260
                severity:
                  green: 0
                  yellow: 120
                  red: 180

              - type: custom:bar-card
                entity: sensor.hondash_engine_rpm
                name: "TACHOMETER"
                unit_of_measurement: "RPM"
                min: 0
                max: 9000
                severity:
                  - color: "#22c55e"
                    from: 0
                    to: 5500
                  - color: "#f59e0b"
                    from: 5500
                    to: 7000
                  - color: "#ef4444"
                    from: 7000
                    to: 9000

              - type: entity
                entity: sensor.hondash_current_gear
                name: "MARCHA ENGATADA"
                icon: "mdi:car-shift-pattern"

          # --------------------------------------------------------------------
          # QUADRANTE 2: RELÓGIO & DATA DIGITAL HUD
          # --------------------------------------------------------------------
          - type: vertical-stack
            cards:
              - type: custom:mushroom-entity-card
                entity: sensor.time
                name: "HORÁRIO HUD"
                icon: "mdi:clock-digital"
                primary_info: "state"
                secondary_info: "last-changed"
                icon_color: "red"

              - type: custom:mushroom-entity-card
                entity: sensor.date
                name: "DATA DO SISTEMA"
                icon: "mdi:calendar-month-outline"
                icon_color: "amber"

              - type: markdown
                content: |
                  <div style="text-align: center; padding: 12px; border: 1px solid #ef4444; border-radius: 8px; background: #121215;">
                    <div style="font-family: monospace; font-size: 28px; font-weight: bold; color: #ffffff;">
                      {{ now().strftime('%H:%M:%S') }}
                    </div>
                    <div style="font-family: monospace; font-size: 11px; color: #ef4444; letter-spacing: 2px;">
                      {{ now().strftime('%A, %d %B %Y') | upper }}
                    </div>
                  </div>

          # --------------------------------------------------------------------
          # QUADRANTE 3: STATUS DO CIVIC & DIAGNÓSTICO
          # --------------------------------------------------------------------
          - type: vertical-stack
            cards:
              - type: picture
                image: "/local/civic_coupe_profile.png"
                tap_action:
                  action: more-info
                  entity: sensor.hondash_vehicle_profile

              - type: horizontal-stack
                cards:
                  - type: custom:mushroom-chips-card
                    chips:
                      - type: entity
                        entity: binary_sensor.hondash_vtec_lamp
                        name: "VTEC"
                        icon_color: "red"
                      - type: entity
                        entity: binary_sensor.hondash_check_engine
                        name: "CEL"
                        icon_color: "amber"
                      - type: entity
                        entity: binary_sensor.hondash_ecu_ready
                        name: "ECU OK"
                        icon_color: "green"

          # --------------------------------------------------------------------
          # QUADRANTE 4: EQUALIZADOR DE ÁUDIO & MULTIMÍDIA
          # --------------------------------------------------------------------
          - type: vertical-stack
            cards:
              - type: custom:mushroom-media-player-card
                entity: media_player.hondash_civic_audio
                name: "HONDA CIVIC AUDIO SYSTEM"
                icon_type: entity-picture
                show_volume_level: true
                volume_controls:
                  - volume_buttons
                  - volume_set

              - type: markdown
                content: |
                  <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 50px; background: #09090b; padding: 6px; border-radius: 6px; border: 1px solid #27272a;">
                    <div style="width: 8px; height: 35px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 22px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 44px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 50px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 38px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 28px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 18px; background: #ef4444; border-radius: 2px;"></div>
                    <div style="width: 8px; height: 12px; background: #ef4444; border-radius: 2px;"></div>
                  </div>
                  <p style="text-align: center; font-size: 9px; color: #71717a; margin-top: 4px;">60Hz · 150Hz · 400Hz · 1kHz · 2.5kHz · 6kHz · 10kHz · 16kHz</p>

      # ------------------------------------------------------------------------
      # BARRA INFERIOR DE SENSORES DOCK
      # ------------------------------------------------------------------------
      - type: horizontal-stack
        cards:
          - type: custom:mushroom-entity-card
            entity: sensor.hondash_coolant_temp
            name: "CLT"
            icon: "mdi:coolant-temperature"
            icon_color: "blue"

          - type: custom:mushroom-entity-card
            entity: sensor.hondash_battery_voltage
            name: "BAT"
            icon: "mdi:car-battery"
            icon_color: "green"

          - type: custom:mushroom-entity-card
            entity: sensor.hondash_fuel_level
            name: "FUEL"
            icon: "mdi:gas-station"
            icon_color: "amber"

          - type: custom:mushroom-entity-card
            entity: sensor.hondash_intake_temp
            name: "IAT"
            icon: "mdi:thermometer-lines"
            icon_color: "cyan"
`
  }
];
