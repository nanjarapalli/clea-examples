from astarte.device import Device
import json
import os
import glob
import time


class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class Astarte(metaclass=Singleton):
    pass


def load_interfaces(interfaces_dir):
    interfaces = []
    for interface_file in glob.iglob("{}/*.json".format(interfaces_dir), recursive=True):
        with open(interface_file) as json_file:
            interfaces.append(json.load(json_file))
    return interfaces


def callback(device, iname, ipath, payload):
    """ Method called when Astarte sends data to the device """
    print(device, iname, ipath, payload)
    return True


def connect_callback(sel):
    """ Method called when Astarte connects successfully to the device. """
    print("Device has been connected!")

###########################
# Setup Device connection #
###########################


def set_device(config):

    astarte_config = config["ASTARTE"]
    os.makedirs(astarte_config["persistency_dir"], exist_ok=True)
    device = Device(device_id=astarte_config["device_id"], realm=astarte_config["realm"],
                    credentials_secret=astarte_config["credentials_secret"], pairing_base_url=astarte_config["pairing_base_url"],
                    persistency_dir=astarte_config["persistency_dir"])

    interfaces = load_interfaces(astarte_config["interfaces_dir_path"])
    for interface in interfaces:
        #print ("Adding interface {}".format(interface))
        device.add_interface(interface)

    # device.on_connected = connect_callback
    device.on_data_received = callback

    device.connect()
    print("Wating connection with astarte: ")
    retry = 0
    while not device.is_connected() and retry<4:
        time.sleep(1)
        print(f"Device connection: {device.is_connected()}")
        retry += 1
    if not device.is_connected() and retry==4:
        device = False
    return device


def send_data(device, data):
    device.send_aggregate("ai.clea.examples.face.emotion.detection.Transaction", "/transaction", payload=data, timestamp=time.time())


def send_ble_data (device, data) :
    #print ("Sending those data with {}: {}\n\n\n".format(device, data))
    device.send_aggregate ('ai.clea.examples.BLEDevices', '/', payload=data)