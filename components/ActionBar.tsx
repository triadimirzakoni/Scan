"use client";

interface ActionBarProps {
  totalFiles: number;
  pendingCount: number;
  doneCount: number;
  isProcessing: boolean;
  onProcess: () => void;
  onCancel: () => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
}

export default function ActionBar({
  totalFiles,
  pendingCount,
  doneCount,
  isProcessing,
  onProcess,
  onCancel,
  onDownloadAll,
  onClearAll,
}: ActionBarProps) {
  if (totalFiles === 0) return null;

  return (
    <div className="pointer-events-auto mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-soft/80 px-5 py-3.5 shadow-soft backdrop-blur-xl">
      <p className="tabular text-xs font-medium text-paper-dim">
        {doneCount}/{totalFiles} selesai
        {pendingCount > 0 && !isProcessing ? ` · ${pendingCount} menunggu` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onClearAll}
          disabled={isProcessing}
          className="rounded-xl px-3.5 py-2 text-sm text-paper-dim transition-colors hover:bg-white/10 hover:text-paper-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bersihkan
        </button>

        {isProcessing ? (
          <button
            onClick={onCancel}
            className="rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-[0.98]"
          >
            Batalkan
          </button>
        ) : (
          <button
            onClick={onProcess}
            disabled={pendingCount === 0}
            className="rounded-xl bg-gradient-to-b from-scan-glow to-scan px-5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Proses {pendingCount > 0 ? `(${pendingCount})` : "semua"}
          </button>
        )}

        {doneCount > 1 && (
          <button
            onClick={onDownloadAll}
            className="rounded-xl border border-scan/60 px-4 py-2 text-sm font-semibold text-scan-glow transition-colors hover:bg-scan/10"
          >
            Unduh semua (.zip)
          </button>
        )}
      </div>
    </div>
  );
}
