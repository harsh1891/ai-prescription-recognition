import type { AnalyticsSummary, HistoryItem, PrescriptionResult } from "@/types/prescription";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function processPrescription(file: File, languageHint = "en"): Promise<PrescriptionResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/api/prescriptions/process?language_hint=${languageHint}`, {
    method: "POST",
    body: form
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(detail.detail ?? "Upload failed");
  }
  return response.json();
}

export async function getPrescriptionHistory(search = ""): Promise<HistoryItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_URL}/api/prescriptions${query}`, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_URL}/api/prescriptions/analytics/summary`, { cache: "no-store" });
  if (!response.ok) {
    return {
      total_prescriptions: 0,
      total_medicines: 0,
      average_confidence: 0,
      signatures_detected: 0,
      warning_count: 0,
      language_counts: {}
    };
  }
  return response.json();
}

export function exportUrl(id: number, type: "json" | "pdf") {
  return `${API_URL}/api/prescriptions/${id}/export/${type}`;
}
