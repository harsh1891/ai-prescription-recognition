import csv
from pathlib import Path
from rapidfuzz import fuzz, process
from app.config import get_settings


class MedicineValidator:
    def __init__(self) -> None:
        self.entries = self._load_entries()

    def correct(self, raw_name: str) -> tuple[str, float]:
        cleaned = " ".join(raw_name.replace(".", " ").split())
        if not cleaned:
            return "Unknown medicine", 0.0
        choices = list(self.entries.keys())
        match = process.extractOne(cleaned, choices, scorer=fuzz.WRatio)
        if not match:
            return cleaned, 0.35
        alias, score, _ = match
        canonical = self.entries[alias]
        return canonical, max(score / 100, 0.35)

    def _load_entries(self) -> dict[str, str]:
        settings = get_settings()
        path = self._resolve_dataset_path(settings.medicine_dataset_path, "medicines.csv")

        entries: dict[str, str] = {}
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                canonical = row["canonical_name"].strip()
                entries[canonical] = canonical
                for alias in row.get("aliases", "").split("|"):
                    if alias.strip():
                        entries[alias.strip()] = canonical
        return entries

    def _resolve_dataset_path(self, configured_path: str, filename: str) -> Path:
        candidates = [
            Path(configured_path),
            Path(__file__).resolve().parents[2] / "datasets" / filename,
            Path(__file__).resolve().parents[3] / "datasets" / filename,
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate
        raise FileNotFoundError(f"Could not find dataset file: {filename}")
