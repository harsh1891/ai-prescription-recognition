"use client";

import { useState } from "react";
import { Activity, BrainCircuit, Database, Languages, ShieldCheck } from "lucide-react";
import { HistoryPanel } from "@/components/dashboard/history-panel";
import { ResultPanel } from "@/components/dashboard/result-panel";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PrescriptionResult } from "@/types/prescription";

const capabilities = [
  { label: "VLM OCR", icon: BrainCircuit },
  { label: "Medical NLP", icon: Activity },
  { label: "Interactions", icon: ShieldCheck },
  { label: "PostgreSQL", icon: Database },
  { label: "EN/HI/MR", icon: Languages }
];

export default function Home() {
  const [result, setResult] = useState<PrescriptionResult | null>(null);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge variant="secondary" className="mb-3">Production-grade AI workflow</Badge>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Handwritten Medical Prescription Recognition System
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Upload a prescription, extract structured medicines and schedules, validate names, score confidence, and export a review-ready record.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:w-auto">
              {capabilities.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="space-y-5">
          <UploadPanel onResult={setResult} />
          <HistoryPanel />
        </div>
        <div className="space-y-5">
          <ResultPanel result={result} />
          <Card>
            <CardContent className="grid gap-4 p-5 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <div className="mb-1 font-medium text-foreground">Pipeline</div>
                Vision extraction, NLP parsing, fuzzy correction, confidence scoring, and interaction checks.
              </div>
              <div>
                <div className="mb-1 font-medium text-foreground">Safety</div>
                The UI is built for human verification before medical or pharmacy use.
              </div>
              <div>
                <div className="mb-1 font-medium text-foreground">Deployment</div>
                Frontend targets Vercel. Backend targets Railway or Render with PostgreSQL.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

