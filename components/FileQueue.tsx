"use client";

import type { QueuedFile } from "@/lib/types";
import { formatPageRanges } from "@/lib/pageRange";

interface FileQueueProps {
  files: QueuedFile[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onPreview: (id: string) => void;
  onPickPages: (id: string) => void;
  onResetPages: (id: string) => void;
  /** true saat proses berjalan, pilihan halaman dikunci */
  pagesLocked?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<QueuedFile["status"], string> = {
  menunggu: "menunggu",
  memproses: "memproses",
  selesai: "selesai",
  gagal: "gagal",
  dibatalkan: "dibatalkan",
};

const STATUS_COLOR: Record<QueuedFile["status"], string> = {
  menunggu: "text-paper-dim",
  memproses: "text-scan",
  selesai: "text-scan",
  gagal: "text-red-400",
  dibatalkan: "text-amber",
};

export default function FileQueue({
  files,
  onRemove,
  onDownload,
  onPreview,
  onPickPages,
  onResetPages,
  pagesLocked = false,
}: FileQueueProps) {
  if (files.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-line px-4 py-6 text-center text-sm text-paper-dim">
        Belum ada file nih. Antriannya bakal muncul di sini.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((qf) => (
        <li
          key={qf.id}
          className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-ink-panel/60 px-4 py-3.5 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-paper-bright">{qf.file.name}</p>
              <p className="tabular text-xs text-paper-dim">
                {formatSize(qf.file.size)}
                {qf.totalPages ? ` · ${qf.totalPages} hal.` : ""}
                {" · "}
                <span className={STATUS_COLOR[qf.status]}>
                  {STATUS_LABEL[qf.status]}
                  {qf.status === "memproses" && qf.currentPage
                    ? ` (${qf.currentPage}/${qf.totalPages})`
                    : ""}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {qf.status === "selesai" && (
                <>
                  <button
                    onClick={() => onPreview(qf.id)}
                    className="rounded-lg border border-scan/60 px-3 py-1.5 text-xs font-semibold text-scan-glow transition-colors hover:bg-scan/10"
                  >
                    Pratinjau
                  </button>
                  <button
                    onClick={() => onDownload(qf.id)}
                    className="rounded-lg bg-scan px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110"
                  >
                    Unduh
                  </button>
                </>
              )}
              <button
                onClick={() => onRemove(qf.id)}
                aria-label={`Hapus ${qf.file.name} dari antrian`}
                className="rounded-lg px-2 py-1.5 text-xs text-paper-dim transition-colors hover:bg-white/10 hover:text-paper-bright"
              >
                ✕
              </button>
            </div>
          </div>

          {qf.status !== "memproses" && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {qf.pageMode === "selected" ? (
                <>
                  <span className="rounded-full bg-scan/15 px-2.5 py-0.5 text-[11px] font-medium text-scan-glow">
                    Hal. {formatPageRanges(qf.selectedPages)}
                  </span>
                  <button
                    onClick={() => onPickPages(qf.id)}
                    disabled={pagesLocked}
                    className="text-xs text-paper-dim underline-offset-2 hover:text-paper-bright hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => onResetPages(qf.id)}
                    disabled={pagesLocked}
                    className="text-xs text-scan underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Scan semua halaman
                  </button>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-paper-dim">
                    Semua halaman
                  </span>
                  <button
                    onClick={() => onPickPages(qf.id)}
                    disabled={pagesLocked}
                    className="text-xs text-scan underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Pilih halaman
                  </button>
                </>
              )}
            </div>
          )}

          {qf.status === "memproses" && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-scan-dim to-scan-glow transition-all"
                style={{ width: `${qf.progress}%` }}
              />
            </div>
          )}

          {qf.status === "gagal" && qf.errorMessage && (
            <p className="text-xs text-red-400">{qf.errorMessage}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
