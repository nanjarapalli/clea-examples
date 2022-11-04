import QtQuick 2.4
import QtQuick.Window 2.2
import com.seco.astarte 1.0

Item {
    id: root
    anchors.fill: parent

    property bool isFanRunning: false
    property bool isLightsRedOn: true
    property bool isLightsGreenOn: true
    property bool isDimmingLightsAllowed: true
    property real brightnessValue: 56
    property real fanSpeed: 100
    property bool isAstarteReady:  AstarteSDK.ready

    onIsAstarteReadyChanged: {
        if(isAstarteReady) {
            sendToAstarte('/dashboard/fan/status', isFanRunning)
            sendToAstarte('/dashboard/fan/speed', fanSpeed)
            sendToAstarte('/dashboard/light/red', isLightsRedOn)
            sendToAstarte('/dashboard/light/green', isLightsGreenOn)
            sendToAstarte('/dashboard/light/brightness', brightnessValue)
            sendToAstarte('/dashboard/light/dimming', isDimmingLightsAllowed)
        }
    }

    onIsFanRunningChanged: {
        sendToAstarte('/dashboard/fan/status', isFanRunning)
        console.log('isFanRunning: ', isFanRunning)
    }

    onIsLightsRedOnChanged: {
        sendToAstarte('/dashboard/light/red', isLightsRedOn)
        console.log('isLightsRedOn: ', isLightsRedOn)
    }

    onIsLightsGreenOnChanged: {
        sendToAstarte('/dashboard/light/green', isLightsGreenOn)
        console.log('isLightsGreenOn: ', isLightsGreenOn)
    }

    onIsDimmingLightsAllowedChanged: {
        sendToAstarte('/dashboard/light/dimming', isDimmingLightsAllowed)
        console.log('isDimmingLightsAllowed: ', isDimmingLightsAllowed)
    }

    onBrightnessValueChanged: {
        sendToAstarte('/dashboard/light/brightness', brightnessValue)
        console.log('brightnessValue: ', brightnessValue)
    }

    onFanSpeedChanged: {
        sendToAstarte('/dashboard/fan/speed', fanSpeed)
        console.log('fanSpeed: ', fanSpeed)
    }

    function sendToAstarte(path, value) {
        AstarteSDK.sendData('ai.clea.examples.smart.home.Data', path, value, new Date())
    }

    Connections {
        target: AstarteSDK
        onDataReceived: {
            console.log("XXXXXXXX Data received", path, value)
            switch(path.toString()) {
            case "/dashboard/fan/status":
                root.isFanRunning = Number(value)
                break
            case "/dashboard/fan/speed":
                root.fanSpeed = Number(value)
                break
            case "/dashboard/light/green":
                root.isLightsGreenOn = Number(value)
                break
            case "/dashboard/light/red":
                root.isLightsRedOn = Number(value)
                break
            case "/dashboard/light/brightness":
                root.brightnessValue = Number(value)
                break
            case "/dashboard/light/dimming":
                root.isDimmingLightsAllowed = Number(value)
                break
            }
        }
    }

    Image {
        source: Qt.resolvedUrl("../assets/images/5577112.jpg")
        fillMode: Image.PreserveAspectCrop
        anchors.fill: parent
    }

    Rectangle {
        color: Qt.rgba(0,0,0,0.5)
        anchors.fill: parent
    }

    Header {
        height: 70
        width: parent.width
        anchors.top: parent.top
        cloudconnected: isAstarteReady
    }

    Row {
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 30
        anchors.topMargin: 90
        anchors.bottomMargin: 20
        spacing: 10

        Column {
            height: parent.height
            width: parent.width * 1/3
            spacing: 10

            FanBlock {
                width: parent.width
                height: parent.height * 2/3 - 5
            }

            LightsBlock {
                width: parent.width
                height: parent.height * 1/3 - 5
            }
        }

        BrightnessBlock {
            width: parent.width * 2/3
            height: parent.height
        }
    }
}
