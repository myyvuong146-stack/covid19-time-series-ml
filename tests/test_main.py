from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
from PIL import Image
import torch

from main import CLASS_NAMES, favicon, predict, root


def make_png() -> bytes:
    output = BytesIO()
    Image.new("RGB", (2, 2)).save(output, format="PNG")
    return output.getvalue()


class FixedModel(torch.nn.Module):
    def forward(self, image: torch.Tensor) -> torch.Tensor:
        return torch.tensor([[2.0, 1.0, 0.0, -1.0]])


class PredictEndpointTests(unittest.TestCase):
    def test_valid_image_returns_four_class_percentages(self) -> None:
        upload = UploadFile(filename="xray.png", file=BytesIO(make_png()))

        with patch("main.load_model", return_value=FixedModel()):
            response = predict(upload)

        self.assertEqual(response.predicted_class, "COVID")
        self.assertEqual(set(response.probabilities), set(CLASS_NAMES))
        self.assertAlmostEqual(sum(response.probabilities.values()), 100, places=1)
        self.assertEqual(response.confidence, response.probabilities["COVID"])

    def test_missing_model_reports_not_configured(self) -> None:
        upload = UploadFile(filename="xray.png", file=BytesIO(make_png()))

        with patch("main.load_model", side_effect=FileNotFoundError):
            with self.assertRaises(HTTPException) as raised:
                predict(upload)

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(raised.exception.detail["code"], "model_not_configured")

    def test_invalid_image_is_rejected(self) -> None:
        upload = UploadFile(filename="xray.png", file=BytesIO(b"not an image"))

        with self.assertRaises(HTTPException) as raised:
            predict(upload)

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(raised.exception.detail["code"], "invalid_image")

    def test_unsupported_image_format_is_rejected(self) -> None:
        output = BytesIO()
        Image.new("RGB", (2, 2)).save(output, format="BMP")
        upload = UploadFile(filename="xray.bmp", file=BytesIO(output.getvalue()))

        with self.assertRaises(HTTPException) as raised:
            predict(upload)

        self.assertEqual(raised.exception.status_code, 415)
        self.assertEqual(
            raised.exception.detail["code"], "unsupported_image_format"
        )

    def test_oversized_image_is_rejected(self) -> None:
        upload = UploadFile(filename="large.png", file=BytesIO(b"12345"))

        with patch("main.MAX_IMAGE_BYTES", 4):
            with self.assertRaises(HTTPException) as raised:
                predict(upload)

        self.assertEqual(raised.exception.status_code, 413)
        self.assertEqual(raised.exception.detail["code"], "image_too_large")


class ServiceRouteTests(unittest.TestCase):
    def test_root_describes_api(self) -> None:
        response = root()

        self.assertEqual(response["docs"], "/docs")

    def test_favicon_has_no_content(self) -> None:
        response = favicon()

        self.assertEqual(response.status_code, 204)


if __name__ == "__main__":
    unittest.main()
