/**
 * @file ui_hondash.c
 * HonDash ESP32-S3 LVGL Graphical Interface for Freenove 2.8" IPS Touch (320x240)
 */

#include "ui_hondash.h"
#include <stdio.h>

// Screens
static lv_obj_t *main_screen;
static lv_obj_t *screen_cyber_hud;
static lv_obj_t *screen_classic;
static lv_obj_t *screen_track;
static lv_obj_t *screen_dtc;
static lv_obj_t *top_menu_drawer;

// Widgets for Cyber HUD
static lv_obj_t *arc_rpm;
static lv_obj_t *lbl_rpm_val;
static lv_obj_t *lbl_speed_val;
static lv_obj_t *lbl_speed_unit;
static lv_obj_t *bar_ect;
static lv_obj_t *lbl_ect_val;
static lv_obj_t *lbl_iat_val;
static lv_obj_t *lbl_map_val;
static lv_obj_t *lbl_volt_val;
static lv_obj_t *lbl_afr_val;
static lv_obj_t *led_vtec;
static lv_obj_t *lbl_vtec;
static lv_obj_t *led_cel;
static lv_obj_t *shift_light_bar;
static lv_obj_t *civic_canvas;

// Colors (Honda Red Theme)
#define COLOR_BG        lv_color_hex(0x0a0a0c)
#define COLOR_PANEL     lv_color_hex(0x121216)
#define COLOR_BORDER    lv_color_hex(0x27272a)
#define COLOR_HONDA_RED lv_color_hex(0xdc2626)
#define COLOR_VTEC_GRN  lv_color_hex(0x10b981)
#define COLOR_AMBER     lv_color_hex(0xf59e0b)
#define COLOR_CYAN      lv_color_hex(0x06b6d4)
#define COLOR_WHITE     lv_color_hex(0xffffff)
#define COLOR_MUTED     lv_color_hex(0x71717a)

static int current_screen_index = 0;
static bool menu_is_open = false;

// Forward declarations
static void create_cyber_hud_screen(void);
static void create_top_menu(void);
static void draw_civic_blueprint_canvas(void);

// Event callback for Top Menu toggle
static void menu_btn_event_cb(lv_event_t *e) {
    ui_hondash_toggle_menu();
}

static void nav_btn_event_cb(lv_event_t *e) {
    int target_idx = (int)(intptr_t)lv_event_get_user_data(e);
    ui_hondash_switch_screen(target_idx);
    ui_hondash_toggle_menu();
}

void ui_hondash_init(void) {
    main_screen = lv_scr_act();
    lv_obj_set_style_bg_color(main_screen, COLOR_BG, 0);

    create_cyber_hud_screen();
    create_top_menu();
}

