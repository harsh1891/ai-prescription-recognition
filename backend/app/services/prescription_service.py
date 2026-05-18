from io import BytesIO
from fastapi import UploadFile
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.nlp_parser import PrescriptionParser
from app.ai.vision import VisionClient
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionResult


class PrescriptionService:
    def __init__(self) -> None:
        self.vision = VisionClient()
        self.parser = PrescriptionParser()

    async def process(
        self,
        file: UploadFile,
        db: AsyncSession,
        user: User | None,
        language_hint: str | None,
    ) -> PrescriptionResult:
        content = await file.read()
        vision_result = await self.vision.extract(content, file.content_type or "application/octet-stream", language_hint)
        result = self.parser.parse(vision_result.payload, vision_result.extracted_text, language_hint)

        row = Prescription(
            owner_id=user.id if user else None,
            original_filename=file.filename or "upload",
            file_type=file.content_type or "application/octet-stream",
            extracted_text=result.extracted_text,
            structured_data=result.model_dump(),
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
        result.id = row.id
        row.structured_data = result.model_dump()
        await db.commit()
        return result

    def build_pdf(self, data: dict) -> bytes:
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 56
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(48, y, "Prescription Extraction Summary")
        y -= 34
        pdf.setFont("Helvetica", 10)
        pdf.drawString(48, y, f"Doctor: {data.get('doctor_name') or 'Unknown'}")
        y -= 18
        pdf.drawString(48, y, f"Date: {data.get('date') or 'Unknown'}")
        y -= 28
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(48, y, "Medicines")
        y -= 18
        pdf.setFont("Helvetica", 9)
        for item in data.get("medicines", []):
            line = f"- {item.get('medicine')} | {item.get('dosage')} | {item.get('frequency')} | {item.get('duration')}"
            pdf.drawString(56, y, line[:115])
            y -= 16
        y -= 10
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(48, y, "Warnings")
        y -= 18
        pdf.setFont("Helvetica", 9)
        for warning in data.get("warnings", []):
            pdf.drawString(56, y, f"- {warning.get('severity')}: {warning.get('message')}"[:115])
            y -= 16
        pdf.showPage()
        pdf.save()
        return buffer.getvalue()
