/**
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
static lv_obj_t* arc_rpm            = NULL;
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
static lv_style_t style_primary_txt;
static lv_style_t style_secondary_txt;

/* --- Internal Prototypes --- */
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

/* ========================================================================= */
/* INITIALIZATION                                                            */
/* ========================================================================= */

void hondash_ui_init(const hondash_config_t* cfg) {
    if (cfg) {
        curr_cfg = *cfg;
    } else {
        curr_cfg.theme = HONDASH_THEME_RED;
        curr_cfg.use_24h_clock = true;
        curr_cfg.use_mph = false;
        curr_cfg.use_fahrenheit = false;
        curr_cfg.show_underglow = true;
        curr_cfg.show_vehicle_clock = true;
        curr_cfg.car_model_name = "CIVIC Si";
    }

    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Screen Root */
    scr_root = lv_scr_act();
    lv_obj_set_style_bg_color(scr_root, lv_color_black(), 0);
    lv_obj_clear_flag(scr_root, LV_OBJ_FLAG_SCROLLABLE);

    /* Base Card Style */
    lv_style_init(&style_card);
    lv_style_set_bg_color(&style_card, lv_color_make(18, 18, 20));
    lv_style_set_bg_opa(&style_card, LV_OPA_90);
    lv_style_set_border_color(&style_card, lv_color_make(45, 45, 50));
    lv_style_set_border_width(&style_card, 1);
    lv_style_set_radius(&style_card, 8);
    lv_style_set_pad_all(&style_card, 6);

    /* Text Styles */
    lv_style_init(&style_primary_txt);
    lv_style_set_text_color(&style_primary_txt, pal.primary);

    lv_style_init(&style_secondary_txt);
    lv_style_set_text_color(&style_secondary_txt, pal.secondary);

    /* Grid Layout: 2x2 Quadrants + Bottom Bar */
    /* Top Left: Speedometer & RPM */
    quad_speed = lv_obj_create(scr_root);
    lv_obj_add_style(quad_speed, &style_card, 0);
    lv_obj_set_size(quad_speed, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_speed, 2, 2);
    lv_obj_clear_flag(quad_speed, LV_OBJ_FLAG_SCROLLABLE);
    build_top_left_speed(quad_speed);

    /* Top Right: Clock & Weather HUD */
    quad_clock = lv_obj_create(scr_root);
    lv_obj_add_style(quad_clock, &style_card, 0);
    lv_obj_set_size(quad_clock, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_clock, (HONDASH_HOR_RES / 2) + 2, 2);
    lv_obj_clear_flag(quad_clock, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(quad_clock, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(quad_clock, on_clock_clicked, LV_EVENT_CLICKED, NULL);
    build_top_right_clock(quad_clock);

    /* Bottom Left: Civic Vehicle Profile */
    quad_vehicle = lv_obj_create(scr_root);
    lv_obj_add_style(quad_vehicle, &style_card, 0);
    lv_obj_set_size(quad_vehicle, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_vehicle, 2, (HONDASH_VER_RES / 2) - 12);
    lv_obj_clear_flag(quad_vehicle, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_add_flag(quad_vehicle, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(quad_vehicle, on_vehicle_clicked, LV_EVENT_CLICKED, NULL);
    build_bottom_left_vehicle(quad_vehicle);

    /* Bottom Right: Audio Visualizer */
    quad_audio = lv_obj_create(scr_root);
    lv_obj_add_style(quad_audio, &style_card, 0);
    lv_obj_set_size(quad_audio, (HONDASH_HOR_RES / 2) - 4, (HONDASH_VER_RES / 2) - 16);
    lv_obj_set_pos(quad_audio, (HONDASH_HOR_RES / 2) + 2, (HONDASH_VER_RES / 2) - 12);
    lv_obj_clear_flag(quad_audio, LV_OBJ_FLAG_SCROLLABLE);
    build_bottom_right_audio(quad_audio);

    /* Bottom Bar: Engine Gauges */
    bottom_bar = lv_obj_create(scr_root);
    lv_obj_set_size(bottom_bar, HONDASH_HOR_RES - 4, 24);
    lv_obj_set_pos(bottom_bar, 2, HONDASH_VER_RES - 26);
    lv_obj_set_style_bg_color(bottom_bar, lv_color_make(10, 10, 12), 0);
    lv_obj_set_style_border_color(bottom_bar, lv_color_make(35, 35, 40), 0);
    lv_obj_set_style_border_width(bottom_bar, 1, 0);
    lv_obj_set_style_radius(bottom_bar, 4, 0);
    lv_obj_clear_flag(bottom_bar, LV_OBJ_FLAG_SCROLLABLE);
    build_bottom_gauges(bottom_bar);

    /* Modal Fullscreen View for Vehicle */
    build_vehicle_modal(scr_root);

    /* Start simulated audio visualizer timer */
    audio_anim_timer = lv_timer_create(audio_anim_cb, 80, NULL);
}

/* ========================================================================= */
/* QUADRANT 1: SPEED & RPM                                                   */
/* ========================================================================= */

static void build_top_left_speed(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Title */
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "VELOCIDADE // RPM");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    /* Digital Speed Value */
    lbl_speed_val = lv_label_create(parent);
    lv_label_set_text(lbl_speed_val, "0");
    lv_obj_set_style_text_font(lbl_speed_val, &lv_font_montserrat_28, 0);
    lv_obj_set_style_text_color(lbl_speed_val, lv_color_white(), 0);
    lv_obj_align(lbl_speed_val, LV_ALIGN_CENTER, -15, -6);

    /* Speed Unit */
    lbl_speed_unit = lv_label_create(parent);
    lv_label_set_text(lbl_speed_unit, curr_cfg.use_mph ? "MPH" : "KM/H");
    lv_obj_set_style_text_color(lbl_speed_unit, lv_color_make(160, 160, 170), 0);
    lv_obj_set_style_text_font(lbl_speed_unit, &lv_font_montserrat_10, 0);
    lv_obj_align_to(lbl_speed_unit, lbl_speed_val, LV_ALIGN_OUT_RIGHT_BOTTOM, 4, -4);

    /* Gear Indicator */
    lbl_gear_val = lv_label_create(parent);
    lv_label_set_text(lbl_gear_val, "N");
    lv_obj_set_style_text_font(lbl_gear_val, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(lbl_gear_val, pal.secondary, 0);
    lv_obj_align(lbl_gear_val, LV_ALIGN_TOP_RIGHT, -4, 0);

    /* RPM Bar */
    bar_rpm = lv_bar_create(parent);
    lv_obj_set_size(bar_rpm, (HONDASH_HOR_RES / 2) - 18, 6);
    lv_obj_align(bar_rpm, LV_ALIGN_BOTTOM_MID, 0, -2);
    lv_bar_set_range(bar_rpm, 0, 9000);
    lv_bar_set_value(bar_rpm, 0, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar_rpm, lv_color_make(30, 30, 35), LV_PART_MAIN);
    lv_obj_set_style_bg_color(bar_rpm, pal.primary, LV_PART_INDICATOR);

    /* RPM Numerical readout */
    lbl_rpm_val = lv_label_create(parent);
    lv_label_set_text(lbl_rpm_val, "0 RPM");
    lv_obj_set_style_text_font(lbl_rpm_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_rpm_val, lv_color_make(180, 180, 180), 0);
    lv_obj_align_to(lbl_rpm_val, bar_rpm, LV_ALIGN_OUT_TOP_RIGHT, 0, -2);
}

/* ========================================================================= */
/* QUADRANT 2: CLOCK & DATE HUD                                              */
/* ========================================================================= */

static void build_top_right_clock(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Subheader */
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "TIME / DATE");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    /* Time: Hours & Minutes */
    lbl_clock_time = lv_label_create(parent);
    lv_label_set_text(lbl_clock_time, "12:00");
    lv_obj_set_style_text_font(lbl_clock_time, &lv_font_montserrat_22, 0);
    lv_obj_set_style_text_color(lbl_clock_time, lv_color_white(), 0);
    lv_obj_align(lbl_clock_time, LV_ALIGN_CENTER, -12, -6);

    /* Seconds */
    lbl_clock_sec = lv_label_create(parent);
    lv_label_set_text(lbl_clock_sec, "00");
    lv_obj_set_style_text_font(lbl_clock_sec, &lv_font_montserrat_12, 0);
    lv_obj_set_style_text_color(lbl_clock_sec, pal.secondary, 0);
    lv_obj_align_to(lbl_clock_sec, lbl_clock_time, LV_ALIGN_OUT_RIGHT_BOTTOM, 3, -2);

    /* AM/PM */
    lbl_clock_ampm = lv_label_create(parent);
    lv_label_set_text(lbl_clock_ampm, "");
    lv_obj_set_style_text_font(lbl_clock_ampm, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_clock_ampm, lv_color_make(140, 140, 150), 0);
    lv_obj_align_to(lbl_clock_ampm, lbl_clock_sec, LV_ALIGN_OUT_TOP_MID, 0, -2);

    /* Divider Line with Center Glowing Dot */
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

    /* Date Label */
    lbl_clock_date = lv_label_create(parent);
    lv_label_set_text(lbl_clock_date, "SEX 05 SET 2026");
    lv_obj_set_style_text_font(lbl_clock_date, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_clock_date, lv_color_make(220, 220, 225), 0);
    lv_obj_align(lbl_clock_date, LV_ALIGN_BOTTOM_MID, 0, -2);
}

/* ========================================================================= */
/* QUADRANT 3: VEHICLE PROFILE                                               */
/* ========================================================================= */

static void build_bottom_left_vehicle(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Title */
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "PERFIL // CIVIC");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    /* Model Subtitle */
    lbl_car_model = lv_label_create(parent);
    lv_label_set_text(lbl_car_model, curr_cfg.car_model_name);
    lv_obj_set_style_text_color(lbl_car_model, lv_color_make(160, 160, 170), 0);
    lv_obj_set_style_text_font(lbl_car_model, &lv_font_montserrat_10, 0);
    lv_obj_align(lbl_car_model, LV_ALIGN_TOP_RIGHT, -2, 0);

    /* Underglow Effect */
    underglow_rect = lv_obj_create(parent);
    lv_obj_set_size(underglow_rect, (HONDASH_HOR_RES / 2) - 24, 12);
    lv_obj_align(underglow_rect, LV_ALIGN_BOTTOM_MID, 0, -8);
    lv_obj_set_style_bg_color(underglow_rect, pal.primary, 0);
    lv_obj_set_style_bg_opa(underglow_rect, curr_cfg.show_underglow ? LV_OPA_40 : LV_OPA_0);
    lv_obj_set_style_radius(underglow_rect, 6, 0);
    lv_obj_set_style_border_width(underglow_rect, 0, 0);

    /* Vehicle Wireframe Representation / Icon */
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

    /* Hint text */
    lv_obj_t* hint = lv_label_create(parent);
    lv_label_set_text(hint, "TOQUE P/ EXPANDIR");
    lv_obj_set_style_text_font(hint, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(hint, lv_color_make(110, 110, 120), 0);
    lv_obj_align(hint, LV_ALIGN_BOTTOM_MID, 0, -2);
}

/* ========================================================================= */
/* QUADRANT 4: AUDIO VISUALIZER                                              */
/* ========================================================================= */

static void build_bottom_right_audio(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Title */
    lv_obj_t* title = lv_label_create(parent);
    lv_label_set_text(title, "AUDIO SPECTRUM");
    lv_obj_set_style_text_color(title, pal.primary, 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_10, 0);
    lv_obj_align(title, LV_ALIGN_TOP_LEFT, 2, 0);

    /* 8 Spectrum Equalizer Bars */
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

/* ========================================================================= */
/* BOTTOM GAUGES BAR                                                         */
/* ========================================================================= */

static void build_bottom_gauges(lv_obj_t* parent) {
    theme_palette_t pal = THEMES[curr_cfg.theme];

    /* Coolant Temp Label & Bar */
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

    /* Battery Voltage */
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

    /* VTEC Badge */
    badge_vtec = lv_label_create(parent);
    lv_label_set_text(badge_vtec, "VTEC");
    lv_obj_set_style_text_font(badge_vtec, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(badge_vtec, lv_color_make(60, 60, 70), 0);
    lv_obj_align(badge_vtec, LV_ALIGN_CENTER, 30, 0);

    /* CEL Badge */
    badge_cel = lv_label_create(parent);
    lv_label_set_text(badge_cel, "CEL");
    lv_obj_set_style_text_font(badge_cel, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(badge_cel, lv_color_make(60, 60, 70), 0);
    lv_obj_align_to(badge_cel, badge_vtec, LV_ALIGN_OUT_RIGHT_MID, 6, 0);

    /* Fuel Level */
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

/* ========================================================================= */
/* VEHICLE MODAL / EXPANDED FULLSCREEN VIEW                                  */
/* ========================================================================= */

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

    /* Header */
    lv_obj_t* hdr = lv_label_create(vehicle_modal);
    lv_label_set_text(hdr, "VEHICLE PROFILE // LIVE 360");
    lv_obj_set_style_text_color(hdr, pal.primary, 0);
    lv_obj_set_style_text_font(hdr, &lv_font_montserrat_12, 0);
    lv_obj_align(hdr, LV_ALIGN_TOP_MID, 0, 6);

    /* Time & Date HUD above vehicle in modal */
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

    /* Large Vehicle Box / Frame */
    lv_obj_t* big_car = lv_obj_create(vehicle_modal);
    lv_obj_set_size(big_car, HONDASH_HOR_RES - 30, HONDASH_VER_RES - 90);
    lv_obj_align(big_car, LV_ALIGN_BOTTOM_MID, 0, -8);
    lv_obj_set_style_bg_color(big_car, lv_color_make(18, 18, 22), 0);
    lv_obj_set_style_border_color(big_car, pal.primary, 0);
    lv_obj_set_style_border_width(big_car, 1, 0);
    lv_obj_set_style_radius(big_car, 8, 0);

    lv_obj_t* big_car_lbl = lv_label_create(big_car);
    lv_label_set_text(big_car_lbl, "[ HONDA CIVIC FULLSCREEN ]\nToque em qualquer lugar para fechar");
    lv_obj_set_style_text_align(big_car_lbl, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_set_style_text_font(big_car_lbl, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(big_car_lbl, lv_color_make(210, 210, 220), 0);
    lv_obj_center(big_car_lbl);

    /* Initially Hidden */
    lv_obj_add_flag(vehicle_modal, LV_OBJ_FLAG_HIDDEN);
}

/* ========================================================================= */
/* EVENT HANDLERS                                                            */
/* ========================================================================= */

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
    /* Clicking anywhere on the modal minimizes it back to dashboard */
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

/* ========================================================================= */
/* PUBLIC TELEMETRY API                                                      */
/* ========================================================================= */

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

    /* Change color to red if reaching redline (> 7000) */
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
    if (active) {
        lv_obj_set_style_text_color(badge_vtec, lv_color_make(239, 68, 68), 0);
    } else {
        lv_obj_set_style_text_color(badge_vtec, lv_color_make(60, 60, 70), 0);
    }
}

void hondash_set_cel(bool active) {
    if (!badge_cel) return;
    if (active) {
        lv_obj_set_style_text_color(badge_cel, lv_color_make(245, 158, 11), 0);
    } else {
        lv_obj_set_style_text_color(badge_cel, lv_color_make(60, 60, 70), 0);
    }
}

void hondash_set_coolant_temp(float temp_c) {
    if (!bar_coolant || !lbl_coolant_val) return;
    lv_bar_set_value(bar_coolant, (int32_t)temp_c, LV_ANIM_OFF);
    char buf[16];
    if (curr_cfg.use_fahrenheit) {
        snprintf(buf, sizeof(buf), "%dF", (int)((temp_c * 1.8f) + 32));
    } else {
        snprintf(buf, sizeof(buf), "%dC", (int)temp_c);
    }
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

    char buf_time[16];
    char buf_sec[8];

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

    /* Also update in vehicle modal */
    if (lbl_modal_time) {
        char buf_modal[24];
        if (!curr_cfg.use_24h_clock) {
            snprintf(buf_modal, sizeof(buf_modal), "%02d:%02d:%02d %s", disp_h, m, s, ampm);
        } else {
            snprintf(buf_modal, sizeof(buf_modal), "%02d:%02d:%02d", h, m, s);
        }
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
}