static void create_cyber_hud_screen(void) {
    screen_cyber_hud = lv_obj_create(main_screen);
    lv_obj_set_size(screen_cyber_hud, 320, 240);
    lv_obj_set_style_bg_color(screen_cyber_hud, COLOR_BG, 0);
    lv_obj_set_style_border_width(screen_cyber_hud, 0, 0);
    lv_obj_set_style_pad_all(screen_cyber_hud, 2, 0);
    lv_obj_clear_flag(screen_cyber_hud, LV_OBJ_FLAG_SCROLLABLE);

    // -------------------------------------------------------------
    // TOP SHIFT LIGHT BAR (Red Alert across full 320 width)
    // -------------------------------------------------------------
    shift_light_bar = lv_obj_create(screen_cyber_hud);
    lv_obj_set_size(shift_light_bar, 316, 6);
    lv_obj_align(shift_light_bar, LV_ALIGN_TOP_MID, 0, 0);
    lv_obj_set_style_bg_color(shift_light_bar, COLOR_HONDA_RED, 0);
    lv_obj_set_style_border_width(shift_light_bar, 0, 0);
    lv_obj_add_flag(shift_light_bar, LV_OBJ_FLAG_HIDDEN); // hidden until redline

    // -------------------------------------------------------------
    // TOP STATUS / BRAND BAR (Y: 6 -> 24)
    // -------------------------------------------------------------
    lv_obj_t *lbl_brand = lv_label_create(screen_cyber_hud);
    lv_label_set_text(lbl_brand, "HONDASH CYD S3");
    lv_obj_set_style_text_color(lbl_brand, COLOR_HONDA_RED, 0);
    lv_obj_set_style_text_font(lbl_brand, &lv_font_montserrat_12, 0);
    lv_obj_align(lbl_brand, LV_ALIGN_TOP_LEFT, 6, 8);

    // VTEC Indicator Badge
    led_vtec = lv_led_create(screen_cyber_hud);
    lv_obj_set_size(led_vtec, 10, 10);
    lv_obj_align(led_vtec, LV_ALIGN_TOP_RIGHT, -60, 9);
    lv_led_set_color(led_vtec, COLOR_VTEC_GRN);
    lv_led_off(led_vtec);

    lbl_vtec = lv_label_create(screen_cyber_hud);
    lv_label_set_text(lbl_vtec, "VTEC");
    lv_obj_set_style_text_color(lbl_vtec, COLOR_MUTED, 0);
    lv_obj_set_style_text_font(lbl_vtec, &lv_font_montserrat_10, 0);
    lv_obj_align(lbl_vtec, LV_ALIGN_TOP_RIGHT, -28, 9);

    // Menu Pull Button in top center
    lv_obj_t *btn_menu_tab = lv_btn_create(screen_cyber_hud);
    lv_obj_set_size(btn_menu_tab, 54, 16);
    lv_obj_align(btn_menu_tab, LV_ALIGN_TOP_MID, 0, 4);
    lv_obj_set_style_bg_color(btn_menu_tab, COLOR_PANEL, 0);
    lv_obj_set_style_border_color(btn_menu_tab, COLOR_BORDER, 0);
    lv_obj_set_style_border_width(btn_menu_tab, 1, 0);
    lv_obj_set_style_radius(btn_menu_tab, 4, 0);
    lv_obj_set_style_pad_all(btn_menu_tab, 0, 0);
    lv_obj_add_event_cb(btn_menu_tab, menu_btn_event_cb, LV_EVENT_CLICKED, NULL);

    lv_obj_t *lbl_tab = lv_label_create(btn_menu_tab);
    lv_label_set_text(lbl_tab, "MENU");
    lv_obj_set_style_text_font(lbl_tab, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_tab, COLOR_WHITE, 0);
    lv_obj_center(lbl_tab);

    // -------------------------------------------------------------
    // LEFT QUADRANT: TACHOMETER ARC & RPM DISPLAY (0 - 9000 RPM)
    // -------------------------------------------------------------
    lv_obj_t *panel_tach = lv_obj_create(screen_cyber_hud);
    lv_obj_set_size(panel_tach, 154, 110);
    lv_obj_align(panel_tach, LV_ALIGN_TOP_LEFT, 4, 24);
    lv_obj_set_style_bg_color(panel_tach, COLOR_PANEL, 0);
    lv_obj_set_style_border_color(panel_tach, COLOR_BORDER, 0);
    lv_obj_set_style_border_width(panel_tach, 1, 0);
    lv_obj_set_style_radius(panel_tach, 8, 0);
    lv_obj_set_style_pad_all(panel_tach, 4, 0);

    arc_rpm = lv_arc_create(panel_tach);
    lv_obj_set_size(arc_rpm, 100, 100);
    lv_obj_align(arc_rpm, LV_ALIGN_CENTER, 0, -4);
    lv_arc_set_rotation(arc_rpm, 135);
    lv_arc_set_bg_angles(arc_rpm, 0, 270);
    lv_arc_set_range(arc_rpm, 0, 9000);
    lv_arc_set_value(arc_rpm, 850);
    lv_obj_set_style_arc_color(arc_rpm, COLOR_BORDER, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc_rpm, COLOR_HONDA_RED, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc_rpm, 8, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc_rpm, 8, LV_PART_INDICATOR);
    lv_obj_remove_style(arc_rpm, NULL, LV_PART_KNOB);

    lbl_rpm_val = lv_label_create(panel_tach);
    lv_label_set_text(lbl_rpm_val, "850");
    lv_obj_set_style_text_font(lbl_rpm_val, &lv_font_montserrat_20, 0);
    lv_obj_set_style_text_color(lbl_rpm_val, COLOR_WHITE, 0);
    lv_obj_align(lbl_rpm_val, LV_ALIGN_CENTER, 0, -6);

    lv_obj_t *lbl_rpm_tag = lv_label_create(panel_tach);
    lv_label_set_text(lbl_rpm_tag, "RPM x1000");
    lv_obj_set_style_text_font(lbl_rpm_tag, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_rpm_tag, COLOR_MUTED, 0);
    lv_obj_align(lbl_rpm_tag, LV_ALIGN_CENTER, 0, 14);

    // -------------------------------------------------------------
    // RIGHT QUADRANT: SPEEDOMETER & SENSORS (0 - 240 KM/H)
    // -------------------------------------------------------------
    lv_obj_t *panel_speed = lv_obj_create(screen_cyber_hud);
    lv_obj_set_size(panel_speed, 154, 110);
    lv_obj_align(panel_speed, LV_ALIGN_TOP_RIGHT, -4, 24);
    lv_obj_set_style_bg_color(panel_speed, COLOR_PANEL, 0);
    lv_obj_set_style_border_color(panel_speed, COLOR_BORDER, 0);
    lv_obj_set_style_border_width(panel_speed, 1, 0);
    lv_obj_set_style_radius(panel_speed, 8, 0);
    lv_obj_set_style_pad_all(panel_speed, 4, 0);

    lbl_speed_val = lv_label_create(panel_speed);
    lv_label_set_text(lbl_speed_val, "0");
    lv_obj_set_style_text_font(lbl_speed_val, &lv_font_montserrat_32, 0);
    lv_obj_set_style_text_color(lbl_speed_val, COLOR_WHITE, 0);
    lv_obj_align(lbl_speed_val, LV_ALIGN_CENTER, 0, -10);

    lbl_speed_unit = lv_label_create(panel_speed);
    lv_label_set_text(lbl_speed_unit, "KM / H");
    lv_obj_set_style_text_font(lbl_speed_unit, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_speed_unit, COLOR_HONDA_RED, 0);
    lv_obj_align(lbl_speed_unit, LV_ALIGN_CENTER, 0, 18);

    // -------------------------------------------------------------
    // BOTTOM LEFT: CIVIC 99 SEDAN BLUEPRINT CANVO / PROFILE
    // -------------------------------------------------------------
    lv_obj_t *panel_civic = lv_obj_create(screen_cyber_hud);
    lv_obj_set_size(panel_civic, 154, 96);
    lv_obj_align(panel_civic, LV_ALIGN_BOTTOM_LEFT, 4, -4);
    lv_obj_set_style_bg_color(panel_civic, COLOR_PANEL, 0);
    lv_obj_set_style_border_color(panel_civic, COLOR_BORDER, 0);
    lv_obj_set_style_border_width(panel_civic, 1, 0);
    lv_obj_set_style_radius(panel_civic, 8, 0);
    lv_obj_set_style_pad_all(panel_civic, 2, 0);

    lv_obj_t *lbl_civic_title = lv_label_create(panel_civic);
    lv_label_set_text(lbl_civic_title, "CIVIC 99 SEDAN");
    lv_obj_set_style_text_font(lbl_civic_title, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_civic_title, COLOR_MUTED, 0);
    lv_obj_align(lbl_civic_title, LV_ALIGN_TOP_LEFT, 4, 2);

    // Canvas drawing for Civic vector silhouette
    static lv_color_t cbuf[146 * 68];
    civic_canvas = lv_canvas_create(panel_civic);
    lv_canvas_set_buffer(civic_canvas, cbuf, 146, 68, LV_IMG_CF_TRUE_COLOR);
    lv_obj_align(civic_canvas, LV_ALIGN_CENTER, 0, 8);
    draw_civic_blueprint_canvas();

    // -------------------------------------------------------------
    // BOTTOM RIGHT: TELEMETRY SENSORS (ECT, IAT, MAP, VOLT, AFR)
    // -------------------------------------------------------------
    lv_obj_t *panel_sensors = lv_obj_create(screen_cyber_hud);
    lv_obj_set_size(panel_sensors, 154, 96);
    lv_obj_align(panel_sensors, LV_ALIGN_BOTTOM_RIGHT, -4, -4);
    lv_obj_set_style_bg_color(panel_sensors, COLOR_PANEL, 0);
    lv_obj_set_style_border_color(panel_sensors, COLOR_BORDER, 0);
    lv_obj_set_style_border_width(panel_sensors, 1, 0);
    lv_obj_set_style_radius(panel_sensors, 8, 0);
    lv_obj_set_style_pad_all(panel_sensors, 4, 0);

    // Coolant Temp ECT Bar
    lv_obj_t *lbl_ect_tag = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_ect_tag, "ECT:");
    lv_obj_set_style_text_font(lbl_ect_tag, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_ect_tag, COLOR_MUTED, 0);
    lv_obj_align(lbl_ect_tag, LV_ALIGN_TOP_LEFT, 4, 4);

    lbl_ect_val = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_ect_val, "88°C");
    lv_obj_set_style_text_font(lbl_ect_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_ect_val, COLOR_WHITE, 0);
    lv_obj_align(lbl_ect_val, LV_ALIGN_TOP_RIGHT, -4, 4);

    bar_ect = lv_bar_create(panel_sensors);
    lv_obj_set_size(bar_ect, 142, 6);
    lv_obj_align(bar_ect, LV_ALIGN_TOP_MID, 0, 18);
    lv_bar_set_range(bar_ect, 40, 120);
    lv_bar_set_value(bar_ect, 88, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(bar_ect, COLOR_BORDER, LV_PART_MAIN);
    lv_obj_set_style_bg_color(bar_ect, COLOR_CYAN, LV_PART_INDICATOR);

    // Sensor Grid
    lbl_map_val = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_map_val, "MAP: 32 kPa");
    lv_obj_set_style_text_font(lbl_map_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_map_val, COLOR_MUTED, 0);
    lv_obj_align(lbl_map_val, LV_ALIGN_TOP_LEFT, 4, 32);

    lbl_iat_val = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_iat_val, "IAT: 28°C");
    lv_obj_set_style_text_font(lbl_iat_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_iat_val, COLOR_MUTED, 0);
    lv_obj_align(lbl_iat_val, LV_ALIGN_TOP_RIGHT, -4, 32);

    lbl_volt_val = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_volt_val, "BAT: 14.2 V");
    lv_obj_set_style_text_font(lbl_volt_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_volt_val, COLOR_MUTED, 0);
    lv_obj_align(lbl_volt_val, LV_ALIGN_TOP_LEFT, 4, 52);

    lbl_afr_val = lv_label_create(panel_sensors);
    lv_label_set_text(lbl_afr_val, "AFR: 14.7");
    lv_obj_set_style_text_font(lbl_afr_val, &lv_font_montserrat_10, 0);
    lv_obj_set_style_text_color(lbl_afr_val, COLOR_MUTED, 0);
    lv_obj_align(lbl_afr_val, LV_ALIGN_TOP_RIGHT, -4, 52);
}

