
/**
 * @file ee-fleet-management.c
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief Entry point file for Fleet Management firmware
 * @version 0.1
 * @date 2022-04-08
 * 
 */


#include <stdio.h>
#include <esp_log.h>


void app_main(void) {
    printf ("\n\n\n");
    const char* TAG = "app_main";
    ESP_LOGI (TAG, "Managing the fleet!");
}
