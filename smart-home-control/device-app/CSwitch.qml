import QtQuick 2.0
import QtQuick.Controls 2.2

Switch {
    id: control
    implicitWidth: indicator.implicitWidth
    indicator: Rectangle {
        id: switchHandle
        implicitWidth: 48
        implicitHeight: 26
        anchors.verticalCenter: parent.verticalCenter
        radius: 13
        color: "#ffffff"
        border.color: "#dddddd"

        Rectangle {
            id: rectangle

            width: 26
            height: 26
            radius: 13
            color: "#ffffff"
            border.color: "#b2b1b1"
        }

        states: [
            State {
                name: "off"
                when: !control.checked && !control.down
            },
            State {
                name: "on"
                when: control.checked && !control.down

                PropertyChanges {
                    target: switchHandle
                    color: "#17a81a"
                    border.color: "#17a81a"
                }

                PropertyChanges {
                    target: rectangle
                    x: parent.width - width

                }
            },
            State {
                name: "off_down"
                when: !control.checked && control.down

                PropertyChanges {
                    target: rectangle
                    color: "#ffffff"
                }

            },
            State {
                name: "on_down"
                extend: "off_down"
                when: control.checked && control.down

                PropertyChanges {
                    target: rectangle
                    x: parent.width - width
                    color: "#ffffff"
                }

                PropertyChanges {
                    target: switchHandle
                    color: Qt.darker("#17a81a", 1.5)
                    border.color: Qt.darker("#17a81a", 1.5)
                }
            }
        ]
    }
}
