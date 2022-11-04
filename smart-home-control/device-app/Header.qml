import QtQuick 2.0

Item {

    property bool cloudconnected: false
    Rectangle {
        color: "#fff"
        height: 1
        width: parent.width
        anchors.bottom: parent.bottom
    }

    Image {
        height: parent.height * 4/5
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: parent.left
        anchors.leftMargin: 20
        source: Qt.resolvedUrl("../assets/images/Clea logo.png")
        fillMode: Image.PreserveAspectFit
    }

    Image {
        anchors.centerIn: parent
        source: cloudconnected ? Qt.resolvedUrl("../assets/images/cloudOnline.png") : Qt.resolvedUrl("../assets/images/cloudOffline.png")
        fillMode: Image.PreserveAspectFit
    }

    Image {
        height: 100
        visible: true
        anchors.verticalCenter: parent.verticalCenter
        anchors.right: parent.right
        anchors.rightMargin: -20
        source: Qt.resolvedUrl("../assets/images/logo-seco-02.png")
        fillMode: Image.PreserveAspectFit
    }
}