// Draw the exact 1999 Civic Sedan Blueprint Silhouette on the LVGL Canvas
static void draw_civic_blueprint_canvas(void) {
    lv_canvas_fill_bg(civic_canvas, COLOR_PANEL, LV_OPA_COVER);
    
    lv_draw_line_dsc_t line_dsc;
    lv_draw_line_dsc_init(&line_dsc);
    line_dsc.color = COLOR_WHITE;
    line_dsc.width = 1;
    line_dsc.opa = LV_OPA_80;

    // Body outline points
    lv_point_t body_pts[] = {
        {6, 52}, {6, 45}, {10, 40}, {14, 38}, {24, 37}, {52, 32},
        {78, 16}, {102, 16}, {122, 30}, {138, 30}, {140, 39},
        {136, 44}, {138, 52}, {122, 52}, {100, 52}, {46, 52}, {22, 52}, {6, 52}
    };
    lv_canvas_draw_line(civic_canvas, body_pts, sizeof(body_pts)/sizeof(body_pts[0]), &line_dsc);

    // Front & Rear Windows
    lv_point_t win_pts[] = { {54, 31}, {76, 18}, {100, 18}, {118, 31}, {54, 31} };
    lv_canvas_draw_line(civic_canvas, win_pts, sizeof(win_pts)/sizeof(win_pts[0]), &line_dsc);

    // Pillar divide
    lv_point_t pillar[] = { {86, 18}, {86, 31} };
    lv_canvas_draw_line(civic_canvas, pillar, 2, &line_dsc);

    // Wheels (Front & Rear)
    lv_draw_arc_dsc_t arc_dsc;
    lv_draw_arc_dsc_init(&arc_dsc);
    arc_dsc.color = COLOR_WHITE;
    arc_dsc.width = 2;
    lv_canvas_draw_arc(civic_canvas, 34, 52, 10, 0, 360, &arc_dsc);
    lv_canvas_draw_arc(civic_canvas, 112, 52, 10, 0, 360, &arc_dsc);
}

