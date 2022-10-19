/**
 * @file videoVisualizer.hpp
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief 
 * @version 0.1
 * @date 2022-10-17
 * 
 * @copyright Copyright (c) 2022
 * 
 */

#ifndef VIDEO_VISUALIZER_HPP
#define VIDEO_VISUALIZER_HPP

#include <QMainWindow>
#include <QDebug>
#include <QGraphicsScene>
#include <QGraphicsPixmapItem>
#include <QImage>
#include <QPixmap>
#include <QCloseEvent>
#include <QMessageBox>

namespace Ui {
    class VideoVisualizer;
}

class VideoVisualizer : public QMainWindow {
    Q_OBJECT

public:
    explicit VideoVisualizer(QWidget *parent = 0);
    ~VideoVisualizer();

    void update (QImage &img);

protected:
    void closeEvent(QCloseEvent *event);

private:
    Ui::VideoVisualizer *ui;

    QGraphicsPixmapItem pixmap;

};

#endif // VIDEO_VISUALIZER_HPP
