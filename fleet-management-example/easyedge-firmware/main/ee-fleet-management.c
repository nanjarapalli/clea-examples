
/**
 * @file ee-fleet-management.c
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief Entry point file for Fleet Management firmware
 * @version 0.1
 * @date 2022-04-08
 * 
 */


#define LOG_LOCAL_LEVEL ESP_LOG_VERBOSE

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/event_groups.h>

#include <driver/adc.h>
#include <driver/gpio.h>
#include <driver/i2c.h>
#include <esp_log.h>
#include <esp_adc_cal.h>
#include <nvs.h>
#include <nvs_flash.h>
#include <esp_event_base.h>
#include <esp_wifi.h>
#include <lis3dh.h>

#include <astarte_handler.h>

#include <string.h>


#define TASK_STACK_DEPTH 4096

// Storage
#define STORAGE_NAMESPACE   "nvs"

// Potentiometer data among 0 and 1024
#define POTENTIOMETER_GPO_NUM   GPIO_NUM_36
#define POTENTIOMETER_ADC_CH    ADC1_CHANNEL_0
#define POTENTIOMETER_ADC_ATT   ADC_ATTEN_DB_11
#define POTENTIOMETER_ADC_BIT_W ADC_WIDTH_BIT_10
#define POTENTIOMETER_TASK_P    2

// Wifi
uint32_t wifi_retry_count           = 0;
#define WIFI_CONNECTED_BIT  BIT0
#define WIFI_FAILED_BIT     BIT1

ESP_EVENT_DEFINE_BASE(ASTARTE_HANDLER_EVENTS);

// Accelerometer
#define I2C_BUS 0
#define I2C_SCL_PIN 19
#define I2C_SDA_PIN 18
#define I2C_FREQ I2C_FREQ_400K
#define ACCELEROMETER_TASK_P    10



static void event_handler (void* handler_arg, esp_event_base_t event_base, int32_t event_id, void* event_data) {
    const char* TAG = "event_handler";
    ESP_LOGD (TAG, "Catched event  '%s'  with id  %d", event_base, event_id);
    

    // ================================     WIFI events     ================================
    if (event_base == WIFI_EVENT) {
        if (event_id == WIFI_EVENT_STA_START) {
            esp_wifi_connect();
        }
        else if (event_id == WIFI_EVENT_STA_DISCONNECTED) {
            if (wifi_retry_count < CONFIG_WIFI_MAXIMUM_RETRY) {
                ++wifi_retry_count;
                ESP_LOGW (TAG, "Retrying to connect to the AP (#%d)", wifi_retry_count);
                esp_wifi_connect();
            } else {
                xEventGroupSetBits((EventGroupHandle_t) handler_arg, WIFI_FAILED_BIT);
                ESP_LOGE (TAG,"connect to the AP fail");
            }
        }
    }
    // ================================     IP events     ================================
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event    = (ip_event_got_ip_t*) event_data;
        wifi_retry_count            = 0;
        ESP_LOGD (TAG, "Got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        xEventGroupSetBits ((EventGroupHandle_t) handler_arg, WIFI_CONNECTED_BIT);
    }
    // ================================     ASTARTE HANDLER events     ================================
    else if (event_base == ASTARTE_HANDLER_EVENTS) {
        if (event_id == ASTARTE_HANDLER_EVENT_CONNECT) {
            xEventGroupSetBits((EventGroupHandle_t) handler_arg, ASTARTE_HANDLER_INITIALIZED_BIT);
        }
        else if (event_id == ASTARTE_HANDLER_EVENT_DISCONNECT) {
            xEventGroupSetBits((EventGroupHandle_t) handler_arg, ASTARTE_HANDLER_FAILED_BIT);
        }
    }
    else {
        ESP_LOGE (TAG, "Unknown triggered event.\n\tEvent base:  %s\n\tEvent id:    %d", event_base, event_id);
    }
}




/*  =============================
            Init fuctions
    =============================  */

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
        ESP_LOGV (TAG, "GPIO value: %d", raw_adc_value);

        vTaskDelay (pdMS_TO_TICKS(1000));
    }
}




