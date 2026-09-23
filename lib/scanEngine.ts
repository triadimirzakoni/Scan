"use client";

import type { ScanSettings } from "./types";

// pdf.js dan jsPDF hanya boleh jalan di browser (butuh Canvas/DOM),
// jadi selalu di-import secara dinamis dari komponen client, dan
// worker-nya kita arahkan ke CDN supaya tidak perlu konfigurasi
// webpack tambahan untuk ikut membundel worker file.
const PDFJS_VERSION = "3.11.174";

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

export interface ProcessCallbacks {
  onPageProgress?: (currentPage: number, totalPages: number) => void;
  /** dipanggil sebelum tiap halaman dirender, return true untuk membatalkan */
  shouldCancel?: () => boolean;
}

/**
 * Menerapkan efek "hasil scan" ke satu canvas: noise sensor, penggelapan
 * ringan, tint kehangatan kertas, opsi grayscale/B&W, dan vignette tepi.
 */
export function applyScanEffect(
  canvas: HTMLCanvasElement,
  settings: ScanSettings
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const noiseAmp = settings.noise;
  const darken = settings.darken;
  const warmth = settings.warmth;
  const mode = settings.colorMode;

  // formula kontras standar: memetakan nilai piksel di sekitar titik
  // tengah (128) supaya area terang/gelap makin terpisah jelas
  const contrastFactor =
    (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (mode === "grayscale" || mode === "bw") {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    }

    if (mode === "bw") {
      const threshold = 150;
      const v = r > threshold ? 255 : 0;
      r = g = b = v;
    } else {
      // noise sensor acak per piksel
      if (noiseAmp > 0) {
        const noise = (Math.random() - 0.5) * noiseAmp;
        r += noise;
        g += noise;
        b += noise;
      }

      // tint kehangatan kertas lama: menambah merah/kuning, mengurangi biru
      if (warmth > 0) {
        r += warmth * 0.5;
        g += warmth * 0.28;
        b -= warmth * 0.35;
      }

      r -= darken;
      g -= darken;
      b -= darken;

      if (settings.contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);

  if (settings.vignette && mode !== "bw") {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.16)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Memberi blur sangat halus untuk meniru ketidaktajaman optik lensa/sensor
 * scanner asli (dokumen digital biasanya terlalu tajam untuk terlihat
 * seperti hasil scan fisik).
 */
export function applyLensBlur(canvas: HTMLCanvasElement, blurPx: number): void {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tempCtx = temp.getContext("2d");
  const ctx = canvas.getContext("2d");
  if (!tempCtx || !ctx) return;

  tempCtx.drawImage(canvas, 0, 0);
  ctx.filter = `blur(${blurPx}px)`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0);
  ctx.filter = "none";
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, v));
}

/**
 * Menggambar sebuah canvas sumber ke canvas tujuan dengan kemiringan
 * acak ringan, mengisi latar dengan warna kertas supaya sudut yang
 * terekspos akibat rotasi tidak transparan/hitam.
 */
function drawWithSkew(
  source: HTMLCanvasElement,
  skewDeg: number
): HTMLCanvasElement {
  if (skewDeg <= 0) return source;

  const angle = (Math.random() * 2 - 1) * skewDeg * (Math.PI / 180);
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return source;

  ctx.fillStyle = "#f5f2e9";
  ctx.fillRect(0, 0, out.width, out.height);

  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(angle);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return out;
}

/**
 * Versi skew yang deterministik (bukan acak) khusus untuk pratinjau
 * real-time, supaya gambar tidak "meloncat" tiap kali user menggeser
 * slider yang tidak berkaitan dengan kemiringan.
 */
function applyFixedSkew(
  source: HTMLCanvasElement,
  skewDeg: number
): HTMLCanvasElement {
  if (skewDeg <= 0) return source;

  const angle = skewDeg * (Math.PI / 180);
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return source;

  ctx.fillStyle = "#f5f2e9";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(angle);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return out;
}

