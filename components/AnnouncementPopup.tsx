"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ANNOUNCEMENT, ANNOUNCEMENT_STORAGE_KEY } from "@/lib/announcement";

const MASCOT_SRC = "https://files.catbox.moe/knz8i6.png";

const STEPS = [
  { icon: "📁", label: "Drop File" },
  { icon: "📑", label: "Pilih Halaman" },
  { icon: "📥", label: "Download & Kelar!" },
];

export default function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Muncul sekali per pengunjung (per browser), hanya selama periode pengumuman.
  // Dicek di useEffect supaya tidak bentrok dengan render di server.
  useEffect(() => {
    if (Date.now() > ANNOUNCEMENT.endsAt.getTime()) return;

    try {
      if (localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY)) return;
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, "1");
    } catch {
      // localStorage tidak tersedia (mis. mode privat ketat), tetap tampilkan
    }
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink-line bg-ink-soft shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* garis cahaya scanner di tepi atas, senada dengan hero */}
        <div className="h-1 w-full bg-gradient-to-r from-scan/0 via-scan to-scan/0" aria-hidden="true" />

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-scan/60">
              <Image
                src={MASCOT_SRC}
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <h2
              id="announcement-title"
              className="font-display text-lg font-medium leading-snug text-paper-bright"
            >
              ⚡ Fitur Baru Alert: Scan Sat-Set Tanpa Drama PDF!
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-paper-dim">
            Udah nggak zaman potong-gabung halaman manual. Udah 2026, waktunya
            pangkas workflow! 🚫📄
          </p>

          <div className="rounded-xl border border-ink-line bg-ink-panel/60 p-4">
            <p className="text-xs font-medium text-scan">
              Workflow Baru (Biar Cepet Pulang/Tidur):
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span className="rounded-lg bg-ink px-2.5 py-1.5 text-sm text-paper-bright">
                    {step.icon} {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="text-paper-dim">
                      ➡️
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
            className="rounded-lg bg-scan px-4 py-2.5 text-sm font-medium text-ink hover:bg-scan/90"
          >
            Siap, gas! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
