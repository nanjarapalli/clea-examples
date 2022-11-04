import QtQuick 2.0
import QtQuick.Controls 2.2

Slider {
    id: root
    value: 0.5

    background: Rectangle {
        width: root.availableWidth
        height: implicitHeight
        x: root.leftPadding
        y: root.topPadding + root.availableHeight / 2 - height / 2
        implicitWidth: 200
        implicitHeight: 4
        radius: 2
        color: "#bdbebf"

        Rectangle {
            width: root.visualPosition * parent.width
            height: parent.height
            color: enabled ? "#21be2b" : "#808080"
            radius: 2
        }
    }

    handle: Rectangle {
        implicitWidth: 26
        implicitHeight: 26
        x: root.leftPadding + root.visualPosition * (root.availableWidth - width)
        y: root.topPadding + root.availableHeight / 2 - height / 2
        radius: 13
        color: root.pressed ? "#f0f0f0" : enabled ? "#f6f6f6" : "#808080"
        border.color: "#bdbebf"
    }
}
