"use client";

import { useCallback, useRef, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UploadZone from "@/components/UploadZone";
import FileQueue from "@/components/FileQueue";
import SettingsPanel from "@/components/SettingsPanel";
import ActionBar from "@/components/ActionBar";
import Footer from "@/components/Footer";
import Mascot from "@/components/Mascot";
import PreviewModal from "@/components/PreviewModal";
import LivePreview from "@/components/LivePreview";
import { PRESETS, type PresetName, type QueuedFile, type ScanSettings } from "@/lib/types";
import { scanPdfFile, renderFirstPageCanvas } from "@/lib/scanEngine";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function statusMessage(files: QueuedFile[], isProcessing: boolean): string {
  if (files.length === 0) return "Upload sini aja mas/mba, biar aku yang scannin 🙏";
  if (isProcessing) {
    const current = files.find((f) => f.status === "memproses");
    if (current) return `Bentar ya, lagi scannin "${current.file.name}"...`;
    return "Proses jalan, santuy dulu~";
  }
  const failed = files.filter((f) => f.status === "gagal").length;
  const done = files.filter((f) => f.status === "selesai").length;
  if (failed > 0) return `Waduh, ${failed} file gagal nih. Coba cek lagi ya.`;
  if (done === files.length && done > 0) return "Kelar semua! Tinggal diunduh~ 🎉";
  return "Siap gas kapan aja.";
}

export default function Home() {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [settings, setSettings] = useState<ScanSettings>(PRESETS.rapi);
  const [activePreset, setActivePreset] = useState<PresetName | "kustom">("rapi");
  const [isProcessing, setIsProcessing] = useState(false);
  const cancelRef = useRef(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [liveBaseCanvas, setLiveBaseCanvas] = useState<HTMLCanvasElement | null>(null);
  const [liveBaseName, setLiveBaseName] = useState("");
  const [liveBaseLoading, setLiveBaseLoading] = useState(false);

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      setFiles((prev) => {
        const wasEmpty = prev.length === 0;
        if (wasEmpty && newFiles[0]) {
          setLiveBaseLoading(true);
          renderFirstPageCanvas(newFiles[0])
            .then((canvas) => {
              setLiveBaseCanvas(canvas);
              setLiveBaseName(newFiles[0].name);
            })
            .catch(() => {
              // gagal render pratinjau (mis. PDF terkunci password) tidak
              // masalah, cukup diamkan, proses penuh nanti tetap melapor error
            })
            .finally(() => setLiveBaseLoading(false));
        }
        return [
          ...prev,
          ...newFiles.map((file) => ({
            id: makeId(),
            file,
            status: "menunggu" as const,
            progress: 0,
          })),
        ];
      });
    },
    []
  );

  const handleSettingsChange = (next: ScanSettings) => {
    setSettings(next);
    setActivePreset("kustom");
  };

  const handlePresetChange = (preset: PresetName) => {
    setSettings(PRESETS[preset]);
    setActivePreset(preset);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewId(null);
    setFiles([]);
    setLiveBaseCanvas(null);
    setLiveBaseName("");
  };

  const handleDownload = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target?.resultBlob) return;
    const url = URL.createObjectURL(target.resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = target.resultName ?? `scan_${target.file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target?.resultBlob) return;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(target.resultBlob);
    setPreviewId(id);
  };

  const handleClosePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewId(null);
  };

  const handleDownloadAll = async () => {
    const done = files.filter((f) => f.status === "selesai" && f.resultBlob);
    if (done.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    done.forEach((f) => {
      zip.file(f.resultName ?? `scan_${f.file.name}`, f.resultBlob as Blob);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tolong-scannin-di-hasil.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    cancelRef.current = false;

    const pendingIds = files
      .filter((f) => f.status === "menunggu" || f.status === "gagal")
      .map((f) => f.id);

    for (const id of pendingIds) {
      if (cancelRef.current) {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "dibatalkan" } : f))
        );
        continue;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "memproses", progress: 0 } : f))
      );

      const target = files.find((f) => f.id === id);
      if (!target) continue;

      try {
        const result = await scanPdfFile(target.file, settings, {
          shouldCancel: () => cancelRef.current,
          onPageProgress: (current, total) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? {
                      ...f,
                      currentPage: current,
                      totalPages: total,
                      progress: Math.round((current / total) * 100),
                    }
                  : f
              )
            );
          },
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "selesai",
                  progress: 100,
                  resultBlob: result.blob,
                  resultName: `scan_${target.file.name}`,
                }
              : f
          )
        );
      } catch (err) {
        const isCancel = err instanceof DOMException && err.name === "AbortError";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: isCancel ? "dibatalkan" : "gagal",
                  errorMessage: isCancel
                    ? undefined
                    : "Gagal memproses. Pastikan PDF tidak terkunci password.",
                }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const pendingCount = files.filter(
    (f) => f.status === "menunggu" || f.status === "gagal"
  ).length;
  const doneCount = files.filter((f) => f.status === "selesai").length;

  return (
    <main className="min-h-screen bg-ink">
      <Header />
      <Hero />

      <div className="mx-auto grid max-w-5xl items-start gap-6 px-6 py-10 md:grid-cols-[1.3fr_1fr]">
        <section className="flex min-w-0 flex-col gap-4">
          <UploadZone onFilesAdded={handleFilesAdded} />
          <FileQueue files={files} onRemove={handleRemove} onDownload={handleDownload} onPreview={handlePreview} />
        </section>

        <section className="flex min-w-0 flex-col gap-4">
          <div className="sticky top-4 z-10 flex min-w-0 flex-col gap-4">
            <LivePreview
              baseCanvas={liveBaseCanvas}
              settings={settings}
              fileName={liveBaseName}
              isLoading={liveBaseLoading}
            />
          </div>
          <SettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
            activePreset={activePreset}
            onPresetChange={handlePresetChange}
            disabled={isProcessing}
          />
          {files.length > 0 && (
            <Mascot message={statusMessage(files, isProcessing)} size={72} />
          )}
        </section>
      </div>

      <div className="px-6">
        <ActionBar
          totalFiles={files.length}
          pendingCount={pendingCount}
          doneCount={doneCount}
          isProcessing={isProcessing}
          onProcess={handleProcess}
          onCancel={handleCancel}
          onDownloadAll={handleDownloadAll}
          onClearAll={handleClearAll}
        />
      </div>

      <Footer />

      {previewId && previewUrlRef.current && (
        <PreviewModal
          fileName={files.find((f) => f.id === previewId)?.resultName ?? "hasil.pdf"}
          previewUrl={previewUrlRef.current}
          onClose={handleClosePreview}
          onDownload={() => {
            handleDownload(previewId);
          }}
        />
      )}
    </main>
  );
}
