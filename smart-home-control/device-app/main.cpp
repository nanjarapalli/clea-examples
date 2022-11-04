#include <QQuickView>
#include <QQmlContext>
#include "application.h"
#include "astartesdk.h"

int main(int argc, char *argv[])
{
#if QT_VERSION < QT_VERSION_CHECK(6, 0, 0)
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
#endif

    Application app(argc, argv);

    qmlRegisterSingletonType<AstarteSDK>("com.seco.astarte", 1, 0, "AstarteSDK", &AstarteSDK::qmlInstance);

    QQuickView view;
    view.setSource(QUrl(QStringLiteral("qrc:/main.qml")));
    view.showFullScreen();

    return app.exec();
}
