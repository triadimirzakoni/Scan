"use client";

import { useEffect, useRef, useState } from "react";
import type { PageMode } from "@/lib/types";
import {
  openPdf,
  renderPdfPageToCanvas,
  type PdfDocumentProxy,
} from "@/lib/scanEngine";
import { formatPageRanges, parsePageRanges } from "@/lib/pageRange";

interface PagePickerModalProps {
  file: File;
  initialMode: PageMode;
  initialPages: number[];
  onConfirm: (mode: PageMode, pages: number[], totalPages: number) => void;
  onClose: () => void;
}

/** Thumbnail satu halaman, baru dirender saat mendekati area yang terlihat. */
function PageThumb({
  pdf,
  pageNumber,
  selected,
  onToggle,
}: {
  pdf: PdfDocumentProxy;
  pageNumber: number;
  selected: boolean;
  onToggle: (n: number) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = btnRef.current;
    if (!el || rendered) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        renderPdfPageToCanvas(pdf, pageNumber, 220)
          .then((src) => {
            const out = canvasRef.current;
            if (cancelled || !out) return;
            out.width = src.width;
            out.height = src.height;
            out.getContext("2d")?.drawImage(src, 0, 0);
            setRendered(true);
          })
          .catch(() => {
            // thumbnail gagal dirender, tidak masalah, tetap bisa dipilih
          });
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdf, pageNumber, rendered]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => onToggle(pageNumber)}
      aria-pressed={selected}
      aria-label={`Halaman ${pageNumber}`}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-ink-panel text-left transition-all ${
        selected
          ? "border-scan shadow-glow"
          : "border-white/10 hover:border-scan/50"
      }`}
    >
      <div className="relative w-full bg-paper">
        {!rendered && <div className="aspect-[3/4] w-full animate-pulse bg-paper-dim/40" />}
        <canvas
          ref={canvasRef}
          className={`h-auto w-full ${rendered ? "block" : "hidden"}`}
        />
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-scan text-xs font-bold text-ink">
            ✓
          </span>
        )}
      </div>
      <span
        className={`tabular px-2 py-1 text-center text-xs font-medium ${
          selected ? "bg-scan/15 text-scan-glow" : "text-paper-dim"
        }`}
      >
        {pageNumber}
      </span>
    </button>
  );
}

export default function PagePickerModal({
  file,
  initialMode,
  initialPages,
  onConfirm,
  onClose,
}: PagePickerModalProps) {
  const [pdf, setPdf] = useState<PdfDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialMode === "selected" ? initialPages : [])
  );
  const [rangeText, setRangeText] = useState(
    initialMode === "selected" ? formatPageRanges(initialPages) : ""
  );

  // buka PDF sekali, tutup lagi saat modal ditutup
  useEffect(() => {
    let cancelled = false;
    let opened: PdfDocumentProxy | null = null;

    openPdf(file)
      .then((doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        opened = doc;
        setPdf(doc);
        setTotalPages(doc.numPages);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      opened?.destroy();
    };
  }, [file]);

  // Escape menutup modal, dan cegah scroll body di belakang
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

  const updateSelection = (next: Set<number>) => {
    setSelected(next);
    setRangeText(formatPageRanges(Array.from(next)));
  };

  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    updateSelection(next);
  };

  const applyRange = () => {
    if (totalPages === 0) return;
    const pages = parsePageRanges(rangeText, totalPages);
    updateSelection(new Set(pages));
  };

  const selectAll = () =>
    updateSelection(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));

  const clearAll = () => updateSelection(new Set());

  const confirmSelected = () => {
    const pages = Array.from(selected).sort((a, b) => a - b);
    if (pages.length === 0) return;
    if (pages.length === totalPages) {
      onConfirm("all", [], totalPages);
    } else {
      onConfirm("selected", pages, totalPages);
    }
  };

  const confirmAll = () => onConfirm("all", [], totalPages);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pilih halaman ${file.name}`}
    >
      <div
        className="flex h-[90vh] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-soft shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-paper-bright">
              Pilih halaman yang mau discan
            </p>
            <p className="truncate text-xs text-paper-dim">
              {file.name}
              {totalPages > 0 ? ` · ${totalPages} halaman` : ""} — halaman yang
              gak dipilih tetap normal kayak aslinya.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-paper-dim hover:bg-white/10 hover:text-paper-bright"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-3.5">
          <input
            type="text"
            value={rangeText}
            onChange={(e) => setRangeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyRange();
            }}
            placeholder="Ketik halaman, contoh: 1-3, 5, 8-10"
            disabled={totalPages === 0}
            aria-label="Rentang halaman"
            className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-ink px-3 py-2 text-xs text-paper-bright placeholder:text-paper-dim/60 focus:border-scan focus:outline-none disabled:opacity-40"
          />
          <button
            onClick={applyRange}
            disabled={totalPages === 0}
            className="rounded-lg border border-scan/60 px-3 py-1.5 text-xs font-semibold text-scan-glow hover:bg-scan/10 disabled:opacity-40"
          >
            Terapkan
          </button>
          <button
            onClick={selectAll}
            disabled={totalPages === 0}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-paper-dim hover:bg-white/10 hover:text-paper-bright disabled:opacity-40"
          >
            Pilih semua
          </button>
          <button
            onClick={clearAll}
            disabled={totalPages === 0}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-paper-dim hover:bg-white/10 hover:text-paper-bright disabled:opacity-40"
          >
            Kosongkan
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loadError && (
            <p className="py-10 text-center text-sm text-red-400">
              Gagal baca PDF-nya. Pastikan filenya gak terkunci password ya.
            </p>
          )}
          {!loadError && !pdf && (
            <p className="py-10 text-center text-sm text-paper-dim">
              Bentar, lagi nyiapin halaman-halamannya...
            </p>
          )}
          {pdf && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <PageThumb
                  key={n}
                  pdf={pdf}
                  pageNumber={n}
                  selected={selected.has(n)}
                  onToggle={toggle}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-3.5">
          <p className="tabular text-xs text-paper-dim">
            {selected.size}
            {totalPages > 0 ? `/${totalPages}` : ""} halaman dipilih
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={confirmAll}
              disabled={totalPages === 0}
              className="rounded-xl border border-scan/60 px-4 py-2 text-sm font-semibold text-scan-glow hover:bg-scan/10 disabled:opacity-40"
            >
              Scan semua halaman
            </button>
            <button
              onClick={confirmSelected}
              disabled={selected.size === 0}
              className="rounded-xl bg-gradient-to-b from-scan-glow to-scan px-5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {selected.size === 0
                ? "Pilih halaman dulu"
                : `Scan ${selected.size} halaman terpilih`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
