"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanSettings } from "@/lib/types";
import { applyPreviewPipeline } from "@/lib/scanEngine";

interface LivePreviewProps {
  baseCanvas: HTMLCanvasElement | null;
  settings: ScanSettings;
  fileName: string;
  isLoading: boolean;
}

export default function LivePreview({
  baseCanvas,
  settings,
  fileName,
  isLoading,
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
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-ink-line bg-ink-panel/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-paper-bright">
          Pratinjau real-time
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide text-scan">
            halaman 1
          </span>
          {baseCanvas && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-md border border-ink-line px-2 py-0.5 text-[11px] text-paper-dim hover:border-scan/60 hover:text-paper-bright"
            >
              {collapsed ? "Gedein ⌄" : "Kecilin ⌃"}
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex min-w-0 items-center justify-center overflow-hidden rounded-lg bg-ink transition-all duration-200 ${
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
          Dari halaman 1 file &quot;{fileName}&quot; · geser slider di bawah,
          langsung keliatan hasilnya di sini. Kemiringan tiap halaman asli
          tetap diacak pas diproses beneran.
        </p>
      )}
    </div>
  );
}
