"use client";

import type { PrescriptionResult } from "@/types/prescription";

export function OcrHeatmap({ result }: { result: PrescriptionResult }) {
  const tokens = result.extracted_text.split(/(\s+)/);

  function scoreForToken(token: string) {
    const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleaned) return null;
    for (const medicine of result.medicines) {
      const raw = medicine.raw_text.toLowerCase();
      const name = medicine.medicine.toLowerCase();
      if (raw.includes(cleaned) || name.includes(cleaned)) {
        return Math.max(
          medicine.confidence.medicine,
          medicine.confidence.dosage,
          medicine.confidence.frequency,
          medicine.confidence.duration
        );
      }
    }
    return 0.62;
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">OCR confidence heatmap</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-8 rounded-full bg-destructive/60" />
          Low
          <span className="h-2 w-8 rounded-full bg-primary/80" />
          High
        </div>
      </div>
      <div className="whitespace-pre-wrap rounded-md bg-muted/30 p-3 font-mono text-xs leading-7">
        {tokens.map((token, index) => {
          const score = scoreForToken(token);
          if (score === null || /^\s+$/.test(token)) return token;
          const color = score >= 0.82 ? "bg-primary/25 text-foreground" : score >= 0.65 ? "bg-amber-400/20 text-foreground" : "bg-destructive/20 text-foreground";
          return (
            <span key={`${token}-${index}`} className={`rounded px-1 py-0.5 ${color}`} title={`${Math.round(score * 100)}% confidence`}>
              {token}
            </span>
          );
        })}
      </div>
    </div>
  );
}
