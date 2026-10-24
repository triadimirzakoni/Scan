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
import DraggablePanel from "@/components/DraggablePanel";
import PagePickerModal from "@/components/PagePickerModal";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import {
  PRESETS,
  type PageMode,
  type PresetName,
  type QueuedFile,
  type ScanSettings,
} from "@/lib/types";
import { scanPdfFile, renderPageCanvas } from "@/lib/scanEngine";

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
  const [liveBasePage, setLiveBasePage] = useState(1);
  const [liveBaseLoading, setLiveBaseLoading] = useState(false);
  // id file yang sedang dipakai untuk pratinjau real-time, dan penanda
  // permintaan terbaru supaya hasil render yang telat datang diabaikan
  const liveBaseIdRef = useRef<string | null>(null);
  const liveReqRef = useRef(0);

  const [pickerId, setPickerId] = useState<string | null>(null);

  const loadLivePreview = useCallback(
    (file: File, id: string, pageNumber: number) => {
      const token = ++liveReqRef.current;
      liveBaseIdRef.current = id;
      setLiveBaseLoading(true);
      renderPageCanvas(file, pageNumber)
        .then((canvas) => {
          if (token !== liveReqRef.current) return;
          setLiveBaseCanvas(canvas);
          setLiveBaseName(file.name);
          setLiveBasePage(pageNumber);
        })
        .catch(() => {
          // gagal render pratinjau (mis. PDF terkunci password) tidak
          // masalah, proses penuh nanti tetap melapor error sendiri
          if (token === liveReqRef.current) setLiveBaseCanvas(null);
        })
        .finally(() => {
          if (token === liveReqRef.current) setLiveBaseLoading(false);
        });
    },
    []
  );

  const resetLivePreview = () => {
    liveReqRef.current++;
    liveBaseIdRef.current = null;
    setLiveBaseCanvas(null);
    setLiveBaseName("");
    setLiveBasePage(1);
    setLiveBaseLoading(false);
  };

  const firstPageOf = (f: QueuedFile) =>
    f.pageMode === "selected" && f.selectedPages.length > 0 ? f.selectedPages[0] : 1;

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      const entries: QueuedFile[] = newFiles.map((file) => ({
        id: makeId(),
        file,
        pageMode: "all",
        selectedPages: [],
        status: "menunggu",
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...entries]);
      if (!liveBaseIdRef.current && entries[0]) {
        loadLivePreview(entries[0].file, entries[0].id, 1);
      }
    },
    [loadLivePreview]
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
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (id === liveBaseIdRef.current) {
      const next = remaining[0];
      if (next) loadLivePreview(next.file, next.id, firstPageOf(next));
      else resetLivePreview();
    }
  };

  const handleOpenPicker = (id: string) => {
    if (isProcessing) return;
    setPickerId(id);
  };

  /** Simpan pilihan halaman; hasil lama (kalau ada) dibuang karena sudah tidak sesuai. */
  const applySelection = (
    id: string,
    mode: PageMode,
    pages: number[],
    total?: number
  ) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              pageMode: mode,
              selectedPages: mode === "selected" ? pages : [],
              totalPages: total && total > 0 ? total : f.totalPages,
              ...(f.status === "selesai" ||
              f.status === "gagal" ||
              f.status === "dibatalkan"
                ? {
                    status: "menunggu" as const,
                    progress: 0,
                    currentPage: undefined,
                    resultBlob: undefined,
                    resultName: undefined,
                    errorMessage: undefined,
                  }
                : {}),
            }
          : f
      )
    );
    if (target && id === liveBaseIdRef.current) {
      loadLivePreview(target.file, id, mode === "selected" ? pages[0] ?? 1 : 1);
    }
  };

  const handlePickerConfirm = (mode: PageMode, pages: number[], total: number) => {
    if (pickerId) applySelection(pickerId, mode, pages, total);
    setPickerId(null);
  };

  const handleResetPages = (id: string) => {
    if (isProcessing) return;
    applySelection(id, "all", []);
  };

  const handleClearAll = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewId(null);
    setPickerId(null);
    setFiles([]);
    resetLivePreview();
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
        const result = await scanPdfFile(
          target.file,
          settings,
          {
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
          },
          {
            pages:
              target.pageMode === "selected" ? target.selectedPages : undefined,
          }
        );

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
          <FileQueue
            files={files}
            onRemove={handleRemove}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onPickPages={handleOpenPicker}
            onResetPages={handleResetPages}
            pagesLocked={isProcessing}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-4">
          <DraggablePanel>
            {(controls) => (
              <LivePreview
                baseCanvas={liveBaseCanvas}
                settings={settings}
                fileName={liveBaseName}
                pageNumber={liveBasePage}
                isLoading={liveBaseLoading}
                dragControls={controls}
              />
            )}
          </DraggablePanel>
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

      {/* wrapper ini yang sticky, dan harus anak langsung <main> supaya bisa
          menempel di bawah layar selama halaman di-scroll */}
      <div className="pointer-events-none sticky bottom-4 z-20 mt-6 px-6">
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

      {pickerId && files.find((f) => f.id === pickerId) && (
        <PagePickerModal
          file={files.find((f) => f.id === pickerId)!.file}
          initialMode={files.find((f) => f.id === pickerId)!.pageMode}
          initialPages={files.find((f) => f.id === pickerId)!.selectedPages}
          onConfirm={handlePickerConfirm}
          onClose={() => setPickerId(null)}
        />
      )}

      <AnnouncementPopup />

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
