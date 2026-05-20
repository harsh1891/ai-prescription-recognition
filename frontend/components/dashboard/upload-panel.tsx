"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Languages, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilePreview } from "@/hooks/use-file-preview";
import { processPrescription } from "@/services/api";
import type { PrescriptionResult } from "@/types/prescription";

type UploadPanelProps = {
  onResult: (result: PrescriptionResult) => void;
  token?: string | null;
  disabled?: boolean;
};

export function UploadPanel({ onResult, token, disabled = false }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");

  const previewUrl = useFilePreview(file);

  async function submit() {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processPrescription(file, language, token);
      onResult(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  }

  function pickFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Prescription Upload</CardTitle>
        <CardDescription>PNG, JPG, WEBP, or PDF. Gemini/OpenAI mode works when API keys are configured.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-medium" htmlFor="language">
            <Languages className="h-4 w-4 text-primary" />
            Prescription language
          </label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!disabled) pickFile(event.dataTransfer.files[0]);
          }}
          disabled={disabled}
          className={`flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <UploadCloud className="h-10 w-10 text-primary" />
          <span className="text-sm font-medium">Drop prescription here or click to browse</span>
          <span className="text-xs text-muted-foreground">Messy handwriting, scanned images, and PDF uploads are supported.</span>
        </button>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />

        {file ? (
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {file.type === "application/pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                <span className="truncate text-sm font-medium">{file.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewUrl ? (
              <img src={previewUrl} alt="Prescription preview" className="max-h-72 w-full rounded-md object-contain" />
            ) : (
              <div className="flex h-36 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">PDF ready for processing</div>
            )}
          </div>
        ) : null}

        {disabled ? <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">Sign in to upload and save prescriptions to your account.</div> : null}
        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div> : null}

        <Button className="w-full" disabled={!file || isProcessing || disabled} onClick={submit}>
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {isProcessing ? "Processing prescription" : "Extract prescription"}
        </Button>
      </CardContent>
    </Card>
  );
}
