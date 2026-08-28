#pragma once

// ==============================================================================
// FREENOVE ESP32-S3 2.8" IPS CAPACITIVE TOUCH (240x320) PINOUT DEFINITIONS
// Board: Freenove ESP32-S3-WROOM Display (CYD S3 Capacitive Version)
// Screen: 2.8" 240x320 IPS (ST7789 SPI Controller)
// Touch: Capacitive Multi-touch I2C (FT6236 / CST816S Controller)
// ==============================================================================

#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240
#define LCD_ROTATION  1 // Landscape 320x240

// --- ST7789 SPI Display Pins ---
#define TFT_MISO     -1
#define TFT_MOSI     11   // SPI MOSI
#define TFT_SCLK     12   // SPI CLK
#define TFT_CS       10   // Chip Select
#define TFT_DC       4    // Data / Command
#define TFT_RST      5    // Reset (or -1 if connected to EN)
#define TFT_BL       6    // Backlight PWM (active HIGH)

// --- Capacitive Touch I2C Pins (FT6236 / CST816) ---
#define TOUCH_I2C_SDA 8   // I2C Data
#define TOUCH_I2C_SCL 9   // I2C Clock
#define TOUCH_INT     14  // Touch Interrupt
#define TOUCH_RST     -1  // Touch Reset (tied to system reset)

// --- Audio / Buzzer PWM Pin (Shift light chime & VTEC beep) ---
#define BUZZER_PIN    15

// --- Onboard RGB LED (WS2812 / NeoPixel) ---
#define RGB_LED_PIN   48

// --- Honda OBD2 / K-Line / CAN-Bus UART Pins ---
#define HONDA_RX_PIN  18  // Connect to OBD K-Line Transceiver RX
#define HONDA_TX_PIN  17  // Connect to OBD K-Line Transceiver TX
#define HONDA_BAUD    9600 // Or 10400 / 115200 for ELM327 / HonDash DLC
