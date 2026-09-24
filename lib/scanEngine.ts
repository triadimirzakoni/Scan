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
/**
 * Mengecat "alas scanner" di area yang terekspos saat halaman dimiringkan —
 * bukan putih rata, tapi gradasi lembut ala cahaya lid scanner yang tidak
 * merata, plus sedikit noise supaya tidak terlihat digital/flat.
 */
function paintScannerBed(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f6f3ea");
  gradient.addColorStop(0.5, "#efece1");
  gradient.addColorStop(1, "#e6e2d5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // noise dibuat di kanvas kecil lalu di-scale ke ukuran penuh, supaya
  // tidak perlu loop piksel di resolusi tinggi (berat untuk PDF besar)
  const noiseSize = 48;
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = noiseSize;
  noiseCanvas.height = noiseSize;
  const nctx = noiseCanvas.getContext("2d");
  if (nctx) {
    const imgData = nctx.createImageData(noiseSize, noiseSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 60;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 16;
    }
    nctx.putImageData(imgData, 0, 0);
    ctx.drawImage(noiseCanvas, 0, 0, width, height);
  }
}

/**
 * Menggambar bayangan lembut mengikuti bentuk halaman yang dimiringkan,
 * meniru bayangan tipis yang terbentuk karena dokumen fisik sedikit
 * terangkat dari alas scanner.
 */
function paintPageShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  angle: number,
  pageWidth: number,
  pageHeight: number
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.shadowColor = "rgba(30,28,22,0.30)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-pageWidth / 2, -pageHeight / 2, pageWidth, pageHeight);
  ctx.restore();
}

/**
 * Menyusun halaman di atas "alas scanner": menambahkan margin ekstra di
 * satu sisi (kalau diaktifkan) dan/atau memiringkan halaman (kalau
 * skewDeg > 0), lengkap dengan bayangan lembut mengikuti posisi akhirnya.
 * `angleOverride` dipakai pratinjau real-time supaya sudutnya tidak acak
 * tiap kali slider lain digeser.
 */
function composePageBed(
  source: HTMLCanvasElement,
  settings: ScanSettings,
  angleOverride?: number
): HTMLCanvasElement {
  const hasSkew = settings.skewDeg > 0;
  const hasMargin = settings.marginSide !== "none" && settings.marginSize > 0;
  if (!hasSkew && !hasMargin) return source;

  const angle =
    angleOverride !== undefined
      ? angleOverride
      : hasSkew
      ? (Math.random() * 2 - 1) * settings.skewDeg * (Math.PI / 180)
      : 0;

  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) return source;

  paintScannerBed(ctx, out.width, out.height);

  // geser posisi dokumen supaya satu sisi menyisakan ruang kosong ala
  // dokumen yang diletakkan agak menepi di kaca scanner
  let dx = 0;
  let dy = 0;
  if (hasMargin) {
    const insetX = (settings.marginSize / 100) * source.width;
    const insetY = (settings.marginSize / 100) * source.height;
    if (settings.marginSide === "left") dx = insetX;
    if (settings.marginSide === "right") dx = -insetX;
    if (settings.marginSide === "top") dy = insetY;
    if (settings.marginSide === "bottom") dy = -insetY;
  }

  const centerX = out.width / 2 + dx;
  const centerY = out.height / 2 + dy;

  paintPageShadow(ctx, centerX, centerY, angle, source.width, source.height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.restore();

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
  return composePageBed(working, settings, settings.skewDeg * (Math.PI / 180));
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
    const finalCanvas = composePageBed(canvas, settings);

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
