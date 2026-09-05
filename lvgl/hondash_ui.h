/**
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

#endif /* HONDASH_UI_H */
