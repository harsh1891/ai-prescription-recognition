from datetime import datetime
from pydantic import BaseModel, Field


class Confidence(BaseModel):
    medicine: float = Field(ge=0, le=1)
    dosage: float = Field(ge=0, le=1)
    frequency: float = Field(ge=0, le=1)
    duration: float = Field(ge=0, le=1)


class MedicineEntity(BaseModel):
    raw_text: str
    medicine: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    morning: bool = False
    afternoon: bool = False
    night: bool = False
    confidence: Confidence


class InteractionWarning(BaseModel):
    drugs: list[str]
    severity: str
    message: str


class PrescriptionResult(BaseModel):
    id: int | None = None
    doctor_name: str | None = None
    date: str | None = None
    language: str = "en"
    extracted_text: str
    medicines: list[MedicineEntity]
    warnings: list[InteractionWarning] = []
    signature_detected: bool = False
    overall_confidence: float = Field(ge=0, le=1)


class PrescriptionListItem(BaseModel):
    id: int
    original_filename: str
    status: str
    created_at: datetime
    structured_data: dict

    model_config = {"from_attributes": True}


class AnalyticsSummary(BaseModel):
    total_prescriptions: int
    total_medicines: int
    average_confidence: float
    signatures_detected: int
    warning_count: int
    language_counts: dict[str, int]
