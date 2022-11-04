/***************************************************************************/
/*!  \file config.cpp
 *   \brief Definition of Configuration class.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#include "config.h"

#include <QCoreApplication>
#include <QSettings>
#include <QProcess>
#include <QDebug>
#include <QUuid>
#include <QFileInfo>
#include <syslog.h>

/* Null, because instance will be initialized on demand. */
Config *Config::m_instance = nullptr;

const bool develop = true;

const QString defaultInterfacesDir = QStringLiteral("/opt/CleaHomeDemo/interfaces");
const QString defaultUuidNameSpace = QStringLiteral("6ba7b811-9dad-11d1-80b4-00c04fd430c8");


/**
 * @brief Private constructor of the singleton class
 * @param parent : pointer to the parent object
 */
Config::Config(QObject *parent)
    : QObject(parent)
{
    writeDefaultUserSettings();
}

/**
 * @brief Getter method for fetching the singlton instance og the Config class
 * @return Config* : pointer to the Config class
 */
Config *Config::instance()
{
    if (m_instance == nullptr) {
        m_instance = new Config();
    }
    return m_instance;
}

/**
 * @brief  Destroys the config instance if it already exists.
 */
void Config::terminate()
{
    if (m_instance) {
        delete m_instance;
        m_instance = nullptr;
    }
}

/**
 * @brief Write the default user configuration to a ini file
 */
void Config::writeDefaultUserSettings()
{
    QSettings settings;
    if (QFileInfo::exists(settings.fileName())) {
        qInfo() << "Configuration file found: " << settings.fileName();
        syslog(LOG_INFO, "Configuration file found: %s", settings.fileName().toStdString().c_str());
    } else {
        qInfo() << "Configuration file not found, creating default configutation under location: "
                << settings.fileName();
        syslog(LOG_INFO,
               "Configuration file not found, creating default configutation under location: %s",
               settings.fileName().toStdString().c_str());

        settings.beginGroup("Common");
        settings.setValue("interfacesDir", defaultInterfacesDir);
        QString serial = readSerial();
        settings.setValue("serial", readSerial());
        QUuid deviceUuidV5 = QUuid::createUuidV5(defaultUuidNameSpace, serial);
        QString deviceId = deviceUuidV5.toRfc4122().toBase64(QByteArray::Base64UrlEncoding | QByteArray::OmitTrailingEquals);
        settings.setValue("deviceId", deviceId.toLatin1());
        settings.endGroup();
    }
}

/**
 * @brief Reads the user configuration from a ini file
 */
void Config::readUserSettings()
{
    QSettings settings;
    if (develop) {
        qInfo() << "**********************";
        qInfo() << "** Development mode **";
        qInfo() << "**********************";
    }

    // Common
    settings.beginGroup("Common");
    m_interfacesDir = settings.value("interfacesDir", defaultInterfacesDir).toString();
    m_deviceId = settings.value("deviceId").toByteArray();
    settings.endGroup();
}


/**
 * @brief Helper to get the certificate directory path
 * @return QString : Directory path for the certificates
 */
QString Config::interfacesDirectory() const
{
    return m_interfacesDir;
}

/**
 * @brief Helper to get the Device Id
 * @return m_deviceId : Device Id in bytearray format
 */
QByteArray Config::getDeviceId() const
{
    return m_deviceId;
}

/**
 * @brief Helper method to read the sserial number of the device
 * @return QString : Serial numner of the device
 */
QString Config::readSerial()
{
    QString serialNumber;

    // Get device serial from 'sconfig'
    QProcess process;
    process.start("sconfig", { "serial" });
    process.waitForFinished();

    QString output = process.readAllStandardOutput();
    if (!output.isEmpty()) {
        output.remove(output.indexOf("\n"), output.size());
        serialNumber = output;
    }

    if (serialNumber.isEmpty()) {
        QFile file("/proc/cpuinfo");
        if (file.open(QIODevice::ReadOnly | QIODevice::Text)) {
            QByteArray bytes = file.readAll();
            file.close();

            QTextStream in(&bytes);
            QString line;

            while (!in.atEnd()) {
                line = in.readLine();
                if (line.contains("Serial")) {
                    line.remove(0, sizeof("Serial\t: "));
                    if (line.contains(QRegExp("[^0]"))) {
                        serialNumber = line;
                        break;
                    }
                }
            }
        }
    }
    if (serialNumber.isEmpty()) {
        QProcess process;
        process.start("uname", { "-n" });
        process.waitForFinished();
        QString output = process.readAllStandardOutput();
        process.close();
        if (!output.isEmpty()) {
            output.remove(output.indexOf("\n"), output.size());
            if (output.contains("GFMM")) {
                output.remove("GFMM");
                serialNumber = output;
            }
        }
    }
    return serialNumber.isEmpty() ? QUuid::createUuid().toString() : serialNumber;
}
