
from ast import Pass
import asyncio
from distutils.command.config import config
from time import time
from bleak import BleakScanner
import asyncio
from PyQt5.QtCore import (QThread)
#from PyQt5.QtCore import (Qt, QObject, pyqtSignal, QThread, QTimer)




class BLECache () :
    def __init__ (self) :
        self.cache = {}


    def add_device (self, device, discovery_time) :
        device_address = device.address
        now = int(time())
        item = None

        # Retrieving the device
        try :
            item = self.cache[device_address]
            print ("Existing device {} updated".format(device_address))
        except KeyError :
            print ("Adding device {} at {}".format(device_address, now))
            self.cache[device_address] = {'address':device_address, 'in_at':now, 'out_at':None}
            item = self.cache[device_address]
        
        # Updating the device
        item['out_at'] = (now+(discovery_time))


    def consume_devices (self) :
        print ("#keys is {}".format(len(self.cache)))
        output = []
        for key in self.cache :
            item = self.cache[key]
            out_item = {
                'address':item['address'],
                'presence_time':(item['out_at']-item['in_at'])*1000
            }
            output.append (out_item)

        self.cache = {}
        return output




class BLEThread (QThread) :
    
    def __init__(self, config, parent=None) -> None:
        super().__init__(parent)
        self.config = config
        self.cache = BLECache()


    async def async_runner (self) :
        discovery_time = int(self.config['BLE']['discovery_time_s'])
        min_rssi = int(self.config['BLE']["min_rssi"])
        send_delay = int(self.config['BLE']['send_delay_s'])
        previous_send = int(time())

        print ("Scanning for devices with rssi > {}".format(min_rssi))
        while True :
            devices = await BleakScanner.discover(discovery_time)
            now = int(time())
            time_diff = now - previous_send

            if time_diff > send_delay :
                # TODO Consuming data cache and sending those values to Astarte
                print ("\n===============================\n=====  Consuming beacons  =====\n===============================")
                devices = self.cache.consume_devices()
                previous_send = now


            for d in devices:
                if (d.rssi > min_rssi):
                    self.cache.add_device(d, discovery_time)
                    # print ("{} ->\n\tname:     {}\n\tdetails:  {}\n\trssi:      {}\n\tmetadata: {}\n--------\n".format(\
                    #         d.address, d.name, d.details, d.rssi, d.metadata))
                else :
                    #print ("Rejecting device {} with rssi={}".format(d.address, d.rssi))
                    pass


    def run(self) -> None:
        asyncio.run(self.async_runner())


    def stop(self) -> None:
        Pass