
/**
 * @file ee-fleet-management.c
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief Entry point file for Fleet Management firmware
 * @version 0.1
 * @date 2022-04-08
 * 
 */


#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include <driver/adc.h>
#include <driver/gpio.h>
#include <esp_log.h>
#include <esp_adc_cal.h>


// Accelerometer data among 0 and 1024
#define POTENTIOMETER_GPO_NUM   GPIO_NUM_36
#define POTENTIOMETER_ADC_CH    ADC1_CHANNEL_0
#define POTENTIOMETER_ADC_ATT   ADC_ATTEN_DB_11
#define POTENTIOMETER_ADC_BIT_W ADC_WIDTH_BIT_10


void potentiometer_reader (void* arg) {
    const char* TAG = "potentiometer_reader";

    // Setting up analog potentiometer GPIO
    esp_adc_cal_characteristics_t adc1_chars;
    esp_adc_cal_characterize(ADC_UNIT_1, POTENTIOMETER_ADC_ATT, POTENTIOMETER_ADC_BIT_W, 0, &adc1_chars);
    ESP_ERROR_CHECK (adc1_config_width(POTENTIOMETER_ADC_BIT_W));
    ESP_ERROR_CHECK (adc1_config_channel_atten(POTENTIOMETER_ADC_CH, POTENTIOMETER_ADC_ATT));

    // Continuously reading potentiometer value
    while (1) {
        int raw_adc_value   = adc1_get_raw (POTENTIOMETER_ADC_CH);
        // TODO Post new event if 
        ESP_LOGI (TAG, "GPIO value: %d", raw_adc_value);

        vTaskDelay (pdMS_TO_TICKS(1000));
    }
}


esp_err_t init_wifi () {
    // TODO
}


esp_err_t init_astarte () {
    // TODO
}


esp_err_t init_accelerometer_reader () {
    // TODO
}


esp_err_t init_positioning_provider () {
    // TODO

}


void app_main(void) {
    printf ("\n\n\n");

    const char* TAG = "app_main";
    ESP_LOGI (TAG, "Managing the fleet!");

    // Initializing NVS flash
    esp_err_t ret   = nvs_flash_init ();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK (nvs_flash_erase());
        ret = nvs_flash_init ();
    }
    ESP_ERROR_CHECK (ret);
    ESP_LOGI (TAG, "Initialized NVS flash")

    // TODO Initializing Wifi connection

    // TODO Initializing Astarte

    // TODO Initializing accelerometer reader

    // TODO Initializing positioning provider

    // Initializing GPIO to read potentiometer data
    gpio_pad_select_gpio (GPIO_NUM_25);
    gpio_set_direction (GPIO_NUM_25, GPIO_MODE_OUTPUT);
    gpio_set_level (GPIO_NUM_25, 0);
    xTaskCreate (potentiometer_reader, "potentiometer_reeader", 2048, NULL, 10, NULL);
}
