QT += quick

CONFIG += c++11

# You can make your code fail to compile if it uses deprecated APIs.
# In order to do so, uncomment the following line.
#DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0

SOURCES += \
        application.cpp \
        astartesdk.cpp \
        config.cpp \
        main.cpp

RESOURCES += qml.qrc

# Additional import path used to resolve QML modules in Qt Creator's code model
QML_IMPORT_PATH =

# Additional import path used to resolve QML modules just for Qt Quick Designer
QML_DESIGNER_IMPORT_PATH =

# Default rules for deployment.
qnx: target.path = /tmp/$${TARGET}/bin
else: unix:!android: target.path = /opt/$${TARGET}/bin
!isEmpty(target.path): INSTALLS += target

HEADERS += \
    application.h \
    astartesdk.h \
    config.h

PLATFORM_MAKESPEC = $$QMAKESPEC
PLATFORM_MAKESPEC ~= s,.*/,,g

# For standard GuF SDKs
equals(PLATFORM_MAKESPEC, linux-oe-g++) {
    TARGET_PLATFORM=$$(OECORE_DISTRO_VERSION)
    isEmpty(TARGET_PLATFORM){
        error(An error has occurred in the configuration process. Please source the environment)
    }
}

# For linux desktop
equals(PLATFORM_MAKESPEC, linux-g++) {
    TARGET_PLATFORM=$$PLATFORM_MAKESPEC
}

message("Building for" $$TARGET_PLATFORM "mkspec:" $$QMAKESPEC "oe-distro:" $$(OECORE_DISTRO_VERSION))

# EdheHog Dependencies
INCLUDEPATH += $$(SDKTARGETSYSROOT)/usr/include/AstarteDeviceSDKQt5
LIBS += -lAstarteDeviceSDKQt5
