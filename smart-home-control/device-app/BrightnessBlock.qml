import QtQuick 2.0

Rectangle {
    id: root
    color: Qt.rgba(0,0,0,0.5)
    radius: 10

    CSwitch {
        anchors.top: parent.top
        anchors.topMargin: 10
        anchors.rightMargin: 10
        anchors.right: parent.right
        checked: isDimmingLightsAllowed
        onClicked: {
            isDimmingLightsAllowed=!isDimmingLightsAllowed

            if(checked) {
                console.log("Dimming Lights Allowed!")
            } else {
                console.log("Dimming Lights Disallowed!")
            }
        }
    }

    Column {
        anchors.centerIn: parent
        spacing: 10
        enabled: isDimmingLightsAllowed

        CircularProgressBar {
            id: progress1
            anchors.horizontalCenter: parent.horizontalCenter
            lineWidth: 15
            size: root.width * 0.5
            value: brightnessValue/100
            secondaryColor: Qt.rgba(0,0,0,0.4) // "#e0e0e0"
            primaryColor: enabled ? "#29b6f6" : "#808080"

            Column {
                anchors.centerIn: parent
                spacing: 5

                Text {
                    text: parseInt(progress1.value * 100) + "%"
                    font.pointSize: 0.15 * progress1.size
                    color: progress1.primaryColor
                }
                Text {
                    text: qsTr("Brightness")
                    anchors.horizontalCenter: parent.horizontalCenter
                    font.pixelSize: 18
                    color: progress1.primaryColor
                }
            }
        }

        HSlider {
            anchors.horizontalCenter: parent.horizontalCenter
            from: 0
            to: 100
            stepSize: 1
            value: brightnessValue
            onValueChanged: if(isDimmingLightsAllowed) brightnessValue=value
        }

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            font.pixelSize: 14
            color: "grey"
            text: qsTr("Move the slider to adjust the bulb brightness")
        }
    }
}
