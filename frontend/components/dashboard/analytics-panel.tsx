"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, FileText, Signature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/services/api";
import type { AnalyticsSummary } from "@/types/prescription";
import { percent } from "@/utils/format";

const emptySummary: AnalyticsSummary = {
  total_prescriptions: 0,
  total_medicines: 0,
  average_confidence: 0,
  signatures_detected: 0,
  warning_count: 0,
  language_counts: {}
};

export function AnalyticsPanel({ refreshKey, token }: { refreshKey: number; token?: string | null }) {
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);

  useEffect(() => {
    getAnalyticsSummary(token).then(setSummary).catch(() => setSummary(emptySummary));
  }, [refreshKey, token]);

  const languageText = Object.entries(summary.language_counts)
    .map(([language, count]) => `${language.toUpperCase()} ${count}`)
    .join(" / ") || "No data";

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Metric icon={<FileText className="h-4 w-4" />} label="Prescriptions" value={String(summary.total_prescriptions)} />
      <Metric icon={<Activity className="h-4 w-4" />} label="Avg confidence" value={percent(summary.average_confidence)} />
      <Metric icon={<Signature className="h-4 w-4" />} label="Signatures" value={String(summary.signatures_detected)} />
      <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Warnings" value={String(summary.warning_count)} detail={languageText} />
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="font-mono text-2xl font-semibold">{value}</div>
        {detail ? <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div> : null}
      </CardContent>
    </Card>
  );
}
