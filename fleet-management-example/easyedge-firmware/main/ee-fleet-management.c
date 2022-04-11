
/**
 * @file ee-fleet-management.c
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief Entry point file for Fleet Management firmware
 * @version 0.1
 * @date 2022-04-08
 * 
 */


#include <esp_log.h>
#include <driver/gpio.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>


#define POTENTIOMETER_GPO_NUM GPIO_NUM_36


void potentiometer_reader (void* arg) {
    const char* TAG = "potentiometer_reader";

    // Setting up analog potentiometer GPIO
    gpio_pad_select_gpio (POTENTIOMETER_GPO_NUM);
    gpio_set_direction (POTENTIOMETER_GPO_NUM, GPIO_MODE_INPUT);

    // Continuously reading potentiometer value
    while (1) {
        int gpio_level  = gpio_get_level (POTENTIOMETER_GPO_NUM);
        ESP_LOGI (TAG, "GPIO value: %d", gpio_level);
        vTaskDelay (pdMS_TO_TICKS(1000));
    }
}


void app_main(void) {
    printf ("\n\n\n");

    const char* TAG = "app_main";
    ESP_LOGI (TAG, "Managing the fleet!");

    // Initializing NVS flash

    // TODO Initializing Wifi connection

    // TODO Initializing Astarte

    // TODO Initializing accelerometer reader

    // TODO Initializing GPS receiver

    // TODO Initializing GPIO to read potentiometer data
    gpio_pad_select_gpio (GPIO_NUM_25);
    gpio_set_direction (GPIO_NUM_25, GPIO_MODE_OUTPUT);
    gpio_set_level (GPIO_NUM_25, 0);
    xTaskCreate (potentiometer_reader, "potentiometer_reeader", 4096, NULL, 10, NULL);
}
