# HonDASH Cyber HUD - Conversão Declarativa em YAML

Este diretório contém a conversão integral da interface e arquitetura do **HonDASH Cyber HUD** para formatos puramente declarativos em **YAML**, adequados para microcontroladores (ESP32), firmware IoT e plataformas de automação veicular.

---

## 📁 Arquivos Inclusos

| Arquivo | Plataforma / Ferramenta | Descrição |
|---|---|---|
| **`hondash_esphome_lvgl.yaml`** | **ESPHome + LVGL Nativo** | Código de firmware completo em YAML para ESP32 e ESP32-CYD (2.8" / 3.2" 320x240 ILI9341 com touch XPT2046). Utiliza o motor declarativo `lvgl:` nativo do ESPHome, com estilos, 4 quadrantes, barras animadas, relógio e sensores. |
| **`hondash_master_spec.yaml`** | **HonDASH Master Architecture** | Especificação de arquitetura do sistema em YAML 1.2. Mapeia telas, resoluções, paletas dos 6 temas (Type R, Cyber Cyan, Amber, etc.), PIDs OBD2/K-Line, UUIDs do Bluetooth BLE, parâmetros dos sintetizadores sonoros e layouts dos 4 quadrantes. |
| **`hondash_openhasp.yaml`** | **OpenHASP / ESP32** | Definição declarativa em YAML de objetos e telas para firmware OpenHASP rodando em telas ESP32 touch, com IDs de objetos para controle instantâneo via MQTT / WebSockets. |
| **`hondash_homeassistant.yaml`** | **Home Assistant Lovelace** | Dashboard automotivo completo em YAML para o Home Assistant (cards de velocímetro, RPM, relógio HUD, status do Civic e sensores). |

---

## 🚀 Como Gravar no ESP32 usando ESPHome

1. Instale o ESPHome na sua máquina ou use o Home Assistant:
   ```bash
   pip install esphome
   ```

2. Conecte o ESP32 ao computador via cabo USB e execute:
   ```bash
   esphome run hondash_esphome_lvgl.yaml
   ```

3. O ESPHome compilará o LVGL e gravará diretamente na placa com o painel HonDASH pronto e interativo!
