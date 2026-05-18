"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrescriptionHistory } from "@/services/api";
import type { HistoryItem } from "@/types/prescription";
import { compactDateTime } from "@/utils/format";

export function HistoryPanel() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getPrescriptionHistory().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>Latest processed prescriptions from PostgreSQL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