/**
 * Merender HANYA halaman pertama sebuah PDF ke canvas mentah (belum diberi
 * efek apa pun), dibatasi lebar maksimum supaya cepat dipakai untuk
 * pratinjau real-time. Tidak menyentuh sisa halaman sama sekali.
 */
export async function renderFirstPageCanvas(
  file: File,
  maxWidth = 640
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = Math.min(2, maxWidth / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Menjalankan pipeline efek yang sama seperti hasil akhir (blur → noise/
 * kontras/warna → skew), tapi terhadap SALINAN canvas dasar, dan dengan
 * skew deterministik. Dipakai untuk pratinjau real-time saat slider
 * digeser, tanpa memproses ulang seluruh PDF.
 */
export function applyPreviewPipeline(
  baseCanvas: HTMLCanvasElement,
  settings: ScanSettings
): HTMLCanvasElement {
  const working = document.createElement("canvas");
  working.width = baseCanvas.width;
  working.height = baseCanvas.height;
  const ctx = working.getContext("2d");
  ctx?.drawImage(baseCanvas, 0, 0);

  if (settings.blur > 0) {
    applyLensBlur(working, settings.blur);
  }
  applyScanEffect(working, settings);
  return applyFixedSkew(working, settings.skewDeg);
}

export interface ScanResult {
  blob: Blob;
  pageCount: number;
}

/**
 * Memproses satu file PDF: render tiap halaman ke canvas, terapkan efek
 * scan, lalu susun ulang jadi PDF baru berbasis gambar.
 */
export async function scanPdfFile(
  file: File,
  settings: ScanSettings,
  callbacks: ProcessCallbacks = {}
): Promise<ScanResult> {
  const pdfjsLib = await getPdfjs();
  const { jsPDF } = await import("jspdf");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  let outPdf: InstanceType<typeof jsPDF> | null = null;

  const A4_PT: [number, number] = [595.28, 841.89];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (callbacks.shouldCancel?.()) {
      throw new DOMException("Dibatalkan pengguna", "AbortError");
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: settings.renderScale });
    const originalViewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

    await page.render({ canvasContext: ctx, viewport }).promise;

    if (settings.blur > 0) {
      applyLensBlur(canvas, settings.blur);
    }

    applyScanEffect(canvas, settings);
    const finalCanvas = drawWithSkew(canvas, settings.skewDeg);

    const imgData = finalCanvas.toDataURL(
      "image/jpeg",
      settings.jpegQuality
    );

    let pageWidth = originalViewport.width;
    let pageHeight = originalViewport.height;
    let orientation: "portrait" | "landscape" =
      pageWidth > pageHeight ? "landscape" : "portrait";

    if (settings.pageFit === "a4") {
      [pageWidth, pageHeight] =
        orientation === "landscape" ? [A4_PT[1], A4_PT[0]] : A4_PT;
    }

    if (pageNum === 1) {
      outPdf = new jsPDF({
        orientation,
        unit: "pt",
        format: [pageWidth, pageHeight],
      });
    } else {
      outPdf!.addPage([pageWidth, pageHeight], orientation);
    }

    if (settings.pageFit === "a4") {
      // muat gambar secara proporsional di tengah halaman A4
      const scale = Math.min(
        pageWidth / originalViewport.width,
        pageHeight / originalViewport.height
      );
      const drawW = originalViewport.width * scale;
      const drawH = originalViewport.height * scale;
      const offsetX = (pageWidth - drawW) / 2;
      const offsetY = (pageHeight - drawH) / 2;
      outPdf!.setFillColor(245, 242, 233);
      outPdf!.rect(0, 0, pageWidth, pageHeight, "F");
      outPdf!.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
    } else {
      outPdf!.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
    }

    callbacks.onPageProgress?.(pageNum, totalPages);
  }

  if (!outPdf) throw new Error("PDF tidak memiliki halaman");

  const blob = outPdf.output("blob");
  return { blob, pageCount: totalPages };
}
