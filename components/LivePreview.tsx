"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanSettings } from "@/lib/types";
import { applyPreviewPipeline } from "@/lib/scanEngine";
import type { DragControls } from "./DraggablePanel";

interface LivePreviewProps {
  baseCanvas: HTMLCanvasElement | null;
  settings: ScanSettings;
  fileName: string;
  pageNumber: number;
  isLoading: boolean;
  /** kalau diisi, header panel jadi pegangan untuk menggeser panel */
  dragControls?: DragControls;
}

export default function LivePreview({
  baseCanvas,
  settings,
  fileName,
  pageNumber,
  isLoading,
  dragControls,
}: LivePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!baseCanvas || !canvasRef.current) return;

    // dibatasi ke satu render per frame animasi, supaya geseran slider yang
    // cepat tidak membanjiri browser dengan pemrosesan piksel berulang
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const result = applyPreviewPipeline(baseCanvas, settings);
      const out = canvasRef.current;
      if (!out) return;
      out.width = result.width;
      out.height = result.height;
      const ctx = out.getContext("2d");
      ctx?.drawImage(result, 0, 0);
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [baseCanvas, settings]);

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-3xl border border-white/5 p-5 shadow-soft ${
        dragControls?.isFloating ? "bg-ink-soft" : "bg-ink-panel/60"
      }`}
    >
      <div
        {...dragControls?.handleProps}
        title={dragControls ? "Tarik buat mindahin panel" : undefined}
        className={`flex items-center justify-between gap-2 ${
          dragControls ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""
        }`}
      >
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-paper-bright">
          {dragControls && (
            <span aria-hidden="true" className="text-paper-dim">
              ⠿
            </span>
          )}
          Pratinjau real-time
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-scan/15 px-2.5 py-0.5 text-[11px] font-medium text-scan-glow">
            halaman {pageNumber}
          </span>
          {dragControls?.isFloating && (
            <button
              onClick={dragControls.dock}
              className="rounded-lg border border-scan/50 px-2 py-0.5 text-[11px] text-scan-glow hover:bg-scan/10"
            >
              Pasang lagi ⤒
            </button>
          )}
          {baseCanvas && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-lg bg-white/5 px-2.5 py-0.5 text-[11px] text-paper-dim transition-colors hover:bg-white/10 hover:text-paper-bright"
            >
              {collapsed ? "Gedein ⌄" : "Kecilin ⌃"}
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-ink ring-1 ring-white/5 transition-all duration-200 ${
          collapsed ? "h-16" : "min-h-[220px]"
        }`}
      >
        {!baseCanvas && (
          <p className="px-6 py-10 text-center text-sm text-paper-dim">
            {isLoading
              ? "Menyiapkan pratinjau..."
              : "Upload PDF dulu buat lihat gambarannya di sini."}
          </p>
        )}
        <canvas
          ref={canvasRef}
          className={`block max-w-full object-contain ${
            collapsed ? "h-16 w-auto" : "h-auto w-auto max-h-[70vh]"
          } ${baseCanvas ? "" : "hidden"}`}
        />
      </div>

      {baseCanvas && !collapsed && (
        <p className="truncate text-xs text-paper-dim">
          Dari halaman {pageNumber} file &quot;{fileName}&quot; · geser slider di bawah,
          langsung keliatan hasilnya di sini. Kemiringan tiap halaman asli
          tetap diacak pas diproses beneran.
        </p>
      )}
    </div>
  );
}