// -----------------------------------------------------------------
// FLOATING TOP OVERLAY MENU DRAWER
// -----------------------------------------------------------------
static void create_top_menu(void) {
    top_menu_drawer = lv_obj_create(main_screen);
    lv_obj_set_size(top_menu_drawer, 320, 54);
    lv_obj_align(top_menu_drawer, LV_ALIGN_TOP_MID, 0, -60); // initially hidden above screen
    lv_obj_set_style_bg_color(top_menu_drawer, lv_color_hex(0x050507), 0);
    lv_obj_set_style_border_color(top_menu_drawer, COLOR_HONDA_RED, 0);
    lv_obj_set_style_border_width(top_menu_drawer, 1, 0);
    lv_obj_set_style_pad_all(top_menu_drawer, 4, 0);
    lv_obj_clear_flag(top_menu_drawer, LV_OBJ_FLAG_SCROLLABLE);

    const char *labels[] = {"HUD", "CLASSIC", "0-100", "DTC OBD"};
    for (int i = 0; i < 4; i++) {
        lv_obj_t *btn = lv_btn_create(top_menu_drawer);
        lv_obj_set_size(btn, 72, 38);
        lv_obj_align(btn, LV_ALIGN_LEFT_MID, i * 76 + 4, 0);
        lv_obj_set_style_bg_color(btn, COLOR_PANEL, 0);
        lv_obj_set_style_border_color(btn, COLOR_BORDER, 0);
        lv_obj_set_style_border_width(btn, 1, 0);
        lv_obj_set_style_radius(btn, 6, 0);
        lv_obj_add_event_cb(btn, nav_btn_event_cb, LV_EVENT_CLICKED, (void*)(intptr_t)i);

        lv_obj_t *lbl = lv_label_create(btn);
        lv_label_set_text(lbl, labels[i]);
        lv_obj_set_style_text_font(lbl, &lv_font_montserrat_10, 0);
        lv_obj_set_style_text_color(lbl, COLOR_WHITE, 0);
        lv_obj_center(lbl);
    }
}

