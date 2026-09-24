"use client";

import { PRESETS, type PresetName, type ScanSettings } from "@/lib/types";

interface SettingsPanelProps {
  settings: ScanSettings;
  onChange: (next: ScanSettings) => void;
  activePreset: PresetName | "kustom";
  onPresetChange: (preset: PresetName) => void;
  disabled?: boolean;
}

const PRESET_LABELS: Record<PresetName, { title: string; desc: string }> = {
  rapi: { title: "Rapi", desc: "Bersih, noise minim" },
  klasik: { title: "Klasik", desc: "Kertas lama, ada kemiringan" },
  hemat: { title: "Hemat Ukuran", desc: "File sekecil mungkin" },
  superRealistis: { title: "Super Realistis", desc: "Plek ketiplek kayak scan asli" },
};

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  hint,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm text-paper-bright">
        <span>{label}</span>
        <span className="font-mono text-xs text-scan">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-line accent-scan disabled:cursor-not-allowed disabled:opacity-40"
      />
      {hint && <p className="text-[11px] leading-snug text-paper-dim/80">{hint}</p>}
    </label>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
  activePreset,
  onPresetChange,
  disabled,
}: SettingsPanelProps) {
  const update = (patch: Partial<ScanSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-ink-line bg-ink-panel/60 p-5">
      <div>
        <h2 className="font-display text-base text-paper-bright">Pengaturan efek</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(PRESETS) as PresetName[]).map((key) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onPresetChange(key)}
              className={`rounded-lg border px-2 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                activePreset === key
                  ? "border-scan bg-scan/10"
                  : "border-ink-line hover:border-scan/50"
              }`}
            >
              <p className="text-xs font-medium text-paper-bright">
                {PRESET_LABELS[key].title}
              </p>
              <p className="mt-0.5 text-[11px] text-paper-dim">
                {PRESET_LABELS[key].desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-ink-line pt-4">
        <Slider
          label="Butiran noise"
          value={settings.noise}
          min={0}
          max={30}
          onChange={(v) => update({ noise: v })}
          disabled={disabled}
        />
        <Slider
          label="Kegelapan"
          value={settings.darken}
          min={0}
          max={20}
          onChange={(v) => update({ darken: v })}
          disabled={disabled}
        />
        <Slider
          label="Kontras"
          value={settings.contrast}
          min={-50}
          max={50}
          onChange={(v) => update({ contrast: v })}
          disabled={disabled}
        />
        <Slider
          label="Kehangatan kertas"
          value={settings.warmth}
          min={0}
          max={40}
          onChange={(v) => update({ warmth: v })}
          disabled={disabled}
        />
        <Slider
          label="Kemiringan halaman"
          value={settings.skewDeg}
          min={0}
          max={3}
          step={0.1}
          unit="°"
          onChange={(v) => update({ skewDeg: v })}
          disabled={disabled}
        />
        <Slider
          label="Blur lensa"
          value={settings.blur}
          min={0}
          max={2}
          step={0.1}
          unit="px"
          onChange={(v) => update({ blur: v })}
          disabled={disabled}
        />
        <Slider
          label="Resolusi render"
          value={settings.renderScale}
          min={1.2}
          max={3}
          step={0.1}
          unit="x"
          hint="Makin tinggi = hasil makin tajam & detail, tapi ukuran file dan waktu proses ikut naik. 2x udah cukup buat kebanyakan dokumen."
          onChange={(v) => update({ renderScale: v })}
          disabled={disabled}
        />
        <Slider
          label="Kualitas gambar"
          value={Math.round(settings.jpegQuality * 100)}
          min={40}
          max={95}
          unit="%"
          hint="Ini soal kompresi: makin tinggi persennya, gambar makin bagus tapi file makin gede. Makin rendah, file makin kecil tapi ada risiko sedikit pecah/blocky."
          onChange={(v) => update({ jpegQuality: v / 100 })}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-ink-line pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-paper-bright">Mode warna</span>
          <div className="flex gap-1.5">
            {(["color", "grayscale", "bw"] as const).map((mode) => (
              <button
                key={mode}
                disabled={disabled}
                onClick={() => update({ colorMode: mode })}
                className={`rounded-md px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  settings.colorMode === mode
                    ? "bg-scan text-ink"
                    : "bg-ink-line text-paper-dim hover:text-paper-bright"
                }`}
              >
                {mode === "color" ? "Warna" : mode === "grayscale" ? "Abu-abu" : "B/W"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-paper-bright">Ukuran halaman</span>
          <div className="flex gap-1.5">
            {(["original", "a4"] as const).map((fit) => (
              <button
                key={fit}
                disabled={disabled}
                onClick={() => update({ pageFit: fit })}
                className={`rounded-md px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  settings.pageFit === fit
                    ? "bg-scan text-ink"
                    : "bg-ink-line text-paper-dim hover:text-paper-bright"
                }`}
              >
                {fit === "original" ? "Asli" : "A4"}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between">
          <span className="text-sm text-paper-bright">Vignette tepi</span>
          <input
            type="checkbox"
            checked={settings.vignette}
            disabled={disabled}
            onChange={(e) => update({ vignette: e.target.checked })}
            className="h-4 w-4 accent-scan disabled:opacity-40"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-ink-line pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-paper-bright">Margin ekstra</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {(
              [
                ["none", "Tanpa"],
                ["top", "Atas"],
                ["bottom", "Bawah"],
                ["left", "Kiri"],
                ["right", "Kanan"],
              ] as const
            ).map(([side, label]) => (
              <button
                key={side}
                disabled={disabled}
                onClick={() => update({ marginSide: side })}
                className={`rounded-md px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  settings.marginSide === side
                    ? "bg-scan text-ink"
                    : "bg-ink-line text-paper-dim hover:text-paper-bright"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] leading-snug text-paper-dim/80">
          Nyisain sedikit alas scanner di satu sisi, kayak dokumen yang
          diletakkan agak menepi. Bisa dipakai sendiri tanpa perlu
          kemiringan sama sekali.
        </p>

        {settings.marginSide !== "none" && (
          <Slider
            label="Ukuran margin"
            value={settings.marginSize}
            min={1}
            max={15}
            unit="%"
            onChange={(v) => update({ marginSize: v })}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
