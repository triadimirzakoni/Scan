"use client";

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export interface DragControls {
  /** pasang ke elemen yang jadi "pegangan" untuk menarik panel */
  handleProps: HTMLAttributes<HTMLDivElement>;
  /** true kalau panel sedang dilepas dari kolomnya dan melayang bebas */
  isFloating: boolean;
  /** kembalikan panel ke posisi semula (menempel di kolom) */
  dock: () => void;
}

interface FloatState {
  x: number;
  y: number;
  width: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  /** posisi pointer relatif terhadap pojok kiri-atas panel saat mulai ditarik */
  offsetX: number;
  offsetY: number;
  width: number;
  moved: boolean;
}

const MIN_FLOAT_WIDTH = 280;
const MAX_FLOAT_WIDTH = 440;
/**
 * Sisi kiri panel (grip + judul, tempat "memegang") selalu dijaga tetap di
 * layar. Sisi kanan boleh menjorok keluar layar, tapi minimal sebesar ini
 * dari tepi kiri panel harus tetap kelihatan.
 */
const VISIBLE_MARGIN = 96;
const DRAG_THRESHOLD_PX = 4;

function clampPosition(x: number, y: number) {
  return {
    x: Math.min(Math.max(x, 0), Math.max(0, window.innerWidth - VISIBLE_MARGIN)),
    y: Math.min(Math.max(y, 0), Math.max(0, window.innerHeight - 56)),
  };
}

/**
 * Panel yang awalnya menempel (sticky) di kolomnya, tapi bisa ditarik lepas
 * dan digeser bebas ke mana saja. Ringan: hanya mengubah posisi CSS lewat
 * pointer events, tanpa memicu pemrosesan ulang isi panel.
 *
 * Elemen yang sama dipakai di kedua mode (hanya class/style yang berubah),
 * jadi isi panel tidak di-remount dan state-nya (mis. mode kecil/besar)
 * tetap terjaga saat berpindah mode.
 */
export default function DraggablePanel({
  children,
}: {
  children: (controls: DragControls) => ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [float, setFloat] = useState<FloatState | null>(null);

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    document.body.style.userSelect = "";
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // klik tombol di dalam pegangan (mis. "Kecilin") tidak boleh memulai tarikan
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;

    const el = panelRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width =
      float?.width ?? Math.min(Math.max(rect.width, MIN_FLOAT_WIDTH), MAX_FLOAT_WIDTH);
    // kalau lebar berubah saat dilepas, skalakan titik pegangan supaya
    // panel tidak "meloncat" dari bawah kursor
    const ratio = rect.width > 0 ? width / rect.width : 1;

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: (e.clientX - rect.left) * ratio,
      offsetY: e.clientY - rect.top,
      width,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    if (!d.moved) {
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      d.moved = true;
      document.body.style.userSelect = "none";
    }

    const pos = clampPosition(e.clientX - d.offsetX, e.clientY - d.offsetY);
    setFloat({ ...pos, width: d.width });
  };

  // kalau jendela mengecil, pastikan panel yang melayang tidak keluar layar
  useEffect(() => {
    if (!float) return;
    const handleResize = () => {
      setFloat((f) => (f ? { ...f, ...clampPosition(f.x, f.y) } : f));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [float]);

  // pastikan selector teks dikembalikan kalau komponen hilang di tengah tarikan
  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className={
        float
          ? "fixed z-40 min-w-0 rounded-3xl shadow-2xl shadow-black/60"
          : "sticky top-4 z-10 flex min-w-0 flex-col gap-4"
      }
      style={float ? { left: float.x, top: float.y, width: float.width } : undefined}
    >
      {children({
        handleProps: {
          onPointerDown,
          onPointerMove,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
        },
        isFloating: float !== null,
        dock: () => setFloat(null),
      })}
    </div>
  );
}
