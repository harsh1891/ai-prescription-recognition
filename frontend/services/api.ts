import type { AnalyticsSummary, HistoryItem, PrescriptionResult } from "@/types/prescription";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UserProfile = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type AuthPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("prescription_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem("prescription_token", token);
  } else {
    window.localStorage.removeItem("prescription_token");
  }
}

function authHeaders(token?: string | null): HeadersInit {
  const activeToken = token ?? getStoredToken();
  return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
}

async function readError(response: Response, fallback: string) {
  const detail = await response.json().catch(() => ({ detail: fallback }));
  return detail.detail ?? fallback;
}

export async function register(payload: Required<AuthPayload>): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await readError(response, "Registration failed"));
  const data = await response.json();
  return data.access_token;
}

export async function login(payload: AuthPayload): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: payload.email, password: payload.password })
  });
  if (!response.ok) throw new Error(await readError(response, "Login failed"));
  const data = await response.json();
  return data.access_token;
}

export async function getMe(token?: string | null): Promise<UserProfile | null> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(token),
    cache: "no-store"
  });
  if (!response.ok) return null;
  return response.json();
}

export async function processPrescription(file: File, languageHint = "en", token?: string | null): Promise<PrescriptionResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}/api/prescriptions/process?language_hint=${languageHint}`, {
    method: "POST",
    headers: authHeaders(token),
    body: form
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Upload failed"));
  }
  return response.json();
}

export async function getPrescriptionHistory(search = "", token?: string | null): Promise<HistoryItem[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_URL}/api/prescriptions${query}`, {
    headers: authHeaders(token),
    cache: "no-store"
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getAnalyticsSummary(token?: string | null): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_URL}/api/prescriptions/analytics/summary`, {
    headers: authHeaders(token),
    cache: "no-store"
  });
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

export async function downloadPrescription(id: number, type: "json" | "pdf", token?: string | null) {
  const response = await fetch(exportUrl(id, type), {
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(await readError(response, "Export failed"));
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `prescription-${id}.${type}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
