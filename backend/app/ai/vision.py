import base64
import json
import asyncio
import httpx
from dataclasses import dataclass
from typing import Any, Optional
from app.config import get_settings

def build_prompt(language_hint: Optional[str] = None) -> str:
    """Strictly enforces raw text extraction for medical prescriptions."""
    return (
        "You are a medical scribe. Extract data from the prescription image as JSON.\n"
        "1. MANDATORY: The 'medicine' field MUST contain the EXACT handwritten text from the image. "
        "Do not interpret, correct, or infer spelling in this field.\n"
        "2. REQUIRED FIELDS: patient_name, doctor_name, date, medicines (list of objects: medicine, dosage, frequency, duration).\n"
        "3. Focus on accurate, verbatim extraction of handwritten notes."
    )

@dataclass
class VisionExtraction:
    extracted_text: str
    payload: dict[str, Any]

class VisionClient:
    def _raise_for_status(self, response: httpx.Response) -> None:
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"provider returned {response.status_code}: {response.text[:500]}") from exc

    async def _gemini(self, content: bytes, mime_type: str, language_hint: Optional[str]) -> VisionExtraction:
        settings = get_settings()
        image_data = base64.b64encode(content).decode("utf-8")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        
        body = {
            "contents": [{"parts": [{"text": build_prompt(language_hint)}, {"inline_data": {"mime_type": mime_type, "data": image_data}}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        # RETRY LOGIC for 503 errors
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(url, json=body)
                    if response.status_code == 503 and attempt < 2:
                        await asyncio.sleep(2 * (attempt + 1))
                        continue
                    self._raise_for_status(response)
                    text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                    payload = json.loads(text)
                    return VisionExtraction(extracted_text=payload.get("extracted_text", ""), payload=payload)
            except Exception as e:
                if attempt == 2: raise e
                await asyncio.sleep(2)

    async def _openai(self, content: bytes, mime_type: str, language_hint: Optional[str]) -> VisionExtraction:
        settings = get_settings()
        image_data = base64.b64encode(content).decode("utf-8")
        body = {
            "model": settings.openai_model,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": build_prompt(language_hint)},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_data}"}}
            ]}]
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"}, json=body)
            self._raise_for_status(response)
            payload = json.loads(response.json()["choices"][0]["message"]["content"])
            return VisionExtraction(extracted_text=payload.get("extracted_text", ""), payload=payload)

    async def _mock(self, language_hint: Optional[str]) -> VisionExtraction:
        payload = {
            "doctor_name": "Dr. Demo",
            "date": "2026-05-20",
            "language": language_hint or "en",
            "medicines": [
                {
                    "raw_text": "Tab Paracetamol 500 mg BD x 3 days",
                    "medicine": "Paracetamol",
                    "dosage": "500 mg",
                    "frequency": "BD",
                    "duration": "3 days",
                    "confidence": 0.95,
                }
            ],
            "signature_detected": True,
            "extracted_text": "Dr. Demo\nTab Paracetamol 500 mg BD x 3 days",
        }
        return VisionExtraction(extracted_text=payload["extracted_text"], payload=payload)

    async def extract(self, content: bytes, mime_type: str, language_hint: str | None = None) -> VisionExtraction:
        settings = get_settings()
        provider = settings.vision_provider.lower()
        if provider == "gemini": return await self._gemini(content, mime_type, language_hint)
        if provider == "openai": return await self._openai(content, mime_type, language_hint)
        if provider == "mock": return await self._mock(language_hint)
        raise RuntimeError(f"Unknown provider: {provider}")
