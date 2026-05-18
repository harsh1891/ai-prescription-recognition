import json
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.prescription import Prescription
from app.models.user import User
from app.routes.dependencies import get_current_user
from app.schemas.prescription import AnalyticsSummary, PrescriptionListItem, PrescriptionResult
from app.services.prescription_service import PrescriptionService


router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])
service = PrescriptionService()


@router.post("/process", response_model=PrescriptionResult)
async def process_prescription(
    file: UploadFile = File(...),
    language_hint: str | None = Query(default=None, pattern="^(en|hi|mr)$"),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
) -> PrescriptionResult:
    if file.content_type not in {"image/png", "image/jpeg", "image/webp", "application/pdf", "image/svg+xml"}:
        raise HTTPException(status_code=415, detail="Upload a PNG, JPG, WEBP, SVG, or PDF prescription")
    return await service.process(file, db, user, language_hint)


@router.get("", response_model=list[PrescriptionListItem])
async def list_prescriptions(
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
) -> list[Prescription]:
    query = select(Prescription).order_by(desc(Prescription.created_at)).limit(50)
    if user:
        query = query.where(Prescription.owner_id == user.id)
    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Prescription.original_filename.ilike(term),
                Prescription.extracted_text.ilike(term),
            )
        )
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/analytics/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
) -> AnalyticsSummary:
    query = select(Prescription)
    if user:
        query = query.where(Prescription.owner_id == user.id)
    result = await db.execute(query)
    rows = list(result.scalars().all())

    total_medicines = 0
    confidence_sum = 0.0
    signatures_detected = 0
    warning_count = 0
    language_counts: dict[str, int] = {}
    for row in rows:
        data = row.structured_data or {}
        medicines = data.get("medicines", [])
        total_medicines += len(medicines)
        confidence_sum += float(data.get("overall_confidence") or 0)
        signatures_detected += 1 if data.get("signature_detected") else 0
        warning_count += len(data.get("warnings", []))
        language = data.get("language") or "unknown"
        language_counts[language] = language_counts.get(language, 0) + 1

    return AnalyticsSummary(
        total_prescriptions=len(rows),
        total_medicines=total_medicines,
        average_confidence=round(confidence_sum / len(rows), 2) if rows else 0.0,
        signatures_detected=signatures_detected,
        warning_count=warning_count,
        language_counts=language_counts,
    )


@router.get("/{prescription_id}", response_model=PrescriptionResult)
async def get_prescription(prescription_id: int, db: AsyncSession = Depends(get_db)) -> PrescriptionResult:
    row = await db.get(Prescription, prescription_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return PrescriptionResult(**row.structured_data)


@router.get("/{prescription_id}/export/json")
async def export_json(prescription_id: int, db: AsyncSession = Depends(get_db)) -> Response:
    row = await db.get(Prescription, prescription_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return Response(
        json.dumps(row.structured_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=prescription-{prescription_id}.json"},
    )


@router.get("/{prescription_id}/export/pdf")
async def export_pdf(prescription_id: int, db: AsyncSession = Depends(get_db)) -> Response:
    row = await db.get(Prescription, prescription_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return Response(
        service.build_pdf(row.structured_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=prescription-{prescription_id}.pdf"},
    )
