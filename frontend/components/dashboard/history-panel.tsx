"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPrescriptionHistory } from "@/services/api";
import type { HistoryItem } from "@/types/prescription";
import { compactDateTime } from "@/utils/format";

export function HistoryPanel({ refreshKey, token }: { refreshKey: number; token?: string | null }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      getPrescriptionHistory(search, token).then(setItems).catch(() => setItems([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, refreshKey, token]);

  const resultLabel = useMemo(() => {
    if (!search) return "Latest processed prescriptions from storage.";
    return `${items.length} result${items.length === 1 ? "" : "s"} for "${search}".`;
  }, [items.length, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>{resultLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctor, medicine, file..." className="pl-9" />
        </div>
        {items.length ? items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.original_filename}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                {compactDateTime(item.created_at)}
              </div>
            </div>
            <Badge variant="secondary">{item.status}</Badge>
          </div>
        )) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">No prescriptions processed yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
