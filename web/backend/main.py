from functools import lru_cache
from io import BytesIO
import os
from pathlib import Path
import pickle

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from starlette.responses import Response
import torch
from torchvision.models import resnet50
from torchvision.transforms import Compose, Normalize, Resize, ToTensor

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}
CLASS_NAMES = ("COVID", "Lung_Opacity", "Normal", "Viral Pneumonia")
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[2] / "covid.pth"

app = FastAPI(title="COVID-19 X-ray API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "COVID_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:4173,http://127.0.0.1:4173",
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class PredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    probabilities: dict[str, float]


class ModelConfigurationError(Exception):
    pass


@app.get("/", tags=["status"])
def root() -> dict[str, str]:
    return {
        "message": "COVID-19 X-ray prediction API",
        "docs": "/docs",
        "prediction_endpoint": "POST /predict",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


def validate_image(content: bytes) -> None:
    try:
        with Image.open(BytesIO(content)) as image:
            if image.format not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=415,
                    detail={
                        "code": "unsupported_image_format",
                        "message": "Only PNG and JPEG images are accepted.",
                    },
                )
            image.verify()
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_image",
                "message": "The uploaded file is not a valid PNG or JPEG image.",
            },
        ) from exc
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "image_too_large",
                "message": "The image dimensions are too large to process.",
            },
        ) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "invalid_image",
                "message": "The uploaded file is not a valid PNG or JPEG image.",
            },
        ) from exc


@lru_cache(maxsize=1)
def load_model() -> torch.nn.Module:
    model_path = Path(os.environ.get("COVID_MODEL_PATH", str(DEFAULT_MODEL_PATH)))
    if not model_path.is_file():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    try:
        state_dict = torch.load(
            model_path,
            map_location="cpu",
            weights_only=True,
        )
        if not isinstance(state_dict, dict):
            raise ModelConfigurationError(
                "The checkpoint must contain a ResNet50 state dictionary."
            )

        model = resnet50(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, len(CLASS_NAMES))
        model.load_state_dict(state_dict, strict=True)
    except (OSError, EOFError, pickle.UnpicklingError, RuntimeError) as exc:
        raise ModelConfigurationError(
            "The checkpoint could not be loaded as a four-class ResNet50 state dictionary."
        ) from exc

    model.eval()
    return model


inference_transform = Compose(
    [
        Resize((224, 224)),
        ToTensor(),
        Normalize(
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        ),
    ]
)


@app.post("/predict", response_model=PredictionResponse)
def predict(image: UploadFile = File(...)) -> PredictionResponse:
    content = image.file.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "image_too_large",
                "message": "The uploaded image must not exceed 10 MB.",
            },
        )

    validate_image(content)

    try:
        model = load_model()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "model_not_configured",
                "message": (
                    "Set COVID_MODEL_PATH to the trained four-class ResNet50 "
                    "checkpoint before requesting predictions."
                ),
            },
        ) from exc
    except ModelConfigurationError as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "model_load_failed",
                "message": str(exc),
            },
        ) from exc

    with Image.open(BytesIO(content)) as source_image:
        input_tensor = inference_transform(source_image.convert("RGB")).unsqueeze(0)

    with torch.inference_mode():
        logits = model(input_tensor)

    if not isinstance(logits, torch.Tensor) or logits.shape != (1, len(CLASS_NAMES)):
        raise HTTPException(
            status_code=500,
            detail={
                "code": "invalid_model_output",
                "message": "The configured model did not return four class scores.",
            },
        )

    probabilities = torch.softmax(logits[0], dim=0)
    predicted_index = int(torch.argmax(probabilities).item())
    class_probabilities = {
        class_name: round(float(probability.item()) * 100, 2)
        for class_name, probability in zip(CLASS_NAMES, probabilities)
    }

    return PredictionResponse(
        predicted_class=CLASS_NAMES[predicted_index],
        confidence=class_probabilities[CLASS_NAMES[predicted_index]],
        probabilities=class_probabilities,
    )
