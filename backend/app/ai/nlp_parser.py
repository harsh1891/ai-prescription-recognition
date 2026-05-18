import re
from statistics import mean
from app.schemas.prescription import Confidence, MedicineEntity, PrescriptionResult
from app.services.interactions import InteractionService
from app.services.medicine_validator import MedicineValidator


FREQUENCY_RE = re.compile(r"(?P<morning>[01])\s*-\s*(?P<afternoon>[01])\s*-\s*(?P<night>[01])")
DURATION_RE = re.compile(r"x\s*(?P<count>\d+)\s*(?P<unit>d|day|days|wk|week|weeks)?", re.IGNORECASE)
DOSAGE_RE = re.compile(r"(?P<dose>\d{2,4})\s*(?P<unit>mg|mcg|g|ml)?", re.IGNORECASE)


class PrescriptionParser:
    def __init__(self) -> None:
        self.validator = MedicineValidator()
        self.interactions = InteractionService()

    def parse(self, payload: dict, extracted_text: str, language_hint: str | None = None) -> PrescriptionResult:
        lines = self._medicine_lines(payload, extracted_text)
        medicines = [self._parse_line(line) for line in lines]
        warnings = self.interactions.find_warnings([item.medicine for item in medicines])
        scores = [
            mean([item.confidence.medicine, item.confidence.dosage, item.confidence.frequency, item.confidence.duration])
            for item in medicines
        ]
        return PrescriptionResult(
            doctor_name=payload.get("doctor_name") or self._extract_doctor(extracted_text),
            date=payload.get("date") or self._extract_date(extracted_text),
            language=language_hint or payload.get("language") or "en",
            extracted_text=extracted_text,
            medicines=medicines,
            warnings=warnings,
            signature_detected=bool(payload.get("signature_detected", False)),
            overall_confidence=round(mean(scores), 2) if scores else 0.0,
        )

    def _medicine_lines(self, payload: dict, extracted_text: str) -> list[str]:
        from_payload = [item.get("raw_text", "") for item in payload.get("medicines", []) if item.get("raw_text")]
        if from_payload:
            return from_payload
        return [
            line.strip()
            for line in extracted_text.splitlines()
            if re.search(r"\d\s*-\s*\d\s*-\s*\d|x\s*\d+", line, flags=re.IGNORECASE)
        ]

    def _parse_line(self, raw: str) -> MedicineEntity:
        frequency_match = FREQUENCY_RE.search(raw)
        duration_match = DURATION_RE.search(raw)
        dosage_match = DOSAGE_RE.search(raw)
        name_guess = raw
        if frequency_match:
            name_guess = raw[: frequency_match.start()]
        name_guess = re.sub(r"^\s*(tab|tablet|cap|capsule|t)\.?\s+", "", name_guess, flags=re.IGNORECASE).strip()
        corrected, match_score = self.validator.correct(name_guess)

        duration = None
        duration_confidence = 0.45
        if duration_match:
            unit = duration_match.group("unit") or "days"
            normalized_unit = "weeks" if unit.lower().startswith("w") else "days"
            duration = f"{duration_match.group('count')} {normalized_unit}"
            duration_confidence = 0.86

        dosage = None
        dosage_confidence = 0.45
        if dosage_match:
            dosage = f"{dosage_match.group('dose')} {dosage_match.group('unit') or 'mg'}"
            dosage_confidence = 0.78

        morning = afternoon = night = False
        frequency = None
        frequency_confidence = 0.4
        if frequency_match:
            morning = frequency_match.group("morning") == "1"
            afternoon = frequency_match.group("afternoon") == "1"
            night = frequency_match.group("night") == "1"
            frequency = frequency_match.group(0)
            frequency_confidence = 0.9

        return MedicineEntity(
            raw_text=raw,
            medicine=corrected,
            dosage=dosage,
            frequency=frequency,
            duration=duration,
            morning=morning,
            afternoon=afternoon,
            night=night,
            confidence=Confidence(
                medicine=round(match_score, 2),
                dosage=dosage_confidence,
                frequency=frequency_confidence,
                duration=duration_confidence,
            ),
        )

    def _extract_doctor(self, text: str) -> str | None:
        for line in text.splitlines():
            if line.lower().startswith("dr"):
                return line.strip()
        return None

    def _extract_date(self, text: str) -> str | None:
        match = re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", text)
        return match.group(0) if match else None

