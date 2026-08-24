"""EgoBlur sidecar: blurs faces and license plates in images.

Detection + blur logic adapted from Meta's EgoBlur Gen1 demo script
(https://github.com/facebookresearch/EgoBlur, Apache-2.0).
"""

import os
from contextlib import asynccontextmanager

import cv2
import numpy as np
import torch
import torchvision
from fastapi import FastAPI, HTTPException, Request, Response

FACE_MODEL_PATH = os.getenv("FACE_MODEL_PATH", "models/ego_blur_face.jit")
LP_MODEL_PATH = os.getenv("LP_MODEL_PATH", "models/ego_blur_lp.jit")
SCORE_THRESHOLD = float(os.getenv("SCORE_THRESHOLD", "0.9"))
NMS_IOU_THRESHOLD = float(os.getenv("NMS_IOU_THRESHOLD", "0.3"))

# cv2.imencode has no GIF support; unknown/gif inputs come back as PNG.
OUTPUT_FORMATS = {
    "image/jpeg": (".jpg", "image/jpeg"),
    "image/png": (".png", "image/png"),
    "image/webp": (".webp", "image/webp"),
}

detectors: list[torch.jit.ScriptModule] = []


@asynccontextmanager
async def lifespan(_: FastAPI):
    for path in (FACE_MODEL_PATH, LP_MODEL_PATH):
        model = torch.jit.load(path, map_location="cpu")
        model.eval()
        detectors.append(model)
    yield


app = FastAPI(lifespan=lifespan)


def get_detections(detector: torch.jit.ScriptModule, image_tensor: torch.Tensor) -> list[list[float]]:
    with torch.no_grad():
        boxes, _, scores, _ = detector(image_tensor)
    keep = torchvision.ops.nms(boxes, scores, NMS_IOU_THRESHOLD)
    boxes = boxes[keep].cpu().numpy()
    scores = scores[keep].cpu().numpy()
    return boxes[scores > SCORE_THRESHOLD].tolist()


def blur_boxes(image: np.ndarray, boxes: list[list[float]]) -> np.ndarray:
    """Ellipse-masked heavy blur over each detection box (EgoBlur demo logic)."""
    image_fg = image.copy()
    mask = np.zeros((image.shape[0], image.shape[1], 1), dtype=np.uint8)
    ksize = (max(image.shape[0] // 2, 1), max(image.shape[1] // 2, 1))
    img_h, img_w = image.shape[:2]

    for box in boxes:
        x1, y1 = max(int(box[0]), 0), max(int(box[1]), 0)
        x2, y2 = min(int(box[2]), img_w), min(int(box[3]), img_h)
        if x2 <= x1 or y2 <= y1:
            continue
        image_fg[y1:y2, x1:x2] = cv2.blur(image_fg[y1:y2, x1:x2], ksize)
        cv2.ellipse(mask, (((x1 + x2) // 2, (y1 + y2) // 2), (x2 - x1, y2 - y1), 0), 255, -1)

    inverse_mask = cv2.bitwise_not(mask)
    image_bg = cv2.bitwise_and(image, image, mask=inverse_mask)
    image_fg = cv2.bitwise_and(image_fg, image_fg, mask=mask)
    return cv2.add(image_bg, image_fg)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "models_loaded": len(detectors)}


@app.post("/detect")
async def detect(request: Request) -> dict:
    data = await request.body()
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=422, detail="Could not decode image")

    image_tensor = torch.from_numpy(np.transpose(image, (2, 0, 1)))
    face_boxes: list[list[float]] = []
    lp_boxes: list[list[float]] = []

    if len(detectors) > 0:
        face_boxes = get_detections(detectors[0], image_tensor)
    if len(detectors) > 1:
        lp_boxes = get_detections(detectors[1], image_tensor)

    has_person = len(face_boxes) > 0
    has_license_plate = len(lp_boxes) > 0

    return {
        "safe": not (has_person or has_license_plate),
        "has_person": has_person,
        "has_license_plate": has_license_plate,
        "face_count": len(face_boxes),
        "lp_count": len(lp_boxes),
        "total_detections": len(face_boxes) + len(lp_boxes),
        "reason": "Image might contain sensitive data/information please retake the image" if (has_person or has_license_plate) else None,
    }


@app.post("/blur")
async def blur(request: Request) -> Response:
    data = await request.body()
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=422, detail="Could not decode image")

    image_tensor = torch.from_numpy(np.transpose(image, (2, 0, 1)))
    boxes = [box for detector in detectors for box in get_detections(detector, image_tensor)]
    if boxes:
        image = blur_boxes(image, boxes)

    ext, media_type = OUTPUT_FORMATS.get(request.headers.get("content-type", ""), (".png", "image/png"))
    ok, encoded = cv2.imencode(ext, image)
    if not ok:
        raise HTTPException(status_code=500, detail="Could not encode image")
    return Response(content=encoded.tobytes(), media_type=media_type)


if __name__ == "__main__":
    # Self-check for blur_boxes (no models needed): pixels inside the box change,
    # far corner stays untouched.
    img = np.full((100, 100, 3), 200, dtype=np.uint8)
    img[40:60, 40:60] = 0
    out = blur_boxes(img, [[35.0, 35.0, 65.0, 65.0]])
    assert not np.array_equal(out[45:55, 45:55], img[45:55, 45:55]), "box region should be blurred"
    assert np.array_equal(out[0:5, 0:5], img[0:5, 0:5]), "outside region should be untouched"
    assert np.array_equal(blur_boxes(img, [[90.0, 90.0, 80.0, 80.0]]), img), "degenerate box is a no-op"
    print("blur_boxes self-check passed")
