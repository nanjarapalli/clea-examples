/***************************************************************************/
/*!  \file astartesdk.cpp
 *   \brief Definition of AstarteSDk class.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#include "astartesdk.h"
#include <QtCore/QDir>
#include <QDebug>
#include <HemeraCore/Operation>
#include <AstarteDeviceSDK.h>
#include "config.h"
#include <QByteArray>
#include <QQmlEngine>

/* Null, because instance will be initialized on demand. */
AstarteSDK *AstarteSDK::m_instance = nullptr;
QObject *AstarteSDK::qmlInstance(QQmlEngine *engine, QJSEngine *scriptEngine) {
    Q_UNUSED(engine);
    Q_UNUSED(scriptEngine);
    // C++ and QML instance they are the same instance
    return AstarteSDK::instance();
}

/**
 * @brief Private constructor of the singleton class
 * @param parent : pointer to the parent object
 */
AstarteSDK::AstarteSDK(const QString &configurationPath, const QString &interfacesDir,
                 const QByteArray &hardwareId, QObject *parent)
    : AstarteDeviceSDK(configurationPath, interfacesDir, hardwareId, parent)
{
}

/**
 * @brief Getter method for fetching the singlton instance of the astarteSDk class
 * @return AstarteSDk* : pointer to the astarteSDk class
 */
AstarteSDK *AstarteSDK::instance()
{
    if (m_instance == nullptr) {

        QByteArray device = Config::instance()->getDeviceId();
        qDebug() << "initializeAstarte: " << device << Config::instance()->interfacesDirectory();
        const QString interfaceDir = Config::instance()->interfacesDirectory();
        const QString astarteConfig = interfaceDir + QStringLiteral("/transport-astarte.conf");
        m_instance = new AstarteSDK(astarteConfig, interfaceDir, device);
        connect(m_instance->init(), &Hemera::Operation::finished, m_instance, &AstarteSDK::checkInitResult);
        connect(m_instance, &AstarteDeviceSDK::dataReceived, m_instance, &AstarteSDK::handleIncomingData);
    }
    return m_instance;
}

/**
 * @brief  Destroys the AstarteSDk instance if it already exists.
 */
void AstarteSDK::terminate()
{
    if (m_instance) {
        delete m_instance;
        m_instance = nullptr;
    }
}

void AstarteSDK::checkInitResult(Hemera::Operation *op)
{
    if (op->isError()) {
        qWarning() << "Clea Demo App init error: " << op->errorName() << op->errorMessage();

    }
}

void AstarteSDK::handleIncomingData(const QByteArray &interface, const QByteArray &path, const QVariant &value)
{
    qDebug() << "Received data, interface: " << interface << "path: " << path << ", value: " << value << ", Qt type name: " << value.typeName();
}

QString AstarteSDK::getInterfaceDir() {
    return Config::instance()->interfacesDirectory();
}

QString AstarteSDK::readInterfaceSchema(QString filePath)
{
    QFile file(filePath);
    QString fileContent;
    if ( file.open(QIODevice::ReadOnly) ) {
        QString line;
        QTextStream t( &file );
        do {
            line = t.readLine();
            fileContent += line;
         } while (!line.isNull());

        file.close();
    } else {
        qDebug() << "Unable to open the file" << filePath;
        return QString();
    }
    return fileContent;
}