void ui_hondash_toggle_menu(void) {
    menu_is_open = !menu_is_open;
    if (menu_is_open) {
        lv_obj_align(top_menu_drawer, LV_ALIGN_TOP_MID, 0, 0);
    } else {
        lv_obj_align(top_menu_drawer, LV_ALIGN_TOP_MID, 0, -60);
    }
}

void ui_hondash_switch_screen(int screenIndex) {
    current_screen_index = screenIndex;
    // Update active screen state
}

void ui_hondash_update_telemetry(const HondashTelemetry_t *data) {
    if (!data) return;

    // RPM Arc & Label
    lv_arc_set_value(arc_rpm, data->rpm);
    char buf[32];
    snprintf(buf, sizeof(buf), "%d", data->rpm);
    lv_label_set_text(lbl_rpm_val, buf);

    // Speedometer
    snprintf(buf, sizeof(buf), "%d", data->speed);
    lv_label_set_text(lbl_speed_val, buf);

    // Shift Light Flash
    if (data->shiftLightActive || data->rpm >= 7200) {
        lv_obj_clear_flag(shift_light_bar, LV_OBJ_FLAG_HIDDEN);
    } else {
        lv_obj_add_flag(shift_light_bar, LV_OBJ_FLAG_HIDDEN);
    }

    // VTEC Indicator
    if (data->vtecActive || data->rpm >= 5200) {
        lv_led_on(led_vtec);
        lv_obj_set_style_text_color(lbl_vtec, COLOR_VTEC_GRN, 0);
    } else {
        lv_led_off(led_vtec);
        lv_obj_set_style_text_color(lbl_vtec, COLOR_MUTED, 0);
    }

    // Coolant ECT
    lv_bar_set_value(bar_ect, data->coolantTemp, LV_ANIM_OFF);
    snprintf(buf, sizeof(buf), "%d°C", data->coolantTemp);
    lv_label_set_text(lbl_ect_val, buf);

    // MAP & IAT & Volt & AFR
    snprintf(buf, sizeof(buf), "MAP: %d kPa", data->manifoldPressure);
    lv_label_set_text(lbl_map_val, buf);

    snprintf(buf, sizeof(buf), "IAT: %d°C", data->intakeAirTemp);
    lv_label_set_text(lbl_iat_val, buf);

    snprintf(buf, sizeof(buf), "BAT: %.1f V", data->batteryVoltage);
    lv_label_set_text(lbl_volt_val, buf);

    snprintf(buf, sizeof(buf), "AFR: %.1f", data->airFuelRatio);
    lv_label_set_text(lbl_afr_val, buf);
}
