from distutils.log import info
import cv2
import numpy as np
import pandas as pd
from timeit import default_timer as timer
import time

from PyQt5.QtCore import (Qt, QObject, pyqtSignal, QThread, QTimer)
#from smart-vending-machine.app_tablet.astarte.as_conn import send_data
from openvino.inference_engine import IECore

from utils.definitions import emotions, genders
import os

DEBUG = False

pause_time = 5.0


def get_bigger_face(locs):
    if len(locs) == 1:
        return 0
    max_area = 0
    selected = 0
    for i, box in enumerate(locs):
        (startX, startY, endX, endY) = box
        area = abs(endX-startX) * abs(endY-startY)
        if area > max_area:
            max_area = area
            selected = i
    return selected


class VideoThread(QThread):
    updated = pyqtSignal()  # in order to work it has to be defined out of the contructor
    rejected_transaction = pyqtSignal(dict)

    def __init__(self, config):
        super().__init__()

        self.currentFrame = None
        self.active = False
        self.pause = False
        self.source = config["VIDEO"]["source"]
        self.current_user = {}
        self.detector_backend = 'opencv'
        self.enable_face_analysis = True
        self.frame_threshold = int(config["VIDEO"]["frame_threshold"])
        self.time_threshold = int(config["VIDEO"]["time_threshold"])
        self.init_models(config=config)


    def init_models(self, config):
        tic = time.time()
        ie = IECore()
        video_config = config["VIDEO"]
        
        self.net_face_det = ie.read_network(
            model="{}.xml".format(video_config["face_detection_model_prefix"]),
            weights="{}.bin".format(video_config["face_detection_model_prefix"])
        )
        self.net_age_gen = ie.read_network(
            model="{}.xml".format(video_config["age_gender_model_prefix"]),
            weights="{}.bin".format(video_config["age_gender_model_prefix"])
        )
        self.net_emotions = ie.read_network(
            model="{}.xml".format(video_config["emotions_model_prefix"]),
            weights="{}.bin".format(video_config["emotions_model_prefix"])
        )


        print ("Loading face detection network..")
        self.exec_net_face_det = ie.load_network(self.net_face_det, video_config["face_detection_net_executor"])
        print ("Loading age and gender network..")
        self.exec_net_age_gen = ie.load_network(self.net_age_gen, video_config["age_gender_net_executor"])
        print ("Loading emotions network..")
        self.exec_net_emotions = ie.load_network(self.net_emotions, video_config["emotions_net_executor"])

        print ("\n====================\nAll networks loaded!\n====================\n")

        toc = time.time()
        print("Facial attibute analysis models loaded in ", toc - tic, " seconds")

    def get_current_frame(self):
        """Getter for the currentFrame attribute"""
        return self.currentFrame

    def get_info_user(self):
        return self.current_user

    def reset_user_info(self):
        self.current_user = {}

    def set_frame_threshold(self, thr):
        self.frame_threshold = thr

    def set_time_threshold(self, thr):
        self.time_threshold = thr

    def deactivate(self):
        """Method called to stop and deactivate the face recognition Thread"""
        self.active = False
        self.exit()

    def pause_loop(self):
        self.pause = True
        # QTimer.singleShot(int(pause_time*1000), self.unpause)

    def unpause(self):
        self.pause = False
        


    def run(self):
        """Main loop of this Thread"""
        self.active = True

        # output_layer_ir_face_det = next(iter(exec_net_face_det.outputs))
        input_layer_ir_face_det = next(iter(self.exec_net_face_det.input_info))
        # output_layer_ir_age_gen = next(iter(exec_net_age_gen.outputs))
        input_layer_ir_age_gen = next(iter(self.exec_net_age_gen.input_info))
        # output_layer_ir_emotions = next(iter(exec_net_emotions.outputs))
        input_layer_ir_emotions = next(iter(self.exec_net_emotions.input_info))
        # N,C,H,W = batch size, number of channels, height, width
        _, _, H, W = self.net_face_det.input_info[input_layer_ir_face_det].tensor_desc.dims
        _, _, H_ag, W_ag = self.net_age_gen.input_info[input_layer_ir_age_gen].tensor_desc.dims
        _, _, H_em, W_em = self.net_emotions.input_info[input_layer_ir_emotions].tensor_desc.dims


        camera = cv2.VideoCapture(self.source)

        emotion_labels = emotions

        threshold_conf = 0.9
        freeze = False
        face_detected_bool = False
        face_included_frames = 0  # freeze screen if face detected sequantially 5 frames
        freezed_frame = 0
        tic = time.time()

        while self.active:
            # Grab a single frame of video
            if not self.pause:

                _, frame = camera.read()
    
                if frame is None:
                    break

                frame = cv2.flip(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), 1)

                
                raw_img = frame.copy()
                if freeze == False:
                    try:
                        # faces store list of detected_face and region pair
                        resized_frame = cv2.resize(raw_img, (W, H))
                        input_frame = np.expand_dims(resized_frame.transpose(2, 0, 1), 0)
                        face_detected = self.exec_net_face_det.infer(inputs={input_layer_ir_face_det: input_frame})
                    except:  # to avoid exception if no face detected
                        face_detected = []

                    if len(face_detected) == 0:
                        face_included_frames = 0
                else:
                    face_detected = []
                resolution_x = frame.shape[1]
                resolution_y = frame.shape[0]
                rgb_image = frame


                # Fetch image shapes to calculate ratio
                (real_y, real_x), (resized_y, resized_x) = frame.shape[:2], resized_frame.shape[:2]
                ratio_x, ratio_y = real_x / resized_x, real_y / resized_y

                detected_faces = []
                face_index = 0
                area_max = 0
                face_count = 0
                if face_detected:
                    for i in range(face_detected["detection_out"].shape[2]):
                        conf = face_detected["detection_out"][0,0,i,2]
                        if conf > threshold_conf:
                            face_count += 1
                            # Convert float to int and multiply corner position of each box by x and y ratio
                            # In case that bounding box is found at the top of the image,
                            # we position upper box bar little bit lower to make it visible on image(
                            (x_min, y_min, x_max, y_max) = [
                                int(max(corner_position * ratio_y *resized_y, 10)) if idx % 2
                                else int(max(corner_position * ratio_x *resized_x, 10))
                                for idx, corner_position in enumerate(face_detected["detection_out"][0,0,i,3:])
                            ]
                            face_detected_bool = True
                            if face_index == 0:
                                face_included_frames = face_included_frames + 1  # increase frame for a single face
                                face_index = 1
                            area = (x_max-x_min)*(y_max-y_min)
                            if area > area_max:
                                area_max = area
                                detected_faces.append((x_min, y_min, x_max, y_max))
                                cv2.rectangle(rgb_image, (x_min, y_min), (x_max, y_max), (65,105,225), 2)  # draw rectangle to main image
                                cv2.putText(frame, str(self.frame_threshold - face_included_frames),
                                            (int(x_min + (x_max-x_min) / 4)-30, int(y_min + (y_max-y_min) / 1.5)+10),
                                            cv2.FONT_HERSHEY_SIMPLEX, 4, (255, 255, 255), 2
                                            )
                if not face_count:
                    face_included_frames = 0

                if face_detected_bool==True and face_included_frames==self.frame_threshold and freeze==False:
                    freeze = True
                    base_img = raw_img.copy()
                    tic = time.time()
                
                if freeze == True:

                    toc = time.time()
                    if (toc - tic) < self.time_threshold:

                        if freezed_frame == 0:
                            freeze_img = base_img.copy()
                            # freeze_img = np.zeros(resolution, np.uint8) #here, np.uint8 handles showing white area issue

                            for detected_face in detected_faces:
                                x = detected_face[0]
                                y = detected_face[1]
                                w = abs(detected_face[0] - detected_face[2])
                                h = abs(detected_face[1] - detected_face[3])

                                cv2.rectangle(freeze_img, (x, y), (x + w, y + h), (65,105,225), 4)  # draw rectangle to main image

                                try:
                                    custome_face = frame[y:y+h, x:x+w, :]

                                    resized_custome_face_ag = cv2.resize(custome_face, (W_ag, H_ag))
                                    resized_custome_face_em = cv2.resize(custome_face, (W_em, H_em))
                                    input_custome_face_ag = np.expand_dims(resized_custome_face_ag.transpose(2, 0, 1), 0)
                                    input_custome_face_em = np.expand_dims(resized_custome_face_em.transpose(2, 0, 1), 0)
                                    age_gender_prediction = self.exec_net_age_gen.infer(inputs={input_layer_ir_age_gen: input_custome_face_ag})
                                    emotions_prediction = self.exec_net_emotions.infer(inputs={input_layer_ir_age_gen: input_custome_face_em})['prob_emotion'][0, :, 0, 0]

                                    if np.argmax(age_gender_prediction["prob"]) == 0:
                                        gender = "W"
                                    elif np.argmax(age_gender_prediction["prob"]) == 1:
                                        gender = "M"

                                    emotion_label = emotion_labels[np.argmax(emotions_prediction)]

                                    apparent_age = int(age_gender_prediction["age_conv3"][0,0,0,0]*100)

                                    self.current_user['emotion'] = emotion_label
                                    self.current_user['age'] = apparent_age
                                    self.current_user['gender'] = gender

                                    # transparency
                                    overlay = freeze_img.copy()
                                    opacity = 0.4

                                    x_info = 10
                                    y_info = 10

                                    cv2.rectangle(freeze_img, (x_info, y_info), (x_info + 200, y_info + 80), (64, 64, 64), cv2.FILLED)
                                    cv2.addWeighted(overlay, opacity, freeze_img, 1 - opacity, 0, freeze_img)

                                    x_info += 2
                                    y_info += 20
                                    cv2.putText(freeze_img, f"Emotion: {emotion_label}", (x_info, y_info),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                                    # x_info += 20
                                    y_info += 20
                                    cv2.putText(freeze_img, f"Gender: {gender}", (x_info, y_info),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                                    # x_info += 20
                                    y_info += 20
                                    cv2.putText(freeze_img, f"Age: {apparent_age}", (x_info, y_info),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                                    break
                                    
                                except Exception as e:
                                    print(e)
                                
                            tic = time.time()

                            
                        time_left = int(self.time_threshold - (toc - tic) + 1)

                        cv2.rectangle(freeze_img, (10, resolution_y-50), (90, resolution_y-10), (67, 67, 67), -10)
                        cv2.putText(freeze_img, str(time_left), (40, resolution_y-20), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 1)

                        freezed_frame = freezed_frame + 1
                        self.currentFrame = freeze_img

                    else:
                        if self.current_user == {} :
                            pass
                        else :
                            self.rejected_transaction.emit(self.current_user)

                        face_detected_bool = False
                        face_included_frames = 0
                        freeze = False
                        freezed_frame = 0
                else:
                    # Store the current image
                    self.currentFrame = frame
                    self.current_user = {}
                    pass

                if not self.pause:
                    self.updated.emit()

            else:
                QTimer.singleShot(int(1000), self.unpause)

    def stop(self):
        """Sets run flag to False and waits for thread to finish"""
        print("STOP")
        self.pause = False
        self.wait()
