/***************************************************************************/
/*!  \file astartesdk.h
 *   \brief Declaration of \ref AstarteSDk.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#ifndef ASTARTESDK_H
#define ASTARTESDK_H

#include <QObject>
#include <AstarteDeviceSDK.h>

class QQmlEngine;
class QJSEngine;

namespace Hemera {
class Operation;
}

class AstarteSDK : public AstarteDeviceSDK
{
    Q_OBJECT

public:
    AstarteSDK(const QString &configurationPath, const QString &interfacesDir,
            const QByteArray &hardwareId, QObject *parent = nullptr);
    static AstarteSDK *instance();
    static void terminate();

    static QObject *qmlInstance(QQmlEngine *engine, QJSEngine *scriptEngine);
    Q_INVOKABLE QString getInterfaceDir();
    Q_INVOKABLE QString readInterfaceSchema(QString filePath);
    Q_INVOKABLE bool sendData(const QString &interface, const QString &path, const QVariant &value,
                              const QDateTime &timestamp = QDateTime(), const QVariantHash &metadata = QVariantHash()) {
        return AstarteDeviceSDK::sendData(interface.toUtf8(), path.toUtf8(), value, timestamp, metadata);
    };

    Q_INVOKABLE bool sendData(const QString &interface, const QString &path, const QVariant &value,
            const QVariantHash &metadata) {
        return AstarteDeviceSDK::sendData(interface.toUtf8(), path.toUtf8(), value, metadata);
    };

    Q_INVOKABLE bool sendData(const QString &interface, const QVariantHash &value, const QDateTime &timestamp = QDateTime(),
            const QVariantHash &metadata = QVariantHash()) {
        return AstarteDeviceSDK::sendData(interface.toUtf8(), value, timestamp, metadata);
    };

    Q_INVOKABLE bool sendData(const QString &interface, const QVariantHash &value, const QVariantHash &metadata) {
        return AstarteDeviceSDK::sendData(interface.toUtf8(), value, metadata);
    };

    Q_INVOKABLE AstarteDeviceSDK::ConnectionStatus connectionStatus() const {
        return AstarteDeviceSDK::connectionStatus();
    };

private:
    static AstarteSDK *m_instance;
    void checkInitResult(Hemera::Operation *op);
    void handleIncomingData(const QByteArray &interface, const QByteArray &path, const QVariant &value);
};



#endif // ASTARTESDK_H
