import QtQuick 2.0
import QtGraphicalEffects 1.0

Rectangle {
    id: root
    color: Qt.rgba(0,0,0,0.5)
    radius: 10

    Column {
        anchors.centerIn: parent
        spacing: 5

        Image {
            id: fanImage
            width: root.width > root.height ? 0.65 * root.height : 0.65 * root.width
            fillMode: Image.PreserveAspectFit
            anchors.horizontalCenter: parent.horizontalCenter
            source: Qt.resolvedUrl("../assets/images/89ed3a8a84d78fd19b29e5f0cd6958a2.svg")
            ColorOverlay {
                anchors.fill: parent
                source: parent
                color: "#29b6f6"
            }
        }

        Item {
            width: root.width * 0.9
            height: 30

            Text {
                anchors.verticalCenter: parent.verticalCenter
                font.bold: true
                font.pixelSize: 18
                text: qsTr("FAN")
                color: "#fff"
            }

            CSwitch {
                anchors.verticalCenter: parent.verticalCenter
                anchors.right: parent.right
                checked: isFanRunning
                onClicked: {
                    isFanRunning=!isFanRunning

                    if(checked) {
                        console.log("Fan switched ON!")
                    } else {
                        console.log("Fan switched OFF!")
                    }
                }
            }
        }

        Item {
            width: root.width * 0.9
            height: 30

            Text {
                id: _speedText
                font.bold: true
                font.pixelSize: 18
                text: qsTr("Speed")
                color: "#fff"
                anchors.verticalCenter: parent.verticalCenter
            }

            HSlider {
                anchors.verticalCenter: parent.verticalCenter
                width: parent.width * 0.6
                anchors.right: parent.right
                anchors.rightMargin: -5
                enabled: isFanRunning
                from: 0
                to: 100
                value: fanSpeed
                live: false
                stepSize: 10
                onValueChanged: fanSpeed = value
            }
        }
    }
    // Rotation Animation for the Fan
    RotationAnimation {
        id: _rotateAnim
        target: fanImage
        from: 0; to: 360
        duration: 6600 - (60 * fanSpeed)
        running: isFanRunning
        loops: RotationAnimation.Infinite
        //        onRunningChanged: if(!running) target.rotation=0
        onDurationChanged: if (isFanRunning) _rotateAnim.restart()
    }
}
