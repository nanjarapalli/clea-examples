
from ast import Pass
import bleak
from PyQt5.QtCore import (QThread)
#from PyQt5.QtCore import (Qt, QObject, pyqtSignal, QThread, QTimer)




class BLEThread (QThread) :
    
    def __init__(self, config, parent=None) -> None:
        super().__init__(parent)


    def run(self) -> None:
        Pass


    def stop(self) -> None:
        Pass