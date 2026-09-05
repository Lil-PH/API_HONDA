/**
 * @file lv_conf.h
 * @brief Configuration file for LVGL v8.x on ESP32 / HonDASH
 */

#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

/* Color depth: 1 (1 byte per pixel), 8 (RGB332), 16 (RGB565), 32 (ARGB8888) */
#define LV_COLOR_DEPTH 16

/* Swap the 2 bytes of RGB565 color (Required for SPI displays like ST7789/ILI9341) */
#define LV_COLOR_16_SWAP 0

/* Memory manager */
#define LV_MEM_CUSTOM 0
#define LV_MEM_SIZE (48U * 1024U) /* 48KB RAM pool for LVGL */

/* HAL Settings */
#define LV_DISP_DEF_REFR_PERIOD 30 /* [ms] */
#define LV_INDEV_DEF_READ_PERIOD 30 /* [ms] */

/* Feature Usage */
#define LV_USE_ANIMATION 1
#define LV_USE_SHADOW 1
#define LV_USE_BLEND_MODES 1
#define LV_USE_OPA_SCALE 1

/* Standard Widgets */
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

/* Fonts Enabled */
#define LV_FONT_MONTSERRAT_10 1
#define LV_FONT_MONTSERRAT_12 1
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_20 1
#define LV_FONT_MONTSERRAT_22 1
#define LV_FONT_MONTSERRAT_28 1
#define LV_FONT_DEFAULT &lv_font_montserrat_12

/* Log settings */
#define LV_USE_LOG 1
#define LV_LOG_LEVEL LV_LOG_LEVEL_WARN

#endif /* LV_CONF_H */
