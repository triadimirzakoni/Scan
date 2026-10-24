"use client";

import { useEffect } from "react";

interface PreviewModalProps {
  fileName: string;
  previewUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

export default function PreviewModal({
  fileName,
  previewUrl,
  onClose,
  onDownload,
}: PreviewModalProps) {
  // biar bisa ditutup dengan tombol Escape, dan cegah scroll body di belakang
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${fileName}`}
    >
      <div
        className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-soft shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-scan-glow">Ini preview hasilnya 👀</p>
            <p className="truncate text-sm text-paper-bright">{fileName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-2.5 py-1.5 text-xs text-paper-dim hover:bg-white/10 hover:text-paper-bright"
            >
              Buka tab baru
            </a>
            <button
              onClick={onDownload}
              className="rounded-lg bg-scan px-3 py-1.5 text-xs font-semibold text-ink hover:brightness-110"
            >
              Unduh
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="rounded-lg px-2 py-1.5 text-xs text-paper-dim hover:bg-white/10 hover:text-paper-bright"
            >
              ✕
            </button>
          </div>
        </div>

        <iframe
          src={previewUrl}
          title={`Pratinjau ${fileName}`}
          className="h-full w-full flex-1 bg-paper"
        />
      </div>
    </div>
  );
}
