import os
import sys
import cv2
import math
import csv
import datetime
import numpy as np
import matplotlib.pyplot as plt
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import tracker

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_path(rel_path):
    return os.path.join(BASE_DIR, rel_path)

CANDIDATE_VIDEOS = [
    get_path('video/realcctv.mp4'),
    get_path('realcctv.mp4'),
    os.path.join(os.path.dirname(BASE_DIR), 'realcctv.mp4'),
    get_path('video/crowd.mp4')
]
VIDEO_INPUT  = next((p for p in CANDIDATE_VIDEOS if os.path.exists(p)), get_path('video/realcctv.mp4'))
VIDEO_OUTPUT = get_path('video/results.avi')
CLASS_FILE   = get_path('coco.names')
CONFIG_FILE  = get_path('yolov4.cfg')
WEIGHTS_FILE = get_path('yolov4.weights')
CSV_OUTPUT   = get_path('seconds_and_counts.csv')

# ── Sanity checks ────────────────────────────────────────────────────────────
for path in [VIDEO_INPUT, CLASS_FILE, CONFIG_FILE, WEIGHTS_FILE]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Required file not found: {path}")

print(f"[INFO] Using video source: '{VIDEO_INPUT}'")

# ── Load video ───────────────────────────────────────────────────────────────
video = cv2.VideoCapture(VIDEO_INPUT)
if not video.isOpened():
    raise RuntimeError(f"Could not open video: {VIDEO_INPUT}")

codec      = cv2.VideoWriter_fourcc(*'XVID')
vid_fps    = int(video.get(cv2.CAP_PROP_FPS)) or 25
vid_width  = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
vid_height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
out_video  = cv2.VideoWriter(VIDEO_OUTPUT, codec, vid_fps, (vid_width, vid_height))

# ── Load class names ─────────────────────────────────────────────────────────
with open(CLASS_FILE, 'rt') as f:
    class_names = f.read().rstrip('\n').split('\n')

# ── Setup YOLOv4 model ───────────────────────────────────────────────────────
net = cv2.dnn_DetectionModel(WEIGHTS_FILE, CONFIG_FILE)

# Auto-detect CUDA; fall back to CPU if unavailable
_cuda_ok = False
try:
    net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)
    net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)
    _cuda_ok = True
    print("[INFO] CUDA backend enabled.")
except Exception:
    pass

if not _cuda_ok:
    net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
    net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
    print("[INFO] CUDA not available — using CPU backend.")

net.setInputSize(416, 416)
net.setInputScale(1.0 / 255.0)
net.setInputMean((0, 0, 0))
net.setInputSwapRB(True)

# ── Counters & state ─────────────────────────────────────────────────────────
conf_threshold = 0.35
nms_threshold  = 0.40
exact_seconds  = 0
total_frames   = 0
total_fps      = 0
pre_obj        = {}
down           = 0
up             = 0
init_time      = time.time()

seconds_person_counts = {}
seconds_person_enter  = {}
seconds_person_exit   = {}

# Instantiate tracker
tracker_obj = tracker.EuclideanDistTracker()

# ── HOG initial count ────────────────────────────────────────────────────────
def HOG_initial_count():
    """Use HOG on first frame to get an initial head-count estimate."""
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    ret, first_frame = video.read()
    if not ret or first_frame is None:
        return 0
    (regions, _) = hog.detectMultiScale(first_frame, winStride=(3, 3),
                                         padding=(8, 8), scale=1.05)
    video.set(cv2.CAP_PROP_POS_FRAMES, 0)  # rewind so main loop starts at frame 0
    return len(regions)

def time_estimator(average):
    runtime_seconds = time.time() - init_time
    if average == 0:
        return 0
    return math.floor(int(runtime_seconds) / average)

# ── Main loop ────────────────────────────────────────────────────────────────
total_counts = HOG_initial_count()
print(f"[INFO] HOG initial count: {total_counts} people in first frame")

_cuda_fallback_done = False

print("[INFO] Press Q or ESC in the video window to quit, or Ctrl+C in terminal.")

