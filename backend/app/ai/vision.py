import base64
import json
from dataclasses import dataclass
from typing import Any
import httpx
from app.config import get_settings


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}


def build_prompt(language_hint: str | None = None) -> str:
    language = LANGUAGE_NAMES.get(language_hint or "", "the detected language")
    return (
        "You are extracting a handwritten doctor prescription. "
        f"The expected prescription language is {language}. "
        "Read messy handwriting carefully, including common Indian prescription abbreviations. "
        "Return JSON only with keys: extracted_text, doctor_name, date, language, "
        "signature_detected, medicines. medicines must include raw_text, medicine, "
        "dosage, frequency, duration, confidence. If unsure, keep the raw text and lower confidence."
    )


@dataclass
class VisionExtraction:
    extracted_text: str
    payload: dict[str, Any]


class VisionClient:
    async def extract(self, content: bytes, mime_type: str, language_hint: str | None = None) -> VisionExtraction:
        settings = get_settings()
        provider = settings.vision_provider.lower()
        try:
            if provider == "gemini":
                return await self._gemini(content, mime_type, language_hint)
            if provider == "openai":
                return await self._openai(content, mime_type, language_hint)
        except Exception as exc:
            if settings.environment == "development" and settings.ai_fallback_to_mock:
                fallback = self._mock()
                fallback.payload["provider_warning"] = f"{provider} failed, returned mock extraction for local development"
                return fallback
            raise RuntimeError(f"{provider} vision extraction failed: {exc}") from exc
        return self._mock()

    def _mock(self) -> VisionExtraction:
        payload = {
            "extracted_text": "Dr. A. Sharma\nDate: 12/05/2026\nRx\nT PCM650 1-0-1 x5d\nPanto 40 1-0-0 x7d\nCet 10 0-0-1 x3d",
            "doctor_name": "Dr. A. Sharma",
            "date": "2026-05-12",
            "language": "en",
            "signature_detected": True,
            "medicines": [
                {"raw_text": "T PCM650 1-0-1 x5d", "confidence": 0.86},
                {"raw_text": "Panto 40 1-0-0 x7d", "confidence": 0.82},
                {"raw_text": "Cet 10 0-0-1 x3d", "confidence": 0.8},
            ],
        }
        return VisionExtraction(extracted_text=payload["extracted_text"], payload=payload)

    async def _openai(self, content: bytes, mime_type: str, language_hint: str | None) -> VisionExtraction:
        settings = get_settings()
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when VISION_PROVIDER=openai")

        image_data = base64.b64encode(content).decode("utf-8")
        body = {
            "model": settings.openai_model,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": build_prompt(language_hint)},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_data}"}},
                    ],
                }
            ],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json=body,
            )
            response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"]
        payload = json.loads(text)
        return VisionExtraction(extracted_text=payload.get("extracted_text", ""), payload=payload)

    async def _gemini(self, content: bytes, mime_type: str, language_hint: str | None) -> VisionExtraction:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when VISION_PROVIDER=gemini")

        image_data = base64.b64encode(content).decode("utf-8")
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": build_prompt(language_hint)},
                        {"inline_data": {"mime_type": mime_type, "data": image_data}},
                    ]
                }
            ],
            "generationConfig": {"response_mime_type": "application/json"},
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, json=body)
            response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        payload = json.loads(text)
        return VisionExtraction(extracted_text=payload.get("extracted_text", ""), payload=payload)
