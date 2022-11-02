/***************************************************************************/
/*!  \file application.cpp
 *   \brief Defintion of Application class.
 *
 *   \copyright (c) 2022 SECO Mind Germany GmbH
 *   \copyright All rights reserved.
 *
 *   \remark Web: https://north.seco.com
 *   \remark Email: north@seco.com
 ***************************************************************************/
#include "application.h"

#include <QCommandLineParser>
#include <QFileInfo>
#include <QtCore/QDir>
#include <QDebug>
#include <syslog.h>
#include <signal.h>
#include "qbytearray.h"
#include "config.h"

/**
 * @brief  Constructor of the class Application
 * @param argc : number of command line arguments
 * @param argv : command line arguments
 */
Application::Application(int &argc, char **argv)
    : QGuiApplication(argc, argv)
{
    setOrganizationName("SECO Mind Germany GmbH");
    setApplicationName("Clea Demo App");
    setApplicationVersion("v0.0.1");

    catchUnixSignals({ SIGQUIT, SIGINT, SIGTERM, SIGHUP });

    initialize();
}

/**
 * @brief Destructor of the application class
 */
Application::~Application()
{
    syslog(LOG_INFO, "Destroyed Clea Demo");
}

/**
 * @brief initialization method for the application
 */
void Application::initialize()
{
    syslog(LOG_INFO, "Initializing Clea Demo %s", applicationVersion().toStdString().c_str());

    // Read user settings from ini file
    Config::instance()->readUserSettings();
}

/**
 * @brief Ignore provided list of UNIX signals.
 * @param quitSignals : QList<int> : signal.h defines e.g. {SIGQUIT, SIGINT, SIGTERM, SIGHUP}
 */
void Application::ignoreUnixSignals(QList<int> ignoreSignals)
{
    // all these signals will be ignored.
    for (int sig : ignoreSignals)
        signal(sig, SIG_IGN);
}

/**
 * @brief Catch provided list of UNIX signals and quit the application.
 * @param quitSignals : QList<int> : signal.h defines e.g. {SIGQUIT, SIGINT, SIGTERM, SIGHUP}
 */
void Application::catchUnixSignals(QList<int> quitSignals)
{
    auto handler = [](int sig) -> void {
        // blocking and not aysnc-signal-safe func are valid
        qInfo() << "Quit the application by signal" << sig;
        syslog(LOG_INFO, "Quit the application by signal %d", sig);
        QCoreApplication::quit();
    };

    sigset_t blocking_mask;
    sigemptyset(&blocking_mask);
    for (auto sig : quitSignals) {
        sigaddset(&blocking_mask, sig);
    }

    struct sigaction sa;
    sa.sa_handler = handler;
    sa.sa_mask = blocking_mask;
    sa.sa_flags = 0;

    for (auto sig : quitSignals) {
        sigaction(sig, &sa, nullptr);
    }
}
