# Fleet Management example

# Setup

Create `components` folder and clone there the [`Astarte SDK`](https://github.com/astarte-platform/astarte-device-sdk-esp32.git), the [`accelerometer`](https://github.com/harlem88/lis3dh-esp-idf.git) and [`GPS`](TODO) drivers:

``` bash
mkdir components
cd components
git clone https://github.com/astarte-platform/astarte-device-sdk-esp32.git ./astarte
git clone https://github.com/harlem88/lis3dh-esp-idf.git
mv ./lis3dh-esp-idf/components/lis3dh .
mv ./lis3dh-esp-idf/components/esp8266_wrapper .
rm -rf lis3dh-esp-idf
cd ..
```

Configure the project with WI-FI and Astarte settings.
Launch the project configuration tool with the command
```
idf.py menuconfig
```
Set the WI-FI configuration by editing in `Fleet management demo` menu items:
    + `WIFI SSID`
    + `WIFI Password`
Set the Astarte configuration by editing in `Component config/Astarte SDK` items:
    + `Astarte realm`
    + `Astarte pairing base URL`
    + `Pairing JWT token`
    + `Astarte connectivity test URL`
---

**Note that modem is not used at the moment. Positioning data is an approximation given by the list of neighboring APs APs.**


# Build

Build the project and flash it to the board, then run the monitor tool to view the serial output.
Run following command, where `PORT` is the path to file which identifies the serial connection with the EasyEdge (usually `/dev/ttyUSB0`):
```bash
idf.py -p PORT build flash monitor
```