void accelerometer_reader (void* arg) {
    const char* TAG         = "accelerometer_reader";
    lis3dh_sensor_t* sensor = (lis3dh_sensor_t*) arg;
    lis3dh_float_data_t data;

    while (1) {
        memset (&data, '\0', sizeof(data));
     
        if (lis3dh_new_data(sensor) && lis3dh_get_float_data(sensor, &data)) {
            ESP_LOGV (TAG, "LIS3DH (xyz)[g] ax=%+7.3f ay=%+7.3f az=%+7.3f", data.ax, data.ay, data.az);
        }
        
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}




/*  =============================
            Init fuctions
    =============================  */
    
esp_err_t init_nvs () {
    const char* TAG = "init_nvs";
    esp_err_t res   = nvs_flash_init ();
    if (res == ESP_ERR_NVS_NO_FREE_PAGES || res == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_LOGI (TAG, "Erasing flash..");
        ESP_ERROR_CHECK (nvs_flash_erase());
        res = nvs_flash_init ();
    }
    return res;
}

// ##################################################

esp_err_t init_wifi_connection () {
    const char* TAG                     = "init_wifi_connection";
    esp_err_t res                       = ESP_OK;
    EventGroupHandle_t wifi_event_group = xEventGroupCreate();

    xEventGroupClearBits (wifi_event_group, WIFI_CONNECTED_BIT | WIFI_FAILED_BIT);

    ESP_ERROR_CHECK (esp_netif_init());
    ESP_ERROR_CHECK (esp_event_loop_create_default());

    esp_netif_create_default_wifi_sta ();

    wifi_init_config_t cfg  = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK (esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK (esp_event_handler_instance_register (
        WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, (void*) wifi_event_group, &instance_any_id));

    ESP_ERROR_CHECK (esp_event_handler_instance_register (
        IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, (void*) wifi_event_group, &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid               = CONFIG_WIFI_SSID,
            .password           = CONFIG_WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
            .pmf_cfg    = {
                .capable    = true,
                .required   = false
            },
        },
    };

    ESP_ERROR_CHECK (esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK (esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK (esp_wifi_start());

    
    /* Waiting until either the connection is established (WIFI_CONNECTED_BIT) or connection failed
     * for the maximum number of re-tries (WIFI_FAIL_BIT) */
    EventBits_t bits    = xEventGroupWaitBits (wifi_event_group, WIFI_CONNECTED_BIT | WIFI_FAILED_BIT,
                                                pdFALSE, pdFALSE, portMAX_DELAY);

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGD (TAG, "connected to ap SSID:%s", CONFIG_WIFI_SSID);
    } else if (bits & WIFI_FAILED_BIT) {
        ESP_LOGE (TAG, "Failed to connect to SSID:%s", CONFIG_WIFI_SSID);
    } else {
        ESP_LOGE (TAG, "UNEXPECTED EVENT");
        res = ESP_FAIL;
    }

    ESP_ERROR_CHECK(
        esp_event_handler_instance_unregister(IP_EVENT, IP_EVENT_STA_GOT_IP, instance_got_ip));
    ESP_ERROR_CHECK(
        esp_event_handler_instance_unregister(WIFI_EVENT, ESP_EVENT_ANY_ID, instance_any_id));
    
    vEventGroupDelete(wifi_event_group);

    return res;
}

// ##################################################

esp_err_t init_astarte (astarte_handler_t** target) {
    const char* TAG                         = "init_astarte";
    esp_err_t result                        = ESP_OK;
    *target                                 = astarte_handler_create ();
    if (!(*target)) {
        ESP_LOGE (TAG, "Cannot create Astarte handler");
        *target  = NULL;
        return ESP_FAIL;
    }

    // Setting astarte_event_group to 0
    EventGroupHandle_t astarte_event_group  = xEventGroupCreate ();
    xEventGroupClearBits (astarte_event_group, ASTARTE_HANDLER_INITIALIZED_BIT | ASTARTE_HANDLER_FAILED_BIT);

    // Registering handler for ASTARTE events
    esp_event_handler_instance_t instance_any_id;
    ESP_ERROR_CHECK (esp_event_handler_instance_register (
        ASTARTE_HANDLER_EVENTS, ESP_EVENT_ANY_ID, &event_handler, (void*) astarte_event_group, &instance_any_id));

    while (!(*target)->start(*target)) {
        ESP_LOGI (TAG, "Retrying astarte connection");
        vTaskDelay (pdMS_TO_TICKS(500));
        // TODO Add an upper limit
    }

    // Waiting for handler creation
    ESP_LOGD (TAG, "Waiting for handler creation..");
    EventBits_t bits    = xEventGroupWaitBits (astarte_event_group, ASTARTE_HANDLER_INITIALIZED_BIT | ASTARTE_HANDLER_FAILED_BIT,
                                                pdFALSE, pdFALSE, portMAX_DELAY);
    if (bits & ASTARTE_HANDLER_FAILED_BIT) {
        ESP_LOGE (TAG, "Cannot initialize astarte handler!");
        astarte_handler_destroy (*target);
        *target = NULL;
        result  = ESP_FAIL;
    }
    else {
        ESP_LOGD (TAG, "Succesfully connected to astarte");
    }
    
    // Cleaning up 
    vEventGroupDelete (astarte_event_group);
    ESP_ERROR_CHECK(
        esp_event_handler_instance_unregister(ASTARTE_HANDLER_EVENTS, ESP_EVENT_ANY_ID, instance_any_id));

    return result;
}

// ##################################################

esp_err_t init_accelerometer_reader (lis3dh_sensor_t** sensor) {
    const char* TAG         = "init_accelerometer_reader";
    esp_err_t res           = ESP_OK;
    *sensor                 = NULL;
    
    i2c_init (I2C_BUS, I2C_SCL_PIN, I2C_SDA_PIN, I2C_FREQ);
    *sensor = lis3dh_init_sensor(I2C_BUS, LIS3DH_I2C_ADDRESS_2, 0);

    if (sensor) {
        lis3dh_set_scale (*sensor, lis3dh_scale_2_g);
        lis3dh_set_mode (*sensor, lis3dh_odr_10, lis3dh_high_res, true, true, true);

        xTaskCreate (accelerometer_reader, "accelerometer_reader", TASK_STACK_DEPTH, *sensor,
                        ACCELEROMETER_TASK_P, NULL);
    } else {
        res = ESP_FAIL;
        ESP_LOGE (TAG, "Cannot initialize LIS3DH sensor!");
    }

    return res;
}

// ##################################################

esp_err_t init_potentiometer_reader () {
    esp_err_t res           = ESP_OK;

    gpio_pad_select_gpio (GPIO_NUM_25);
    gpio_set_direction (GPIO_NUM_25, GPIO_MODE_OUTPUT);
    gpio_set_level (GPIO_NUM_25, 0);
    xTaskCreate (potentiometer_reader, "potentiometer_reeader", TASK_STACK_DEPTH, NULL,
                    POTENTIOMETER_TASK_P, NULL);

    return res;
}

// ##################################################

esp_err_t init_positioning_provider () {
    const char* TAG = "init_positioning_provider";
    esp_err_t res   = ESP_OK;
    // TODO
    return res;
}


// ################################################## //
// ################################################## //


void app_main(void) {
    astarte_handler_t* astarte_handler  = NULL;
    lis3dh_sensor_t* lis3dh_sensor      = NULL;
    const char* TAG                     = "app_main";

    printf ("\
\n\n\n\
==================================================\n\
                Managing the fleet\n\
==================================================\n\n\n");

    ESP_LOGI (TAG, "Managing the fleet!\n");

    // Initializing NVS flash
    ESP_ERROR_CHECK (init_nvs());
    ESP_LOGI (TAG, "Initialized NVS flash");

    // Initializing Wifi connection
    ESP_ERROR_CHECK (init_wifi_connection());
    ESP_LOGI (TAG, "Initialized wifi connection");

    // Initializing Astarte
    ESP_ERROR_CHECK (init_astarte(&astarte_handler));
    ESP_LOGI (TAG, "Initialized astarte connection");

    // Initializing accelerometer reader
    ESP_ERROR_CHECK (init_accelerometer_reader(&lis3dh_sensor));
    ESP_LOGI (TAG, "Initialized lis3dh sensor");

    // Initializing positioning provider
    ESP_ERROR_CHECK (init_positioning_provider());
    ESP_LOGI (TAG, "Initialized positioning provider");

    // Initializing GPIO to read potentiometer data
    ESP_ERROR_CHECK (init_potentiometer_reader());
    ESP_LOGI (TAG, "Initialized potentiometer reader");
}
