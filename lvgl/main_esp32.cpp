/**
 * @file main_esp32.cpp
 * @brief HonDASH - Honda Civic LVGL Embedded Firmware for ESP32 / ESP32-S3
 * @details Displays: 240x320, 320x240, 480x320 (e.g. ST7789, ILI9341, ESP32-CYD)
 */

#include <Arduino.h>
#include <lvgl.h>
#include <TFT_eSPI.h>
#include "hondash_ui.h"

/* Display Resolution */
#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240

static TFT_eSPI tft = TFT_eSPI();

/* LVGL Draw Buffers */
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf1[SCREEN_WIDTH * 20];
static lv_color_t buf2[SCREEN_WIDTH * 20];

/* Display Flush Callback */
void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    tft.endWrite();

    lv_disp_flush_ready(disp);
}

/* Touchpad Read Callback */
void my_touchpad_read(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    uint16_t touchX = 0, touchY = 0;
    bool touched = tft.getTouch(&touchX, &touchY, 600);

    if (!touched) {
        data->state = LV_INDEV_STATE_REL;
    } else {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touchX;
        data->point.y = touchY;
    }
}

/* Simulated Telemetry Engine (Can be replaced with real ELM327 / CAN-Bus) */
void telemetry_simulation_task(void *pvParameters) {
    hondash_telemetry_t telem = {
        .speed_kmh = 0,
        .rpm = 850,
        .rpm_redline = 8200,
        .gear = 0,
        .coolant_temp_c = 85.0f,
        .iat_temp_c = 32.0f,
        .battery_volts = 14.2f,
        .fuel_pct = 80.0f,
        .throttle_pct = 0.0f,
        .odometer_km = 142500,
        .trip_km = 42.5f,
        .vtec_active = false,
        .cel_active = false,
        .shift_light = false,
        .headlights = true,
        .door_open = false,
        .ble_connected = true,
        .hour = 14,
        .minute = 30,
        .second = 0,
        .day = 5,
        .month = 9,
        .year = 2026,
        .weekday = 6
    };

    int speed_dir = 1;

    for (;;) {
        /* Simulate Dynamic Acceleration */
        telem.speed_kmh += speed_dir * 2;
        if (telem.speed_kmh >= 130) speed_dir = -1;
        if (telem.speed_kmh <= 10)  speed_dir = 1;

        telem.rpm = 1000 + (telem.speed_kmh * 55);
        if (telem.rpm > 8500) telem.rpm = 8500;

        /* VTEC activates above 5800 RPM */
        telem.vtec_active = (telem.rpm >= 5800);

        /* Gear approximation */
        if (telem.speed_kmh < 25)       telem.gear = 1;
        else if (telem.speed_kmh < 50)  telem.gear = 2;
        else if (telem.speed_kmh < 80)  telem.gear = 3;
        else if (telem.speed_kmh < 110) telem.gear = 4;
        else                            telem.gear = 5;

        /* Advance clock seconds */
        telem.second++;
        if (telem.second >= 60) {
            telem.second = 0;
            telem.minute++;
            if (telem.minute >= 60) {
                telem.minute = 0;
                telem.hour = (telem.hour + 1) % 24;
            }
        }

        /* Update LVGL UI (Ensure LVGL thread safety if using FreeRTOS) */
        hondash_update_telemetry(&telem);

        vTaskDelay(pdMS_TO_TICKS(100)); // 10 Hz refresh rate
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("[HonDASH] Booting LVGL Dashboard on ESP32...");

    /* Initialize TFT Display */
    tft.init();
    tft.setRotation(1); /* Landscape (320x240) */
    tft.fillScreen(TFT_BLACK);

    /* Initialize LVGL Core */
    lv_init();
    lv_disp_draw_buf_init(&draw_buf, buf1, buf2, SCREEN_WIDTH * 20);

    /* Initialize Display Driver */
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = SCREEN_WIDTH;
    disp_drv.ver_res = SCREEN_HEIGHT;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    /* Initialize Touch Input Driver */
    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    /* Initialize HonDASH Cyber Dashboard UI */
    hondash_config_t config = {
        .theme = HONDASH_THEME_RED,
        .use_24h_clock = true,
        .use_mph = false,
        .use_fahrenheit = false,
        .show_underglow = true,
        .show_vehicle_clock = true,
        .car_model_name = "CIVIC Si"
    };
    hondash_ui_init(&config);

    Serial.println("[HonDASH] LVGL Dashboard UI initialized successfully!");

    /* Launch Telemetry Thread on Core 0 */
    xTaskCreatePinnedToCore(
        telemetry_simulation_task,
        "HonDashTelem",
        4096,
        NULL,
        1,
        NULL,
        0
    );
}

void loop() {
    /* Handle LVGL Timers and Input */
    lv_timer_handler();
    delay(5);
}
