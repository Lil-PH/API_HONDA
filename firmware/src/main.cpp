/**
 * ============================================================================
 * HONDASH CIVIC 99 - C / LVGL DUAL-TARGET ENGINE
 * 
 * 1. TARGET ESP32: Freenove ESP32-S3 2.8" IPS Capacitive Touch (ST7789 + FT6236)
 * 2. TARGET NATIVE: PC Simulator (Windows / Linux / macOS) via SDL2 + Mouse Touch
 * ============================================================================
 */

#include <lvgl.h>
#include "ui_hondash.h"

// ----------------------------------------------------------------------------
// AMBIENTE 1: PLACA FÍSICA FREENOVE ESP32-S3 (ARDUINO / LOVYANGFX / BLE)
// ----------------------------------------------------------------------------
#if defined(ESP32)

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include "freenove_pinout.h"

class LGFX_Freenove_S3 : public lgfx::LGFX_Device {
    lgfx::Panel_ST7789      _panel_instance;
    lgfx::Bus_SPI           _bus_instance;
    lgfx::Light_PWM         _light_instance;
    lgfx::Touch_FT5x06      _touch_instance; // FT6236 / CST816 compatible

public:
    LGFX_Freenove_S3() {
        {
            auto cfg = _bus_instance.config();
            cfg.spi_host = SPI2_HOST;
            cfg.spi_mode = 0;
            cfg.freq_write = 80000000; // 80 MHz SPI
            cfg.freq_read  = 16000000;
            cfg.pin_sclk = TFT_SCLK;
            cfg.pin_mosi = TFT_MOSI;
            cfg.pin_miso = TFT_MISO;
            cfg.pin_dc   = TFT_DC;
            _bus_instance.config(cfg);
            _panel_instance.setBus(&_bus_instance);
        }

        {
            auto cfg = _panel_instance.config();
            cfg.pin_cs           = TFT_CS;
            cfg.pin_rst          = TFT_RST;
            cfg.pin_busy         = -1;
            cfg.panel_width      = 240;
            cfg.panel_height     = 320;
            cfg.offset_x         = 0;
            cfg.offset_y         = 0;
            cfg.offset_rotation  = LCD_ROTATION;
            cfg.readable         = false;
            cfg.invert           = true;
            cfg.rgb_order        = false;
            cfg.dlen_16bit       = false;
            cfg.bus_shared       = false;
            _panel_instance.config(cfg);
        }

        {
            auto cfg = _light_instance.config();
            cfg.pin_bl = TFT_BL;
            cfg.invert = false;
            cfg.freq   = 44100;
            cfg.pwm_channel = 7;
            _light_instance.config(cfg);
            _panel_instance.setLight(&_light_instance);
        }

        {
            auto cfg = _touch_instance.config();
            cfg.x_min      = 0;
            cfg.x_max      = 319;
            cfg.y_min      = 0;
            cfg.y_max      = 239;
            cfg.pin_int    = TOUCH_INT;
            cfg.bus_shared = false;
            cfg.offset_rotation = LCD_ROTATION;
            cfg.i2c_port   = 0;
            cfg.i2c_addr   = 0x38; // FT6236 / CST816
            cfg.pin_sda    = TOUCH_I2C_SDA;
            cfg.pin_scl    = TOUCH_I2C_SCL;
            cfg.freq       = 400000;
            _touch_instance.config(cfg);
            _panel_instance.setTouch(&_touch_instance);
        }

        setPanel(&_panel_instance);
    }
};

static LGFX_Freenove_S3 tft;

static const uint32_t screenWidth  = 320;
static const uint32_t screenHeight = 240;
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf[screenWidth * 30];

static void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.writePixels((lgfx::rgb565_t*)&color_p->full, w * h);
    tft.endWrite();

    lv_disp_flush_ready(disp);
}

static void my_touchpad_read(lv_indev_drv_t *indev_driver, lv_indev_data_t *data) {
    uint16_t touchX, touchY;
    bool touched = tft.getTouch(&touchX, &touchY);

    if (!touched) {
        data->state = LV_INDEV_STATE_REL;
    } else {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touchX;
        data->point.y = touchY;
    }
}

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

static BLECharacteristic *pCharacteristic;
static bool deviceConnected = false;
static HondashTelemetry_t currentTelemetry = {
    .rpm = 850,
    .speed = 0,
    .coolantTemp = 88,
    .intakeAirTemp = 28,
    .manifoldPressure = 32,
    .throttlePos = 0,
    .vtecActive = 0,
    .checkEngineLight = 0,
    .shiftLightActive = 0,
    .batteryVoltage = 14.2f,
    .airFuelRatio = 14.7f,
    .sprintTime0_100 = 0.0f
};

class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
    }
    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        BLEDevice::startAdvertising();
    }
};

class MyCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string value = pCharacteristic->getValue();
        if (value.length() > 0) {
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, value.c_str());
            if (!error) {
                if (doc.containsKey("rpm"))  currentTelemetry.rpm = doc["rpm"];
                if (doc.containsKey("spd"))  currentTelemetry.speed = doc["spd"];
                if (doc.containsKey("ect"))  currentTelemetry.coolantTemp = doc["ect"];
                if (doc.containsKey("iat"))  currentTelemetry.intakeAirTemp = doc["iat"];
                if (doc.containsKey("map"))  currentTelemetry.manifoldPressure = doc["map"];
                if (doc.containsKey("vtec")) currentTelemetry.vtecActive = doc["vtec"];
                if (doc.containsKey("volt")) currentTelemetry.batteryVoltage = doc["volt"];
                if (doc.containsKey("afr"))  currentTelemetry.airFuelRatio = doc["afr"];
            }
        }
    }
};

void trigger_shift_light_beep() {
    tone(BUZZER_PIN, 2400, 40);
}

void setup() {
    Serial.begin(115200);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);

    tft.init();
    tft.setRotation(1);
    tft.setBrightness(255);
    tft.fillScreen(TFT_BLACK);

    lv_init();
    lv_disp_draw_buf_init(&draw_buf, buf, NULL, screenWidth * 30);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = screenWidth;
    disp_drv.ver_res = screenHeight;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    ui_hondash_init();

    BLEDevice::init("HONDASH-CYD-S3");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->addDescriptor(new BLE2902());
    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();

    Serial.println("✓ Freenove ESP32-S3 HonDash Ready!");
}

void loop() {
    lv_timer_handler();
    ui_hondash_update_telemetry(&currentTelemetry);

    if (currentTelemetry.rpm >= 7200) {
        trigger_shift_light_beep();
    }

    delay(5);
}

// ----------------------------------------------------------------------------
// AMBIENTE 2: SIMULADOR NATIVO NO COMPUTADOR (WINDOWS / LINUX / MAC COM SDL2)
// ----------------------------------------------------------------------------
#else

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <unistd.h>
#include <time.h>
#include <SDL2/SDL.h>
#include "lv_drivers/display/monitor.h"
#include "lv_drivers/indev/mouse.h"

static HondashTelemetry_t simTelemetry = {
    .rpm = 850,
    .speed = 0,
    .coolantTemp = 88,
    .intakeAirTemp = 28,
    .manifoldPressure = 32,
    .throttlePos = 0,
    .vtecActive = 0,
    .checkEngineLight = 0,
    .shiftLightActive = 0,
    .batteryVoltage = 14.2f,
    .airFuelRatio = 14.7f,
    .sprintTime0_100 = 0.0f
};

// Tick customizado para LVGL no desktop
static uint32_t custom_tick_get(void) {
    static uint64_t start_ms = 0;
    if (start_ms == 0) {
        struct timespec ts;
        clock_gettime(CLOCK_MONOTONIC, &ts);
        start_ms = (ts.tv_sec * 1000) + (ts.tv_nsec / 1000000);
    }
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    uint64_t now_ms = (ts.tv_sec * 1000) + (ts.tv_nsec / 1000000);
    return (uint32_t)(now_ms - start_ms);
}

int main(int argc, char **argv) {
    (void)argc;
    (void)argv;

    printf("==================================================\n");
    printf("   HONDASH CIVIC 99 - PC SIMULATOR (SDL2 + LVGL)   \n");
    printf("==================================================\n");
    printf(" [MOUSE]   Age como o toque capacitivo na tela    \n");
    printf(" [ESPAÇO]  Acelerar / Aumentar RPM no simulador  \n");
    printf("==================================================\n\n");

    // 1. Inicializar LVGL
    lv_init();

    // 2. Inicializar Drivers de Janela e Mouse SDL2
    monitor_init();
    mouse_init();

    // 3. Buffer de display duplo para 320x240
    static lv_color_t buf1[320 * 40];
    static lv_color_t buf2[320 * 40];
    static lv_disp_draw_buf_t disp_buf;
    lv_disp_draw_buf_init(&disp_buf, buf1, buf2, 320 * 40);

    // 4. Registrar driver de tela
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.draw_buf = &disp_buf;
    disp_drv.flush_cb = monitor_flush;
    disp_drv.hor_res = 320;
    disp_drv.ver_res = 240;
    lv_disp_drv_register(&disp_drv);

    // 5. Registrar driver de mouse como toque
    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = mouse_read;
    lv_indev_drv_register(&indev_drv);

    // 6. Criar Interface Gráfica HonDash
    ui_hondash_init();

    // Loop Principal de Simulação
    int rpm_dir = 1;
    while (1) {
        // Simulação dinâmica de RPM e Velocidade
        if (rpm_dir == 1) {
            simTelemetry.rpm += 45;
            if (simTelemetry.rpm >= 8200) rpm_dir = -1;
        } else {
            simTelemetry.rpm -= 35;
            if (simTelemetry.rpm <= 850) rpm_dir = 1;
        }
        simTelemetry.speed = (simTelemetry.rpm * 210) / 8200;
        simTelemetry.vtecActive = (simTelemetry.rpm >= 5200) ? 1 : 0;
        simTelemetry.shiftLightActive = (simTelemetry.rpm >= 7200) ? 1 : 0;

        // Atualiza a telemetria na interface LVGL
        ui_hondash_update_telemetry(&simTelemetry);

        // Processa eventos LVGL
        lv_timer_handler();
        usleep(5000); // 5ms ~ 60 FPS
    }

    return 0;
}

#endif
