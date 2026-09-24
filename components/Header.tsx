import Image from "next/image";

const MASCOT_SRC = "https://files.catbox.moe/knz8i6.png";

export default function Header() {
  return (
    <header className="border-b border-ink-line/60 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-scan/60">
            <Image
              src={MASCOT_SRC}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <span className="font-display text-lg font-medium tracking-tight text-paper-bright">
            Tolong Scannin Di!
          </span>
          <span className="hidden rounded-full border border-ink-line px-2 py-0.5 font-mono text-[10px] text-paper-dim sm:inline">
            by Adi
          </span>
        </div>
        <span className="hidden font-mono text-xs text-paper-dim sm:inline">
          internal use only
        </span>
      </div>
    </header>
  );
}
