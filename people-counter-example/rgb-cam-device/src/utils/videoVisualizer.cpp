/**
 * @file videoVisualizer.cpp
 * @author Luca Di Mauro (luca.dimauro@seco.com)
 * @brief 
 * @version 0.1
 * @date 2022-10-17
 * 
 * @copyright Copyright (c) 2022
 * 
 */


#include <videoVisualizer.hpp>

#include "ui_videovisualizer.h"

#include <csignal>




VideoVisualizer::VideoVisualizer (QWidget *parent) : QMainWindow (parent) , ui (new Ui::VideoVisualizer) {
    ui->setupUi(this);

    ui->graphicsView->setScene (new QGraphicsScene(this));
    ui->graphicsView->scene()->addItem(&pixmap);
    QWidget::showMaximized();
}




VideoVisualizer::~VideoVisualizer () {
    delete ui;
}




void VideoVisualizer::update (QImage &img) {
    pixmap.setPixmap(QPixmap::fromImage(img.rgbSwapped()));
    ui->graphicsView->fitInView (&pixmap, Qt::KeepAspectRatio);
}




void VideoVisualizer::closeEvent(QCloseEvent *event) {
    qInfo() << "Closing the application!";
    std::raise (SIGINT);
}