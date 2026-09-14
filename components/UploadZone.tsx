"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export default function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const pdfFiles = Array.from(fileList).filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (pdfFiles.length > 0) onFilesAdded(pdfFiles);
    },
    [onFilesAdded]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragOver
          ? "border-scan bg-scan/10"
          : "border-ink-line bg-ink-panel/60 hover:border-scan/60 hover:bg-ink-panel"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <span className="font-mono text-xs uppercase tracking-wide text-scan">
        PDF saja
      </span>
      <p className="font-display text-lg text-paper-bright">
        Seret file ke sini, atau klik untuk pilih
      </p>
      <p className="text-sm text-paper-dim">
        Bisa banyak file sekaligus. File tidak pernah meninggalkan komputer kamu.
      </p>
    </div>
  );
}
