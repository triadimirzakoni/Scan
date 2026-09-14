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
    <div className="sticky bottom-4 z-10 mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft/95 px-5 py-4 shadow-xl backdrop-blur">
      <p className="font-mono text-xs text-paper-dim">
        {doneCount}/{totalFiles} selesai
        {pendingCount > 0 && !isProcessing ? ` · ${pendingCount} menunggu` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onClearAll}
          disabled={isProcessing}
          className="rounded-lg px-3 py-2 text-sm text-paper-dim hover:bg-ink-line hover:text-paper-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bersihkan
        </button>

        {isProcessing ? (
          <button
            onClick={onCancel}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-ink hover:bg-amber/90"
          >
            Batalkan
          </button>
        ) : (
          <button
            onClick={onProcess}
            disabled={pendingCount === 0}
            className="rounded-lg bg-scan px-4 py-2 text-sm font-medium text-ink hover:bg-scan/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proses {pendingCount > 0 ? `(${pendingCount})` : "semua"}
          </button>
        )}

        {doneCount > 1 && (
          <button
            onClick={onDownloadAll}
            className="rounded-lg border border-scan px-4 py-2 text-sm font-medium text-scan hover:bg-scan/10"
          >
            Unduh semua (.zip)
          </button>
        )}
      </div>
    </div>
  );
}
