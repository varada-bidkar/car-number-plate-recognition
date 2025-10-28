import cv2
import numpy as np
import easyocr

# Initialize EasyOCR reader (CPU). Set gpu=True if you have CUDA & torch configured.
reader = easyocr.Reader(['en'], gpu=False)

def preprocess_image_bytes(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def detect_plate_contours(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)
    edged = cv2.Canny(gray, 30, 200)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            (x, y, w, h) = cv2.boundingRect(approx)
            aspect_ratio = w / float(h+1e-6)
            if 2 <= aspect_ratio <= 6:
                candidates.append((x, y, w, h))
    return candidates

def read_plate_text(img):
    # EasyOCR expects RGB or grayscale numpy arrays
    if len(img.shape) == 3 and img.shape[2] == 3:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    else:
        rgb = img
    results = reader.readtext(rgb)
    if not results:
        return ""
    results.sort(key=lambda r: r[2], reverse=True)
    return results[0][1]

def detect_and_read(image_bytes):
    img = preprocess_image_bytes(image_bytes)
    candidates = detect_plate_contours(img)
    output = []

    for (x, y, w, h) in candidates[:3]:
        plate_img = img[y:y+h, x:x+w]
        text = read_plate_text(plate_img)
        output.append({"bbox": [int(x), int(y), int(w), int(h)], "text": text})

    if not output:
        text = read_plate_text(img)
        output.append({"bbox": [0, 0, img.shape[1], img.shape[0]], "text": text})

    return output
