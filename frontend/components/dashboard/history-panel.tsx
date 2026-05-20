"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, FileSearch, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPrescriptionHistory } from "@/services/api";
import type { HistoryItem } from "@/types/prescription";
import { compactDateTime } from "@/utils/format";

type HistoryPanelProps = {
  refreshKey: number;
  token?: string | null;
  selectedId?: number | null;
  onSelect?: (result: HistoryItem["structured_data"]) => void;
};

export function HistoryPanel({ refreshKey, token, selectedId, onSelect }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      getPrescriptionHistory(search, token).then(setItems).catch(() => setItems([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, refreshKey, token]);

  const resultLabel = useMemo(() => {
    if (!token) return "Sign in to view your private prescription history.";
    if (!search) return "Latest processed prescriptions from your account.";
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
        {!token ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">No account is signed in.</div>
        ) : items.length ? items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.structured_data)}
            className={`group flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg ${
              isSelected ? "border-primary/60 bg-primary/10 shadow-md" : "bg-background"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border bg-muted/40 text-primary shadow-inner">
                <FileSearch className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.original_filename}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {compactDateTime(item.created_at)}
                </div>
              </div>
            </div>
            <Badge variant="secondary">{item.status}</Badge>
          </button>
        )}) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">No prescriptions processed yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
