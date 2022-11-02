/***************************************************************************/
/*!  \file config.h
 *   \brief Definition of Configuration class.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#ifndef CONFIG_H
#define CONFIG_H

#include <QObject>

class Config : public QObject
{
    Q_OBJECT
private:
    Config(QObject *parent = nullptr);
    static Config *m_instance;
    void writeDefaultUserSettings();

public:
    static Config *instance();
    static void terminate();
    void readUserSettings();

    // General
    QString interfacesDirectory() const;
    QByteArray getDeviceId() const;

private:
    QString m_interfacesDir;
    QByteArray m_deviceId;

    QString readSerial();
};

#endif // CONFIG_H
