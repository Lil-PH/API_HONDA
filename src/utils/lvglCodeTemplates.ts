/**
 * Complete LVGL Embedded C / C++ Code Templates for HonDASH
 */

export interface LvglCodeFile {
  id: string;
  name: string;
  lang: string;
  description: string;
  code: string;
}

export const LVGL_CODE_FILES: LvglCodeFile[] = [
  {
    id: 'hondash_ui_h',
    name: 'hondash_ui.h',
    lang: 'c',
    description: 'Declarações de structs de telemetria OBD2, paletas de cores e funções da UI',
    code: `/**
 * @file hondash_ui.h
 * @brief HonDASH - Honda Civic Cyber HUD Dashboard for LVGL (v8 / v9)
 * @author HonDASH Embedded UI Team
 * @note Target Displays: ESP32 / ESP32-S3 (240x320, 320x240, 480x320, 800x480)
 */

#ifndef HONDASH_UI_H
#define HONDASH_UI_H

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"
#include <stdbool.h>
#include <stdint.h>

/* Display Dimensions */
#ifndef HONDASH_HOR_RES
#define HONDASH_HOR_RES 320
#endif

#ifndef HONDASH_VER_RES
#define HONDASH_VER_RES 240
#endif

/* Theme Color Palette */
typedef enum {
    HONDASH_THEME_RED = 0,
    HONDASH_THEME_CYAN,
    HONDASH_THEME_AMBER,
    HONDASH_THEME_PURPLE,
    HONDASH_THEME_GREEN,
    HONDASH_THEME_WHITE,
    HONDASH_THEME_COUNT
} hondash_theme_t;

/* Vehicle Telemetry Packet (matching HonDASH OBD2 / CAN-Bus) */
typedef struct {
    int16_t  speed_kmh;       /* Vehicle speed (0 - 280 km/h) */
    int16_t  rpm;             /* Engine RPM (0 - 9000) */
    int16_t  rpm_redline;     /* Redline threshold (e.g. 6800 or 8200) */
    int8_t   gear;            /* Current gear (1-6, 0=N, -1=R) */
    float    coolant_temp_c;  /* Coolant temp in Celsius */
    float    iat_temp_c;      /* Intake air temp */
    float    battery_volts;   /* Battery voltage (e.g. 14.2V) */
    float    fuel_pct;        /* Fuel level (0 - 100%) */
    float    throttle_pct;    /* Throttle position (0 - 100%) */
    uint32_t odometer_km;     /* Total odometer reading */
    float    trip_km;         /* Trip meter */
    bool     vtec_active;     /* VTEC engagement flag */
    bool     cel_active;      /* Check Engine Light flag */
    bool     shift_light;     /* Shift warning indicator */
    bool     headlights;      /* Lights on/off */
    bool     door_open;       /* Door open indicator */
    bool     ble_connected;   /* Bluetooth / CAN connection status */
    
    /* Time & Date */
    uint8_t  hour;            /* 0 - 23 */
    uint8_t  minute;          /* 0 - 59 */
    uint8_t  second;          /* 0 - 59 */
    uint8_t  day;             /* 1 - 31 */
    uint8_t  month;           /* 1 - 12 */
    uint16_t year;            /* e.g. 2026 */
    uint8_t  weekday;         /* 0=Sunday, 1=Monday... */
} hondash_telemetry_t;

/* UI Configuration */
typedef struct {
    hondash_theme_t theme;
    bool            use_24h_clock;
    bool            use_mph;
    bool            use_fahrenheit;
    bool            show_underglow;
    bool            show_vehicle_clock;
    const char*     car_model_name;
} hondash_config_t;

/**
 * @brief Initialize the HonDASH LVGL Dashboard
 * @param cfg Configuration options
 */
void hondash_ui_init(const hondash_config_t* cfg);

/**
 * @brief Update all telemetry fields at once (thread-safe if called with LVGL lock)
 * @param data Telemetry struct
 */
void hondash_update_telemetry(const hondash_telemetry_t* data);

/**
 * @brief Granular Telemetry Updates
 */
void hondash_set_speed(int16_t speed);
void hondash_set_rpm(int16_t rpm);
void hondash_set_gear(int8_t gear);
void hondash_set_vtec(bool active);
void hondash_set_cel(bool active);
void hondash_set_coolant_temp(float temp_c);
void hondash_set_battery_volts(float volts);
void hondash_set_fuel_pct(float pct);
void hondash_set_time(uint8_t h, uint8_t m, uint8_t s);
void hondash_set_date(uint8_t day, uint8_t month, uint16_t year, uint8_t weekday);

/**
 * @brief Switch UI Theme Color
 */
void hondash_set_theme(hondash_theme_t theme);

/**
 * @brief Toggle 12h / 24h clock format
 */
void hondash_set_clock_format(bool use_24h);

/**
 * @brief Expand / Minimize vehicle profile fullscreen mode
 */
void hondash_set_vehicle_expanded(bool expanded);

#ifdef __cplusplus
}
#endif

#endif /* HONDASH_UI_H */`
  },
  {
    id: 'hondash_ui_c',
    name: 'hondash_ui.c',
    lang: 'c',
    description: 'Implementação gráfica completa: 4 quadrantes, gauges, relógio HUD e modal expandido',
    code: `/**
 * @file hondash_ui.c
 * @brief HonDASH - Honda Civic Cyber HUD Dashboard implementation for LVGL (v8 / v9)
 */

#include "hondash_ui.h"
#include <stdio.h>
#include <string.h>

/* Theme Color Table (RGB Values) */
typedef struct {
    lv_color_t primary;
    lv_color_t secondary;
    lv_color_t dark;
    lv_color_t glow;
} theme_palette_t;

static const theme_palette_t THEMES[HONDASH_THEME_COUNT] = {
    [HONDASH_THEME_RED]    = { LV_COLOR_MAKE(0xEF, 0x44, 0x44), LV_COLOR_MAKE(0xF8, 0x71, 0x71), LV_COLOR_MAKE(0x45, 0x0A, 0x0A), LV_COLOR_MAKE(0xEF, 0x44, 0x44) },
    [HONDASH_THEME_CYAN]   = { LV_COLOR_MAKE(0x06, 0xB6, 0xD4), LV_COLOR_MAKE(0x67, 0xE8, 0xF9), LV_COLOR_MAKE(0x08, 0x33, 0x44), LV_COLOR_MAKE(0x06, 0xB6, 0xD4) },
    [HONDASH_THEME_AMBER]  = { LV_COLOR_MAKE(0xF5, 0x9E, 0x0B), LV_COLOR_MAKE(0xFC, 0xD3, 0x4D), LV_COLOR_MAKE(0x45, 0x1A, 0x03), LV_COLOR_MAKE(0xF5, 0x9E, 0x0B) },
    [HONDASH_THEME_PURPLE] = { LV_COLOR_MAKE(0x8B, 0x5C, 0xF6), LV_COLOR_MAKE(0xC4, 0xB5, 0xFD), LV_COLOR_MAKE(0x2E, 0x10, 0x65), LV_COLOR_MAKE(0x8B, 0x5C, 0xF6) },
    [HONDASH_THEME_GREEN]  = { LV_COLOR_MAKE(0x10, 0xB9, 0x81), LV_COLOR_MAKE(0x6E, 0xEE, 0xB8), LV_COLOR_MAKE(0x02, 0x2C, 0x22), LV_COLOR_MAKE(0x10, 0xB9, 0x81) },
    [HONDASH_THEME_WHITE]  = { LV_COLOR_MAKE(0xE4, 0xE4, 0xE7), LV_COLOR_MAKE(0xFF, 0xFF, 0xFF), LV_COLOR_MAKE(0x27, 0x27, 0x2A), LV_COLOR_MAKE(0xE4, 0xE4, 0xE7) }
};

static const char* WEEKDAYS[] = {"DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"};
static const char* MONTHS[]   = {"JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"};

/* UI Root & Component References */
static lv_obj_t* scr_root           = NULL;
static lv_obj_t* quad_speed         = NULL;
static lv_obj_t* quad_clock         = NULL;
static lv_obj_t* quad_vehicle       = NULL;
static lv_obj_t* quad_audio         = NULL;
static lv_obj_t* bottom_bar         = NULL;
static lv_obj_t* vehicle_modal      = NULL;

/* Telemetry Widgets */
static lv_obj_t* lbl_speed_val      = NULL;
static lv_obj_t* lbl_speed_unit     = NULL;
static lv_obj_t* lbl_gear_val       = NULL;
static lv_obj_t* bar_rpm            = NULL;
static lv_obj_t* lbl_rpm_val        = NULL;
static lv_obj_t* badge_vtec         = NULL;
static lv_obj_t* badge_cel          = NULL;

/* Clock Widgets */
static lv_obj_t* lbl_clock_time     = NULL;
static lv_obj_t* lbl_clock_sec      = NULL;
static lv_obj_t* lbl_clock_ampm     = NULL;
static lv_obj_t* lbl_clock_date     = NULL;
static lv_obj_t* dot_clock_glow     = NULL;

/* Vehicle Profile Widgets */
static lv_obj_t* lbl_car_model      = NULL;
static lv_obj_t* underglow_rect     = NULL;
static lv_obj_t* lbl_modal_time     = NULL;
static lv_obj_t* lbl_modal_date     = NULL;

/* Bottom Bar Gauges */
static lv_obj_t* bar_coolant        = NULL;
static lv_obj_t* lbl_coolant_val    = NULL;
static lv_obj_t* bar_fuel           = NULL;
static lv_obj_t* lbl_fuel_val       = NULL;
static lv_obj_t* lbl_batt_val       = NULL;

/* Audio Visualizer Bars */
#define AUDIO_BARS_COUNT 8
static lv_obj_t* audio_bars[AUDIO_BARS_COUNT];
static lv_timer_t* audio_anim_timer = NULL;

/* State */
static hondash_config_t curr_cfg;
static hondash_telemetry_t curr_telem;
static bool is_vehicle_expanded = false;

/* Helper Styles */
static lv_style_t style_card;

static void build_top_left_speed(lv_obj_t* parent);
static void build_top_right_clock(lv_obj_t* parent);
static void build_bottom_left_vehicle(lv_obj_t* parent);
static void build_bottom_right_audio(lv_obj_t* parent);
static void build_bottom_gauges(lv_obj_t* parent);
static void build_vehicle_modal(lv_obj_t* parent);
static void on_clock_clicked(lv_event_t* e);
static void on_vehicle_clicked(lv_event_t* e);
static void on_modal_clicked(lv_event_t* e);
static void audio_anim_cb(lv_timer_t* timer);

void hondash_ui_init(const hondash_config_t* cfg) {
    if (cfg) curr_cfg = *cfg;
    else {
        curr_cfg.theme = HONDASH_THEME_RED;
        curr_cfg.use_24h_clock = true;
        curr_cfg.use_mph = false;
        curr_cfg.use_fahrenheit = false;
        curr_cfg.show_underglow = true;
        curr_cfg.show_vehicle_clock = true;
        curr_cfg.car_model_name = "CIVIC Si";
    }

    scr_root = lv_scr_act();
    lv_obj_set_style_bg_color(scr_root, lv_color_black(), 0);
    lv_obj_clear_flag(scr_root, LV_OBJ_FLAG_SCROLLABLE);

    lv_style_init(&style_card);
    lv_style_set_bg_color(&style_card, lv_color_make(18, 18, 20));
    lv_style_set_bg_opa(&style_card, LV_OPA_90);
    lv_style_set_border_color(&style_card, lv_color_make(45, 45, 50));
    lv_style_set_border_width(&style_card, 1);
    lv_style_set_radius(&style_card, 8);
    lv_style_set_pad_all(&style_card, 6);

    /* 4 Quadrantes */
    quad_speed = lv_obj_create(scr_root);
    lv_obj_add_style(quad_speed, &style_card, 0);
    lv_obj_set_size(quad_speed, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_speed, 2, 2);
    lv_obj_clear_flag(quad_speed, LV_OBJ_FLAG_SCROLLABLE);
    build_top_left_speed(quad_speed);

    quad_clock = lv_obj_create(scr_root);
    lv_obj_add_style(quad_clock, &style_card, 0);
    lv_obj_set_size(quad_clock, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_clock, (HONDASH_HOR_RES / 2) + 2, 2);
    lv_obj_clear_flag(quad_clock, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(quad_clock, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(quad_clock, on_clock_clicked, LV_EVENT_CLICKED, NULL);
    build_top_right_clock(quad_clock);

    quad_vehicle = lv_obj_create(scr_root);
    lv_obj_add_style(quad_vehicle, &style_card, 0);
    lv_obj_set_size(quad_vehicle, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_vehicle, 2, (HONDASH_VER_RES / 2) - 12);
    lv_obj_clear_flag(quad_vehicle, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(quad_vehicle, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(quad_vehicle, on_vehicle_clicked, LV_EVENT_CLICKED, NULL);
    build_bottom_left_vehicle(quad_vehicle);

    quad_audio = lv_obj_create(scr_root);
    lv_obj_add_style(quad_audio, &style_card, 0);
    lv_obj_set_size(quad_audio, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_audio, (HONDASH_HOR_RES / 2) + 2, (HONDASH_VER_RES / 2) - 12);
    lv_obj_clear_flag(quad_audio, LV_OBJ_FLAG_SCROLLABLE);
    build_bottom_right_audio(quad_audio);

    /* Barra Inferior com Gauges */
    bottom_bar = lv_obj_create(scr_root);
    lv_obj_set_size(bottom_bar, HONDASH_HOR_RES - 4, 24);
    lv_obj_set_pos(bottom_bar, 2, HONDASH_VER_RES - 26);
    lv_obj_set_style_bg_color(bottom_bar, lv_color_make(10, 10, 12), 0);
    lv_obj_set_style_border_color(bottom_bar, lv_color_make(35, 35, 40), 0);
    lv_obj_set_style_border_width(bottom_bar, 1, 0);
    lv_obj_set_style_radius(bottom_bar, 4, 0);
    lv_obj_clear_flag(bottom_bar, LV_OBJ_FLAG_SCROLLABLE);
    build_bottom_gauges(bottom_bar);

    build_vehicle_modal(scr_root);
    audio_anim_timer = lv_timer_create(audio_anim_cb, 80, NULL);
}

static void build_top_left_speed(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "VELOCIDADE // RPM");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    lbl_speed_val = lv_label_create(parent);
    lv_label_set_text(lbl_speed_val, "0");
    lv_obj_set_style_text_font(lbl_speed_val, &lv_font_montserrat_28, 0);
    lv_obj_set_style_text_color(lbl_speed_val, lv_color_white(), 0);
    lv_obj_align(lbl_speed_val, LV_ALIGN_CENTER, -15, -6);

    lbl_speed_unit = lv_label_create(parent);
    lv_label_set_text(lbl_speed_unit, curr_cfg.use_mph ? "MPH" : "KM/H");
    lv_obj_set_style_text_color(lbl_speed_unit, lv_color_make(160, 160, 170), 0);
    lv_obj_set_style_text_font(lbl_speed_unit, &lv_font_montserrat_10, 0);
    lv_obj_align_to(lbl_speed_unit, lbl_speed_val, LV_ALIGN_OUT_RIGHT_BOTTOM, 4, -4);

    lbl_gear_val = lv_label_create(parent);
    lv_label_set_text(lbl_gear_val, "N");
    lv_obj_set_style_text_font(lbl_gear_val, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(lbl_gear_val, pal.secondary, 0);
    lv_obj_align(lbl_gear_val, LV_ALIGN_TOP_RIGHT, -4, 0);

    bar_rpm = lv_bar_create(parent);
    lv_obj_set_size(bar_rpm, (HONDASH_HOR_RES / 2) - 18, 6);
    lv_obj_align(bar_rpm, LV_ALIGN_BOTTOM_MID, 0, -2);
    lv_bar_set_range(bar_rpm, 0, 9000);
    lv_bar_set_value(bar_rpm, 0, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar_rpm, lv_color_make(30, 30, 35), LV_PART_MAIN);
    lv_obj_set_style_bg_color(bar_rpm, pal.primary, LV_PART_INDICATOR);

    lbl_rpm_val = lv_label_create(parent);
    lv_label_set_text(lbl_rpm_val, "0 RPM");
    lv_obj_set_style_text_font(lbl_rpm_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_rpm_val, lv_color_make(180, 180, 180), 0);
    lv_obj_align_to(lbl_rpm_val, bar_rpm, LV_ALIGN_OUT_TOP_RIGHT, 0, -2);
}

static void build_top_right_clock(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "TIME / DATE");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    lbl_clock_time = lv_label_create(parent);
    lv_label_set_text(lbl_clock_time, "12:00");
    lv_obj_set_style_text_font(lbl_clock_time, &lv_font_montserrat_22, 0);
    lv_obj_set_style_text_color(lbl_clock_time, lv_color_white(), 0);
    lv_obj_align(lbl_clock_time, LV_ALIGN_CENTER, -12, -6);

    lbl_clock_sec = lv_label_create(parent);
    lv_label_set_text(lbl_clock_sec, "00");
    lv_obj_set_style_text_font(lbl_clock_sec, &lv_font_montserrat_12, 0);
    lv_obj_set_style_text_color(lbl_clock_sec, pal.secondary, 0);
    lv_obj_align_to(lbl_clock_sec, lbl_clock_time, LV_ALIGN_OUT_RIGHT_BOTTOM, 3, -2);

    lbl_clock_ampm = lv_label_create(parent);
    lv_label_set_text(lbl_clock_ampm, "");
    lv_obj_set_style_text_font(lbl_clock_ampm, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_clock_ampm, lv_color_make(140, 140, 150), 0);
    lv_obj_align_to(lbl_clock_ampm, lbl_clock_sec, LV_ALIGN_OUT_TOP_MID, 0, -2);

    lv_obj_t* line = lv_obj_create(parent);
    lv_obj_set_size(line, (HONDASH_HOR_RES / 2) - 30, 1);
    lv_obj_align(line, LV_ALIGN_BOTTOM_MID, 0, -18);
    lv_obj_set_style_bg_color(line, lv_color_make(40, 40, 45), 0);
    lv_obj_set_style_border_width(line, 0, 0);

    dot_clock_glow = lv_obj_create(parent);
    lv_obj_set_size(dot_clock_glow, 5, 5);
    lv_obj_align(dot_clock_glow, LV_ALIGN_BOTTOM_MID, 0, -16);
    lv_obj_set_style_radius(dot_clock_glow, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(dot_clock_glow, pal.primary, 0);
    lv_obj_set_style_border_width(dot_clock_glow, 0, 0);

    lbl_clock_date = lv_label_create(parent);
    lv_label_set_text(lbl_clock_date, "SEX 05 SET 2026");
    lv_obj_set_style_text_font(lbl_clock_date, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_clock_date, lv_color_make(220, 220, 225), 0);
    lv_obj_align(lbl_clock_date, LV_ALIGN_BOTTOM_MID, 0, -2);
}

static void build_bottom_left_vehicle(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "PERFIL // CIVIC");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    lbl_car_model = lv_label_create(parent);
    lv_label_set_text(lbl_car_model, curr_cfg.car_model_name);
    lv_obj_set_style_text_color(lbl_car_model, lv_color_make(160, 160, 170), 0);
    lv_obj_set_style_text_font(lbl_car_model, &lv_font_montserrat_10, 0);
    lv_obj_align(lbl_car_model, LV_ALIGN_TOP_RIGHT, -2, 0);

    underglow_rect = lv_obj_create(parent);
    lv_obj_set_size(underglow_rect, (HONDASH_HOR_RES / 2) - 24, 12);
    lv_obj_align(underglow_rect, LV_ALIGN_BOTTOM_MID, 0, -8);
    lv_obj_set_style_bg_color(underglow_rect, pal.primary, 0);
    lv_obj_set_style_bg_opa(underglow_rect, curr_cfg.show_underglow ? LV_OPA_40 : LV_OPA_0);
    lv_obj_set_style_radius(underglow_rect, 6, 0);
    lv_obj_set_style_border_width(underglow_rect, 0, 0);

    lv_obj_t* car_box = lv_obj_create(parent);
    lv_obj_set_size(car_box, (HONDASH_HOR_RES / 2) - 34, 38);
    lv_obj_align(car_box, LV_ALIGN_CENTER, 0, 4);
    lv_obj_set_style_bg_color(car_box, lv_color_make(24, 24, 28), 0);
    lv_obj_set_style_border_color(car_box, pal.primary, 0);
    lv_obj_set_style_border_width(car_box, 1, 0);
    lv_obj_set_style_radius(car_box, 6, 0);

    lv_obj_t* car_lbl = lv_label_create(car_box);
    lv_label_set_text(car_lbl, "[ CAR 360 / GIF ]");
    lv_obj_set_style_text_font(car_lbl, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(car_lbl, lv_color_make(200, 200, 210), 0);
    lv_obj_center(car_lbl);
}

static void build_bottom_right_audio(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "AUDIO SPECTRUM");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    int bar_width = 8;
    int gap = 5;
    int start_x = 12;

    for (int i = 0; i < AUDIO_BARS_COUNT; i++) {
        audio_bars[i] = lv_bar_create(parent);
        lv_obj_set_size(audio_bars[i], bar_width, 42);
        lv_obj_set_pos(audio_bars[i], start_x + (i * (bar_width + gap)), 20);
        lv_bar_set_range(audio_bars[i], 0, 100);
        lv_bar_set_value(audio_bars[i], 20 + (i * 8), LV_ANIM_OFF);
        lv_obj_set_style_bg_color(audio_bars[i], lv_color_make(28, 28, 34), LV_PART_MAIN);
        lv_obj_set_style_bg_color(audio_bars[i], (i >= 6) ? lv_color_make(239, 68, 68) : pal.primary, LV_PART_INDICATOR);
    }
}

static void build_bottom_gauges(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    lv_obj_t* lbl_clt_title = lv_label_create(parent);
    lv_label_set_text(lbl_clt_title, "CLT:");
    lv_obj_set_style_text_font(lbl_clt_title, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_clt_title, lv_color_make(160, 160, 160), 0);
    lv_obj_align(lbl_clt_title, LV_ALIGN_LEFT_MID, 4, 0);

    lbl_coolant_val = lv_label_create(parent);
    lv_label_set_text(lbl_coolant_val, "88C");
    lv_obj_set_style_text_font(lbl_coolant_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_coolant_val, pal.secondary, 0);
    lv_obj_align_to(lbl_coolant_val, lbl_clt_title, LV_ALIGN_OUT_RIGHT_MID, 2, 0);

    bar_coolant = lv_bar_create(parent);
    lv_obj_set_size(bar_coolant, 35, 5);
    lv_obj_align_to(bar_coolant, lbl_coolant_val, LV_ALIGN_OUT_RIGHT_MID, 4, 0);
    lv_bar_set_range(bar_coolant, 50, 125);
    lv_bar_set_value(bar_coolant, 88, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar_coolant, pal.primary, LV_PART_INDICATOR);

    lv_obj_t* lbl_bat_title = lv_label_create(parent);
    lv_label_set_text(lbl_bat_title, "BAT:");
    lv_obj_set_style_text_font(lbl_bat_title, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_bat_title, lv_color_make(160, 160, 160), 0);
    lv_obj_align(lbl_bat_title, LV_ALIGN_CENTER, -40, 0);

    lbl_batt_val = lv_label_create(parent);
    lv_label_set_text(lbl_batt_val, "14.2V");
    lv_obj_set_style_text_font(lbl_batt_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_batt_val, pal.secondary, 0);
    lv_obj_align_to(lbl_batt_val, lbl_bat_title, LV_ALIGN_OUT_RIGHT_MID, 2, 0);

    badge_vtec = lv_label_create(parent);
    lv_label_set_text(badge_vtec, "VTEC");
    lv_obj_set_style_text_font(badge_vtec, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(badge_vtec, lv_color_make(60, 60, 70), 0);
    lv_obj_align(badge_vtec, LV_ALIGN_CENTER, 30, 0);

    badge_cel = lv_label_create(parent);
    lv_label_set_text(badge_cel, "CEL");
    lv_obj_set_style_text_font(badge_cel, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(badge_cel, lv_color_make(60, 60, 70), 0);
    lv_obj_align_to(badge_cel, badge_vtec, LV_ALIGN_OUT_RIGHT_MID, 6, 0);

    lbl_fuel_val = lv_label_create(parent);
    lv_label_set_text(lbl_fuel_val, "75%");
    lv_obj_set_style_text_font(lbl_fuel_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_fuel_val, pal.secondary, 0);
    lv_obj_align(lbl_fuel_val, LV_ALIGN_RIGHT_MID, -4, 0);

    bar_fuel = lv_bar_create(parent);
    lv_obj_set_size(bar_fuel, 30, 5);
    lv_obj_align_to(bar_fuel, lbl_fuel_val, LV_ALIGN_OUT_LEFT_MID, -4, 0);
    lv_bar_set_range(bar_fuel, 0, 100);
    lv_bar_set_value(bar_fuel, 75, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar_fuel, pal.primary, LV_PART_INDICATOR);
}

static void build_vehicle_modal(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];
    vehicle_modal = lv_obj_create(parent);
    lv_obj_set_size(vehicle_modal, HONDASH_HOR_RES, HONDASH_VER_RES);
    lv_obj_set_pos(vehicle_modal, 0, 0);
    lv_obj_set_style_bg_color(vehicle_modal, lv_color_black(), 0);
    lv_obj_set_style_bg_opa(vehicle_modal, LV_OPA_90, 0);
    lv_obj_set_style_border_color(vehicle_modal, pal.primary, 0);
    lv_obj_set_style_border_width(vehicle_modal, 2, 0);
    lv_obj_set_style_radius(vehicle_modal, 0, 0);
    lv_obj_clear_flag(vehicle_modal, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(vehicle_modal, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(vehicle_modal, on_modal_clicked, LV_EVENT_CLICKED, NULL);

    lv_obj_t* hdr = lv_label_create(vehicle_modal);
    lv_label_set_text(hdr, "VEHICLE PROFILE // LIVE 360");
    lv_obj_set_style_text_color(hdr, pal.primary, 0);
    lv_obj_set_style_text_font(hdr, &lv_font_montserrat_12, 0);
    lv_obj_align(hdr, LV_ALIGN_TOP_MID, 0, 6);

    lbl_modal_time = lv_label_create(vehicle_modal);
    lv_label_set_text(lbl_modal_time, "12:00:00");
    lv_obj_set_style_text_font(lbl_modal_time, &lv_font_montserrat_22, 0);
    lv_obj_set_style_text_color(lbl_modal_time, lv_color_white(), 0);
    lv_obj_align(lbl_modal_time, LV_ALIGN_TOP_MID, 0, 26);

    lbl_modal_date = lv_label_create(vehicle_modal);
    lv_label_set_text(lbl_modal_date, "SEX 05 SET 2026");
    lv_obj_set_style_text_font(lbl_modal_date, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_modal_date, pal.secondary, 0);
    lv_obj_align(lbl_modal_date, LV_ALIGN_TOP_MID, 0, 52);

    lv_obj_t* big_car = lv_obj_create(vehicle_modal);
    lv_obj_set_size(big_car, HONDASH_HOR_RES - 30, HONDASH_VER_RES - 90);
    lv_obj_align(big_car, LV_ALIGN_BOTTOM_MID, 0, -8);
    lv_obj_set_style_bg_color(big_car, lv_color_make(18, 18, 22), 0);
    lv_obj_set_style_border_color(big_car, pal.primary, 0);
    lv_obj_set_style_border_width(big_car, 1, 0);
    lv_obj_set_style_radius(big_car, 8, 0);

    lv_obj_t* big_car_lbl = lv_label_create(big_car);
    lv_label_set_text(big_car_lbl, "[ HONDA CIVIC FULLSCREEN ]\\nToque em qualquer lugar para fechar");
    lv_obj_set_style_text_align(big_car_lbl, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_set_style_text_font(big_car_lbl, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(big_car_lbl, lv_color_make(210, 210, 220), 0);
    lv_obj_center(big_car_lbl);

    lv_obj_add_flag(vehicle_modal, LV_OBJ_FLAG_HIDDEN);
}

static void on_clock_clicked(lv_event_t* e) {
    (void)e;
    curr_cfg.use_24h_clock = !curr_cfg.use_24h_clock;
    hondash_set_time(curr_telem.hour, curr_telem.minute, curr_telem.second);
}

static void on_vehicle_clicked(lv_event_t* e) {
    (void)e;
    hondash_set_vehicle_expanded(true);
}

static void on_modal_clicked(lv_event_t* e) {
    (void)e;
    hondash_set_vehicle_expanded(false);
}

static void audio_anim_cb(lv_timer_t* timer) {
    (void)timer;
    static uint32_t tick = 0;
    tick++;
    for (int i = 0; i < AUDIO_BARS_COUNT; i++) {
        int val = (int)((((tick * 7) + (i * 37)) % 80) + 15);
        lv_bar_set_value(audio_bars[i], val, LV_ANIM_ON);
    }
}

void hondash_update_telemetry(const hondash_telemetry_t* data) {
    if (!data) return;
    curr_telem = *data;
    hondash_set_speed(data->speed_kmh);
    hondash_set_rpm(data->rpm);
    hondash_set_gear(data->gear);
    hondash_set_vtec(data->vtec_active);
    hondash_set_cel(data->cel_active);
    hondash_set_coolant_temp(data->coolant_temp_c);
    hondash_set_battery_volts(data->battery_volts);
    hondash_set_fuel_pct(data->fuel_pct);
    hondash_set_time(data->hour, data->minute, data->second);
    hondash_set_date(data->day, data->month, data->year, data->weekday);
}

void hondash_set_speed(int16_t speed) {
    if (!lbl_speed_val) return;
    char buf[16];
    int display_speed = curr_cfg.use_mph ? (int)(speed * 0.621371f) : speed;
    snprintf(buf, sizeof(buf), "%d", display_speed);
    lv_label_set_text(lbl_speed_val, buf);
}

void hondash_set_rpm(int16_t rpm) {
    if (!bar_rpm || !lbl_rpm_val) return;
    lv_bar_set_value(bar_rpm, rpm, LV_ANIM_OFF);
    char buf[20];
    snprintf(buf, sizeof(buf), "%d RPM", rpm);
    lv_label_set_text(lbl_rpm_val, buf);

    if (rpm >= 7000) {
        lv_obj_set_style_bg_color(bar_rpm, lv_color_make(239, 68, 68), LV_PART_INDICATOR);
    } else {
        theme_palette_t pal = THEMES[curr_cfg.theme];
        lv_obj_set_style_bg_color(bar_rpm, pal.primary, LV_PART_INDICATOR);
    }
}

void hondash_set_gear(int8_t gear) {
    if (!lbl_gear_val) return;
    if (gear == 0) lv_label_set_text(lbl_gear_val, "N");
    else if (gear == -1) lv_label_set_text(lbl_gear_val, "R");
    else {
        char buf[8];
        snprintf(buf, sizeof(buf), "%d", gear);
        lv_label_set_text(lbl_gear_val, buf);
    }
}

void hondash_set_vtec(bool active) {
    if (!badge_vtec) return;
    lv_obj_set_style_text_color(badge_vtec, active ? lv_color_make(239, 68, 68) : lv_color_make(60, 60, 70), 0);
}

void hondash_set_cel(bool active) {
    if (!badge_cel) return;
    lv_obj_set_style_text_color(badge_cel, active ? lv_color_make(245, 158, 11) : lv_color_make(60, 60, 70), 0);
}

void hondash_set_coolant_temp(float temp_c) {
    if (!bar_coolant || !lbl_coolant_val) return;
    lv_bar_set_value(bar_coolant, (int32_t)temp_c, LV_ANIM_OFF);
    char buf[16];
    if (curr_cfg.use_fahrenheit) snprintf(buf, sizeof(buf), "%dF", (int)((temp_c * 1.8f) + 32));
    else snprintf(buf, sizeof(buf), "%dC", (int)temp_c);
    lv_label_set_text(lbl_coolant_val, buf);
}

void hondash_set_battery_volts(float volts) {
    if (!lbl_batt_val) return;
    char buf[16];
    snprintf(buf, sizeof(buf), "%.1fV", volts);
    lv_label_set_text(lbl_batt_val, buf);
}

void hondash_set_fuel_pct(float pct) {
    if (!bar_fuel || !lbl_fuel_val) return;
    lv_bar_set_value(bar_fuel, (int32_t)pct, LV_ANIM_OFF);
    char buf[16];
    snprintf(buf, sizeof(buf), "%d%%", (int)pct);
    lv_label_set_text(lbl_fuel_val, buf);
}

void hondash_set_time(uint8_t h, uint8_t m, uint8_t s) {
    curr_telem.hour = h;
    curr_telem.minute = m;
    curr_telem.second = s;
    char buf_time[16], buf_sec[8];
    uint8_t disp_h = h;
    const char* ampm = "";

    if (!curr_cfg.use_24h_clock) {
        disp_h = (h % 12 == 0) ? 12 : (h % 12);
        ampm = (h >= 12) ? "PM" : "AM";
    }

    snprintf(buf_time, sizeof(buf_time), "%02d:%02d", disp_h, m);
    snprintf(buf_sec, sizeof(buf_sec), "%02d", s);

    if (lbl_clock_time) lv_label_set_text(lbl_clock_time, buf_time);
    if (lbl_clock_sec)  lv_label_set_text(lbl_clock_sec, buf_sec);
    if (lbl_clock_ampm) lv_label_set_text(lbl_clock_ampm, ampm);

    if (lbl_modal_time) {
        char buf_modal[24];
        if (!curr_cfg.use_24h_clock) snprintf(buf_modal, sizeof(buf_modal), "%02d:%02d:%02d %s", disp_h, m, s, ampm);
        else snprintf(buf_modal, sizeof(buf_modal), "%02d:%02d:%02d", h, m, s);
        lv_label_set_text(lbl_modal_time, buf_modal);
    }
}

void hondash_set_date(uint8_t day, uint8_t month, uint16_t year, uint8_t weekday) {
    curr_telem.day = day;
    curr_telem.month = month;
    curr_telem.year = year;
    curr_telem.weekday = weekday;
    const char* wk = (weekday < 7) ? WEEKDAYS[weekday] : "DIA";
    const char* mo = (month >= 1 && month <= 12) ? MONTHS[month - 1] : "MES";
    char buf[32];
    snprintf(buf, sizeof(buf), "%s %02d %s %d", wk, day, mo, year);
    if (lbl_clock_date) lv_label_set_text(lbl_clock_date, buf);
    if (lbl_modal_date) lv_label_set_text(lbl_modal_date, buf);
}

void hondash_set_theme(hondash_theme_t theme) {
    if (theme >= HONDASH_THEME_COUNT) return;
    curr_cfg.theme = theme;
    theme_palette_t pal = THEMES[theme];
    if (dot_clock_glow) lv_obj_set_style_bg_color(dot_clock_glow, pal.primary, 0);
    if (underglow_rect) lv_obj_set_style_bg_color(underglow_rect, pal.primary, 0);
    if (bar_rpm)        lv_obj_set_style_bg_color(bar_rpm, pal.primary, LV_PART_INDICATOR);
    if (lbl_gear_val)   lv_obj_set_style_text_color(lbl_gear_val, pal.secondary, 0);
    if (lbl_clock_sec)  lv_obj_set_style_text_color(lbl_clock_sec, pal.secondary, 0);
    if (bar_coolant)    lv_obj_set_style_bg_color(bar_coolant, pal.primary, LV_PART_INDICATOR);
    if (bar_fuel)       lv_obj_set_style_bg_color(bar_fuel, pal.primary, LV_PART_INDICATOR);
    if (vehicle_modal)  lv_obj_set_style_border_color(vehicle_modal, pal.primary, 0);
}

void hondash_set_clock_format(bool use_24h) {
    curr_cfg.use_24h_clock = use_24h;
    hondash_set_time(curr_telem.hour, curr_telem.minute, curr_telem.second);
}

void hondash_set_vehicle_expanded(bool expanded) {
    is_vehicle_expanded = expanded;
    if (!vehicle_modal) return;
    if (expanded) {
        lv_obj_clear_flag(vehicle_modal, LV_OBJ_FLAG_HIDDEN);
        lv_obj_move_foreground(vehicle_modal);
    } else {
        lv_obj_add_flag(vehicle_modal, LV_OBJ_FLAG_HIDDEN);
    }
}`
  },
  {
    id: 'main_esp32_cpp',
    name: 'main_esp32.cpp',
    lang: 'cpp',
    description: 'Firmware de exemplo para ESP32 / Arduino com drivers TFT_eSPI, Touch e Thread de Telemetria',
    code: `/**
 * @file main_esp32.cpp
 * @brief HonDASH - Honda Civic LVGL Embedded Firmware for ESP32 / ESP32-S3
 * @details Displays: 240x320, 320x240, 480x320 (e.g. ST7789, ILI9341, ESP32-CYD)
 */

#include <Arduino.h>
#include <lvgl.h>
#include <TFT_eSPI.h>
#include "hondash_ui.h"

#define SCREEN_WIDTH  320
#define SCREEN_HEIGHT 240

static TFT_eSPI tft = TFT_eSPI();
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf1[SCREEN_WIDTH * 20];
static lv_color_t buf2[SCREEN_WIDTH * 20];

void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    tft.endWrite();

    lv_disp_flush_ready(disp);
}

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
        telem.speed_kmh += speed_dir * 2;
        if (telem.speed_kmh >= 130) speed_dir = -1;
        if (telem.speed_kmh <= 10)  speed_dir = 1;

        telem.rpm = 1000 + (telem.speed_kmh * 55);
        if (telem.rpm > 8500) telem.rpm = 8500;
        telem.vtec_active = (telem.rpm >= 5800);

        if (telem.speed_kmh < 25)       telem.gear = 1;
        else if (telem.speed_kmh < 50)  telem.gear = 2;
        else if (telem.speed_kmh < 80)  telem.gear = 3;
        else if (telem.speed_kmh < 110) telem.gear = 4;
        else                            telem.gear = 5;

        telem.second++;
        if (telem.second >= 60) {
            telem.second = 0;
            telem.minute++;
            if (telem.minute >= 60) {
                telem.minute = 0;
                telem.hour = (telem.hour + 1) % 24;
            }
        }

        hondash_update_telemetry(&telem);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void setup() {
    Serial.begin(115200);
    tft.init();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);

    lv_init();
    lv_disp_draw_buf_init(&draw_buf, buf1, buf2, SCREEN_WIDTH * 20);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = SCREEN_WIDTH;
    disp_drv.ver_res = SCREEN_HEIGHT;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

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
    lv_timer_handler();
    delay(5);
}`
  },
  {
    id: 'lv_conf_h',
    name: 'lv_conf.h',
    lang: 'c',
    description: 'Configuração do LVGL v8 para ESP32: 16-bit RGB565, fontes Montserrat e widgets ativados',
    code: `/**
 * @file lv_conf.h
 * @brief Configuration file for LVGL v8.x on ESP32 / HonDASH
 */

#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

#define LV_COLOR_DEPTH 16
#define LV_COLOR_16_SWAP 0
#define LV_MEM_CUSTOM 0
#define LV_MEM_SIZE (48U * 1024U)

#define LV_DISP_DEF_REFR_PERIOD 30
#define LV_INDEV_DEF_READ_PERIOD 30

#define LV_USE_ANIMATION 1
#define LV_USE_SHADOW 1
#define LV_USE_BLEND_MODES 1
#define LV_USE_OPA_SCALE 1

#define LV_USE_ARC 1
#define LV_USE_BAR 1
#define LV_USE_BTN 1
#define LV_USE_CANVAS 1
#define LV_USE_CHECKBOX 1
#define LV_USE_IMG 1
#define LV_USE_LABEL 1
#define LV_USE_LINE 1
#define LV_USE_METER 1
#define LV_USE_SLIDER 1

#define LV_FONT_MONTSERRAT_10 1
#define LV_FONT_MONTSERRAT_12 1
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_20 1
#define LV_FONT_MONTSERRAT_22 1
#define LV_FONT_MONTSERRAT_28 1
#define LV_FONT_DEFAULT &lv_font_montserrat_12

#define LV_USE_LOG 1
#define LV_LOG_LEVEL LV_LOG_LEVEL_WARN

#endif /* LV_CONF_H */`
  },
  {
    id: 'platformio_ini',
    name: 'platformio.ini',
    lang: 'ini',
    description: 'Arquivo de compilação PlatformIO pronto para VS Code e ESP32 / CYD',
    code: `; PlatformIO Project Configuration File for HonDASH LVGL (ESP32)

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600

lib_deps =
    lvgl/lvgl@^8.3.11
    bodmer/TFT_eSPI@^2.5.43

build_flags =
    -D USER_SETUP_LOADED=1
    -D ILI9341_DRIVER=1
    -D TFT_MISO=19
    -D TFT_MOSI=23
    -D TFT_SCLK=18
    -D TFT_CS=15
    -D TFT_DC=2
    -D TFT_RST=4
    -D TOUCH_CS=21
    -D SPI_FREQUENCY=40000000
    -D SPI_TOUCH_FREQUENCY=2500000
    -I lvgl
    -D LV_CONF_INCLUDE_SIMPLE

[env:esp32s3-cyd]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
monitor_speed = 115200
build_flags =
    -D LV_CONF_INCLUDE_SIMPLE
    -I lvgl
lib_deps =
    lvgl/lvgl@^8.3.11
    bodmer/TFT_eSPI@^2.5.43`
  }
];
