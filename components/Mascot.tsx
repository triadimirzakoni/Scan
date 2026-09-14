"use client";

import Image from "next/image";

const MASCOT_SRC = "https://files.catbox.moe/knz8i6.png";

interface MascotProps {
  message: string;
  size?: number;
  className?: string;
}

export default function Mascot({ message, size = 96, className = "" }: MascotProps) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <div
        className="animate-bob shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
        style={{ width: size, height: size }}
      >
        <Image
          src={MASCOT_SRC}
          alt="Maskot Di, asisten Tolong Scannin Di!"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
          priority
        />
      </div>
      <div className="relative mb-3 max-w-[220px] rounded-2xl rounded-bl-sm bg-paper-bright px-4 py-2.5 text-sm text-ink shadow-lg">
        {message}
      </div>
    </div>
  );
}
