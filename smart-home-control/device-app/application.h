/***************************************************************************/
/*!  \file application.h
 *   \brief Declaration of Application class.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#ifndef APPLICATION_H
#define APPLICATION_H

#include <QGuiApplication>

//class DeviceInfo;

class Application : public QGuiApplication
{
public:
    Application(int &argc, char **argv);
    ~Application();

public:
    void sendValues();

private:
    void initialize();

private:
    void ignoreUnixSignals(QList<int> ignoreSignals);
    void catchUnixSignals(QList<int> quitSignals);

//private:
//    DeviceInfo *m_deviceInfo;
};

#endif // APPLICATION_H
