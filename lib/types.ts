export type ColorMode = "color" | "grayscale" | "bw";

export type PageFit = "original" | "a4";

export interface ScanSettings {
  /** 0-30, jumlah butiran noise piksel */
  noise: number;
  /** 0-20, seberapa gelap dibanding asli */
  darken: number;
  /** -50 sampai 50, kontras antara area terang & gelap */
  contrast: number;
  /** 0-2, blur lensa halus ala hasil optik scanner */
  blur: number;
  /** 0-40, tint kekuningan ala kertas lama */
  warmth: number;
  /** derajat kemiringan acak maksimum per halaman, 0 = lurus */
  skewDeg: number;
  /** vignette di tepi halaman ala jatuhnya cahaya scanner */
  vignette: boolean;
  colorMode: ColorMode;
  /** 1.5 - 3.0, resolusi render sebelum dikompres */
  renderScale: number;
  /** 0.5 - 0.95 kualitas kompresi JPEG */
  jpegQuality: number;
  pageFit: PageFit;
}

export type PresetName = "rapi" | "klasik" | "hemat" | "superRealistis";

export const PRESETS: Record<PresetName, ScanSettings> = {
  rapi: {
    noise: 6,
    darken: 4,
    contrast: 8,
    blur: 0,
    warmth: 6,
    skewDeg: 0.3,
    vignette: false,
    colorMode: "color",
    renderScale: 2.2,
    jpegQuality: 0.85,
    pageFit: "original",
  },
  klasik: {
    noise: 16,
    darken: 10,
    contrast: 14,
    blur: 0.3,
    warmth: 22,
    skewDeg: 1.1,
    vignette: true,
    colorMode: "grayscale",
    renderScale: 2.0,
    jpegQuality: 0.78,
    pageFit: "original",
  },
  hemat: {
    noise: 8,
    darken: 6,
    contrast: 10,
    blur: 0.2,
    warmth: 4,
    skewDeg: 0,
    vignette: false,
    colorMode: "grayscale",
    renderScale: 1.5,
    jpegQuality: 0.6,
    pageFit: "original",
  },
  superRealistis: {
    noise: 13,
    darken: 8,
    contrast: 22,
    blur: 0.5,
    warmth: 14,
    skewDeg: 0.8,
    vignette: true,
    colorMode: "grayscale",
    renderScale: 2.0,
    jpegQuality: 0.72,
    pageFit: "original",
  },
};

export type FileStatus =
  | "menunggu"
  | "memproses"
  | "selesai"
  | "gagal"
  | "dibatalkan";

export interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  resultBlob?: Blob;
  resultName?: string;
  errorMessage?: string;
}