try:
    while True:
        total_frames += 1
        ret, img = video.read()

        if not ret or img is None:
            print("[INFO] Video ended — processing complete.")
            break

        img_in     = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        start_time = time.time()

        # YOLO detection (runtime CUDA fallback)
        try:
            class_ids, confidence, bounding_box = net.detect(img_in, conf_threshold, nms_threshold)
        except cv2.error:
            if not _cuda_fallback_done:
                net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
                net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
                _cuda_fallback_done = True
                print("[WARN] CUDA error at runtime — switched to CPU.")
            class_ids, confidence, bounding_box = net.detect(img_in, conf_threshold, nms_threshold)

        # Filter for 'person' (COCO class ID 0)
        people_detections = []
        if class_ids is not None and len(class_ids) > 0:
            for (classId, score, box) in zip(class_ids.flatten(),
                                              confidence.flatten(),
                                              bounding_box):
                if int(classId) == 0:
                    people_detections.append([int(box[0]), int(box[1]),
                                              int(box[2]), int(box[3])])

        bounding_box_ids, coordinate_dict = tracker_obj.update(people_detections)

        height, width, _ = img.shape
        line_y_upper = int(4 * height / 6 - height / 20)
        line_y_lower = int(4 * height / 6 + height / 20)
        cv2.line(img, (0, line_y_lower), (width, line_y_lower), (0, 255, 0), thickness=2)
        cv2.line(img, (0, line_y_upper), (width, line_y_upper), (0, 255, 0), thickness=2)

        cmap   = plt.get_cmap('tab20b')
        colors = [cmap(i)[:3] for i in np.linspace(0, 1, 20)]

        for bounding_box_id in bounding_box_ids:
            x, y, w, h, obj_id = bounding_box_id
            centroid_location  = (x + round(w / 2), y + round(h / 2))
            centerY            = y + round(h / 2)

            color = [i * 255 for i in colors[int(obj_id) % len(colors)]]
            cv2.circle(img, centroid_location, 3, (0, 255, 0), 2)
            cv2.rectangle(img, (x, y), (x + w, y + h), color=color, thickness=2)
            cv2.putText(img, f"ID:{obj_id}", (x, y - 5),
                        cv2.FONT_HERSHEY_PLAIN, 1, color=color, thickness=2)

            # Counting logic
            if line_y_upper <= centerY <= line_y_lower:
                id_key = str(obj_id)
                if id_key not in pre_obj:
                    pre_obj[id_key] = {"center_y": centerY, "Flags": False}
                else:
                    if pre_obj[id_key]["center_y"] < centerY and not pre_obj[id_key]["Flags"]:
                        down += 1
                        total_counts -= 1
                        pre_obj[id_key]["Flags"] = True
                    elif pre_obj[id_key]["center_y"] > centerY and not pre_obj[id_key]["Flags"]:
                        up += 1
                        total_counts += 1
                        pre_obj[id_key]["Flags"] = True

        elapsed = time.time() - start_time
        fps = 1.0 / elapsed if elapsed > 0 else 0
        total_fps += fps
        average_frames = total_fps / total_frames
        exact_seconds  = time_estimator(average_frames)

        seconds_person_counts[exact_seconds] = total_counts
        print(f"Second: {exact_seconds} | In: {up} | Out: {down} | Total: {total_counts}")

        cv2.putText(img, f"FPS: {fps:.2f}",                          (10, 30),  0, 1,   (0, 0, 255), 2)
        cv2.putText(img, f"People Entering: {up}",                   (10, 60),  0, 0.6, (0, 0, 255), 1)
        cv2.putText(img, f"People Exiting: {down}",                  (10, 85),  0, 0.6, (0, 0, 255), 1)
        cv2.putText(img, f"Total People in premise: {total_counts}", (10, 110), 0, 0.6, (0, 0, 255), 1)

        try:
            cv2.imshow("Footfall Counter", img)
        except Exception:
            pass

        out_video.write(img)

        key = cv2.waitKey(1) & 0xFF
        # Quit on: Q key, ESC key, or closing the window with X button
        window_closed = False
        try:
            if cv2.getWindowProperty("Footfall Counter", cv2.WND_PROP_VISIBLE) < 1:
                window_closed = True
        except Exception:
            pass

        if key == ord('q') or key == 27 or window_closed:
            print("[INFO] Quit by user.")
            break

except Exception as e:
    print(f"[ERROR] {e}")

finally:
    video.release()
    out_video.release()
    cv2.destroyAllWindows()

    with open(CSV_OUTPUT, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(['Second', 'Cumulative Count'])
        for row in seconds_person_counts.items():
            writer.writerow(row)

    print(f"\n[DONE] Results saved to '{CSV_OUTPUT}'")
    print(f"       Total entering : {up}")
    print(f"       Total exiting  : {down}")
    print(f"       Final count    : {total_counts}")
    print(f"       Output video   : '{VIDEO_OUTPUT}'")

