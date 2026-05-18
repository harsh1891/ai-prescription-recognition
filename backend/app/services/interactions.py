import csv
from itertools import combinations
from pathlib import Path
from app.config import get_settings
from app.schemas.prescription import InteractionWarning


class InteractionService:
    def __init__(self) -> None:
        self.rules = self._load_rules()

    def find_warnings(self, medicines: list[str]) -> list[InteractionWarning]:
        normalized = {name.lower(): name for name in medicines}
        warnings: list[InteractionWarning] = []
        for left, right in combinations(normalized.keys(), 2):
            key = tuple(sorted([left, right]))
            rule = self.rules.get(key)
            if rule:
                warnings.append(
                    InteractionWarning(
                        drugs=[normalized[left], normalized[right]],
                        severity=rule["severity"],
                        message=rule["message"],
                    )
                )
        return warnings

    def _load_rules(self) -> dict[tuple[str, str], dict[str, str]]:
        settings = get_settings()
        path = self._resolve_dataset_path(settings.interaction_dataset_path, "drug_interactions.csv")

        rules: dict[tuple[str, str], dict[str, str]] = {}
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                key = tuple(sorted([row["drug_a"].lower(), row["drug_b"].lower()]))
                rules[key] = {"severity": row["severity"], "message": row["message"]}
        return rules

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
