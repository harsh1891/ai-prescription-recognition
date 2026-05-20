"use client";

import { useState } from "react";
import { Activity, BrainCircuit, Database, Languages, ShieldCheck, Sparkles } from "lucide-react";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { HistoryPanel } from "@/components/dashboard/history-panel";
import { ResultPanel } from "@/components/dashboard/result-panel";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { PrescriptionResult } from "@/types/prescription";

const capabilities = [
  { label: "VLM OCR", icon: BrainCircuit },
  { label: "Medical NLP", icon: Activity },
  { label: "Interactions", icon: ShieldCheck },
  { label: "PostgreSQL", icon: Database },
  { label: "EN/HI/MR", icon: Languages }
];

export default function Home() {
  const auth = useAuth();
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleResult(nextResult: PrescriptionResult) {
    setResult(nextResult);
    setRefreshKey((value) => value + 1);
  }

  function handleSignOut() {
    auth.signOut();
    setResult(null);
    setRefreshKey((value) => value + 1);
  }

  return (
    <main className="app-shell min-h-screen bg-background">
      <header className="border-b bg-card/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Production-grade AI workflow
                </Badge>
                <ThemeToggle />
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Handwritten Medical Prescription Recognition System
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Upload a prescription, extract structured medicines and schedules, validate names, score confidence, and export a review-ready record.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:w-auto">
              {capabilities.map(({ label, icon: Icon }) => (
                <div key={label} className="depth-chip flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
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
          <AuthPanel
            user={auth.user}
            isLoading={auth.isLoading}
            onSignIn={async (payload) => {
              await auth.signIn(payload);
              setRefreshKey((value) => value + 1);
            }}
            onSignUp={async (payload) => {
              await auth.signUp(payload);
              setRefreshKey((value) => value + 1);
            }}
            onSignOut={handleSignOut}
          />
          <UploadPanel onResult={handleResult} token={auth.token} disabled={!auth.user} />
          <HistoryPanel refreshKey={refreshKey} token={auth.token} selectedId={result?.id ?? null} onSelect={setResult} />
        </div>
        <div className="space-y-5">
          <AnalyticsPanel refreshKey={refreshKey} token={auth.token} />
          <ResultPanel result={result} token={auth.token} />
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
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:px-6 lg:px-8">
        Developed by HARSH AMBADE
      </footer>
    </main>
  );
}
