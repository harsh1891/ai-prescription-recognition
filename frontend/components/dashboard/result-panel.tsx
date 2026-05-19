"use client";

import { Download, ShieldAlert, Signature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OcrHeatmap } from "@/components/dashboard/ocr-heatmap";
import { Progress } from "@/components/ui/progress";
import { downloadPrescription } from "@/services/api";
import type { PrescriptionResult } from "@/types/prescription";
import { percent } from "@/utils/format";

type ResultPanelProps = {
  result: PrescriptionResult | null;
  token?: string | null;
};

export function ResultPanel({ result, token }: ResultPanelProps) {
  if (!result) {
    return (
      <Card className="min-h-[420px]">
        <CardHeader>
          <CardTitle>Structured Extraction</CardTitle>
          <CardDescription>Results appear here after a prescription is processed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {["Medicine entities", "Dosage and schedule", "Confidence scores", "Drug interaction warnings"].map((item) => (
              <div key={item} className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Structured Extraction</CardTitle>
          <CardDescription>
            {result.doctor_name ?? "Unknown doctor"} {result.date ? `on ${result.date}` : ""}
          </CardDescription>
        </div>
        <Badge variant="secondary">{percent(result.overall_confidence)} confident</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Language" value={result.language.toUpperCase()} />
          <Metric label="Medicines" value={String(result.medicines.length)} />
          <Metric label="Signature" value={result.signature_detected ? "Detected" : "Not found"} icon={<Signature className="h-4 w-4" />} />
        </div>

        <div className="space-y-3">
          {result.medicines.map((medicine, index) => (
            <div key={index} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {/* The exact text from the prescription is now the primary header */}
                  <div className="font-bold text-lg">{medicine.raw_text}</div>
                </div>
                <Badge variant="outline">{medicine.frequency ?? "No schedule"}</Badge>
              </div>
              
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 text-muted-foreground">
                <span>Dosage: {medicine.dosage ?? "Unknown"}</span>
                <span>Duration: {medicine.duration ?? "Unknown"}</span>
                <span>
                  Timing: {[medicine.morning && "Morning", medicine.afternoon && "Afternoon", medicine.night && "Night"].filter(Boolean).join(", ") || "Unknown"}
                </span>
              </div>
              
              {/* Confidence bars remain for system transparency */}
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {Object.entries(medicine.confidence).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{key}</span>
                      <span>{percent(value)}</span>
                    </div>
                    <Progress value={value * 100} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <OcrHeatmap result={result} />

        {/* Warnings Section */}
        {result.warnings.length ? (
          <div className="space-y-2">
            {result.warnings.map((warning, idx) => (
              <div key={idx} className="flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="font-medium capitalize">{warning.severity} interaction</div>
                  <div className="text-muted-foreground">{warning.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {result.id ? (
            <>
              <Button variant="outline" onClick={() => downloadPrescription(result.id!, "json", token)}>
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button variant="outline" onClick={() => downloadPrescription(result.id!, "pdf", token)}>
                <Download className="h-4 w-4" /> PDF
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="font-mono text-xl font-semibold">{value}</div>
    </div>
  );
}