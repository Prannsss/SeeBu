# EgoBlur Service

Small FastAPI sidecar that blurs faces and license plates in report photos using Meta's [EgoBlur](https://github.com/facebookresearch/EgoBlur) Gen1 models (Apache-2.0, [Raina et al. 2023](https://arxiv.org/abs/2308.13093)).

The Node backend calls it from `persistImageInput` before storing the public copy. **Without this service, images are stored unblurred** — useful for dev and production fallback when the service is unavailable.

## Prerequisites

- Python 3.10–3.12 (tested on 3.13 as well)
- EgoBlur Gen1 models from https://www.projectaria.com/tools/egoblur/ (free, requires license acceptance)

## Initial Setup

1. **Download models** from https://www.projectaria.com/tools/egoblur/:
   - Extract and place in `egoblur-service/models/`:
     - `ego_blur_face.jit`
     - `ego_blur_lp.jit`

2. **Create virtual environment** (one-time):
   ```bash
   cd egoblur-service
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or: source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

3. **Enable in backend** by setting `EGOBLUR_SERVICE_URL=http://localhost:8228` in `backend/.env`.

## Running Locally (Dev)

Start the service in one terminal:
```bash
cd egoblur-service
.venv\Scripts\uvicorn main:app --port 8228  # Windows
# or: source .venv/bin/activate && uvicorn main:app --port 8228  # macOS/Linux
```

Then run the backend in another terminal:
```bash
npm run backend:watch  # from repo root
```

When you submit a report with a photo in the frontend, the image will be blurred before storage.

### Self-Check (No Models Needed)
```bash
python egoblur-service/main.py
# Output: blur_boxes self-check passed
```

## API

- `POST /blur` — raw image bytes in body, `Content-Type: image/jpeg|png|webp`.
  Returns the blurred image in the same format (GIF/unknown formats re-encoded as PNG).
- `GET /health` — `{"ok": true, "models_loaded": 2}`.

## Configuration

| Env Variable | Default | Notes |
|---|---|---|
| `FACE_MODEL_PATH` | `models/ego_blur_face.jit` | Path to face detection model |
| `LP_MODEL_PATH` | `models/ego_blur_lp.jit` | Path to license plate detection model |
| `SCORE_THRESHOLD` | `0.9` | Detection confidence threshold (0–1) |
| `NMS_IOU_THRESHOLD` | `0.3` | Non-maximum suppression overlap threshold |

## Troubleshooting

- **Import Error (torch/cv2/fastapi)**: Ensure `pip install -r requirements.txt` completed and venv is activated.
- **Models not found**: Verify paths in `models/` or update `FACE_MODEL_PATH` / `LP_MODEL_PATH`.
- **Backend ignores service**: Check `EGOBLUR_SERVICE_URL` is set in `backend/.env` and service is running on port 8228.
- **Slow startup**: First-time model load (~30s); subsequent starts are faster.

## Upgrade Path

Gen2 models are more accurate but require detectron2. To upgrade, download Gen2 models and swap the `get_detections` function in `main.py`.
