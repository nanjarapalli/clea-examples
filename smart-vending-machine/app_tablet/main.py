import configparser
from sre_constants import FAILURE
import sys

from PyQt5.QtWidgets import QApplication, QStyleFactory, QStackedWidget, QDesktopWidget
from PyQt5.QtGui import QGuiApplication
from MainWindow import MainWindow
from configparser import ConfigParser

from utils.suggestion_strategy import init_suggestions
from astarte.as_conn import set_device, Astarte


def main():

    if len(sys.argv) != 2 :
        print ("[ERROR] Wrong argument number!\nUsage: \t python main.py <config file path>")
        exit (FAILURE)

    config  = ConfigParser ()
    config.read_file (open(sys.argv[1]))

    init_suggestions()
    astarte = Astarte()
    astarte.device = set_device(config=config)
    if not astarte.device:
        return

    app = QApplication(sys.argv)
    app.setStyle(QStyleFactory.create('Cleanlooks'))
    with open('style/Aqua.qss', 'r') as f:
        qss = f.read().replace('\n', '')
    app.setStyleSheet(qss)

    screen = QGuiApplication.primaryScreen()
    screen_geometry = screen.geometry()
    height = screen_geometry.height()
    width = screen_geometry.width()

    print(width, height)
    stacked_window = QStackedWidget()
    window = MainWindow(config, width, height, stacked_window)  # The view controller / view (GUI)
    stacked_window.addWidget(window)
    stacked_window.setCurrentIndex(0)

    stacked_window.showFullScreen()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()