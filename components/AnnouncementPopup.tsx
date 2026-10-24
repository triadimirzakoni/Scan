"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ANNOUNCEMENT } from "@/lib/announcement";

const MASCOT_SRC = "https://files.catbox.moe/knz8i6.png";

const STEPS = [
  { icon: "📁", label: "Drop File" },
  { icon: "📑", label: "Pilih Halaman" },
  { icon: "📥", label: "Download & Kelar!" },
];

export default function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Muncul TIAP KALI halaman dimuat / di-refresh, selama periode pengumuman.
  // Dicek di useEffect supaya tidak bentrok dengan render di server.
  useEffect(() => {
    if (Date.now() > ANNOUNCEMENT.endsAt.getTime()) return;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md animate-pop overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-ink-panel to-ink-soft shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* cahaya biru lembut di pojok atas */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-scan/30 blur-3xl"
          aria-hidden="true"
        />

        <button
          onClick={() => setOpen(false)}
          aria-label="Tutup pengumuman"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-white/10 hover:text-paper-bright"
        >
          ✕
        </button>

        <div className="relative flex flex-col gap-5 p-7">
          <div className="flex items-center gap-3.5 pr-6">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-ink/60 ring-1 ring-white/15">
              <Image
                src={MASCOT_SRC}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <span className="inline-block rounded-full bg-scan/15 px-2.5 py-0.5 text-[11px] font-semibold text-scan-glow">
                Fitur baru
              </span>
              <h2
                id="announcement-title"
                className="mt-1 font-display text-lg font-bold leading-snug text-paper-bright"
              >
                ⚡ Scan Sat-Set Tanpa Drama PDF!
              </h2>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-paper-dim">
            Udah nggak zaman potong-gabung halaman manual. Udah 2026, waktunya
            pangkas workflow! 🚫📄
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-scan-glow">
              Workflow Baru (Biar Cepet Pulang/Tidur):
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span className="rounded-xl bg-ink/70 px-3 py-1.5 text-sm text-paper-bright ring-1 ring-white/10">
                    {step.icon} {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="text-scan">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-paper-dim">
            Semangat konsinyeringnya kawan-kawan! Jaga kesehatan, minum vitamin,
            dan jangan lupa makan☕💪
          </p>

          <button
            ref={buttonRef}
            onClick={() => setOpen(false)}
            className="rounded-xl bg-gradient-to-b from-scan-glow to-scan px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 active:scale-[0.98]"
          >
            Siap, gas! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
