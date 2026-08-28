#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include "lvgl.h"

// Telemetry Data Structure in C
typedef struct {
    int   rpm;
    int   speed;
    int   coolantTemp;   // ECT in Celsius
    int   intakeAirTemp;  // IAT in Celsius
    int   manifoldPressure; // MAP in kPa
    int   throttlePos;   // TPS in %
    int   vtecActive;    // 0 or 1
    int   checkEngineLight; // 0 or 1
    int   shiftLightActive; // 0 or 1
    float batteryVoltage;
    float airFuelRatio;
    float sprintTime0_100;
} HondashTelemetry_t;

// Public UI API
void ui_hondash_init(void);
void ui_hondash_update_telemetry(const HondashTelemetry_t *data);
void ui_hondash_switch_screen(int screenIndex);
void ui_hondash_toggle_menu(void);

#ifdef __cplusplus
}
#endif
