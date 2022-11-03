import QtQuick 2.0

Rectangle {
    id: root
    color: Qt.rgba(0,0,0,0.5)
    radius: 10

    Column {
        anchors.centerIn: parent
        spacing: 5

        Item {
            width: root.width * 0.9
            height: 40

            Text {
                anchors.verticalCenter: parent.verticalCenter
                font.bold: true
                font.pixelSize: 18
                text: qsTr("LIGHTS RED")
                color: "#fff"
            }

            CSwitch {
                anchors.verticalCenter: parent.verticalCenter
                anchors.right: parent.right
                checked: isLightsRedOn
                onClicked: {
                    isLightsRedOn=!isLightsRedOn

                    if(checked) {
                        console.log("Red Lights ON!")
                    } else {
                        console.log("Red Lights OFF!")
                    }
                }
            }
        }

        Item {
            width: root.width * 0.9
            height: 40

            Text {
                anchors.verticalCenter: parent.verticalCenter
                font.bold: true
                font.pixelSize: 18
                text: qsTr("LIGHTS GREEN")
                color: "#fff"
            }

            CSwitch {
                anchors.verticalCenter: parent.verticalCenter
                anchors.right: parent.right
                checked: isLightsGreenOn
                onClicked: {
                    isLightsGreenOn=!isLightsGreenOn

                    if(checked) {
                        console.log("Green Lights ON!")
                    } else {
                        console.log("Green Lights OFF!")
                    }
                }
            }
        }
    }
}
