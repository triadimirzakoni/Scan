import Image from "next/image";

const MASCOT_SRC = "https://files.catbox.moe/knz8i6.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-xl bg-ink-panel ring-1 ring-white/15">
            <Image
              src={MASCOT_SRC}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-paper-bright">
            Tolong Scannin Di!
          </span>
          <span className="hidden rounded-full bg-scan/15 px-2.5 py-0.5 text-[11px] font-medium text-scan-glow sm:inline">
            by Adi
          </span>
        </div>
        <span className="hidden text-xs text-paper-dim sm:inline">
          internal use only
        </span>
      </div>
    </header>
  );
}
