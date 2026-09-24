import Mascot from "./Mascot";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-line/60 bg-gradient-to-b from-ink-soft to-ink">
      {/* garis cahaya scanner yang menyapu, satu momen animasi yang disengaja */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-scan/25 via-scan/5 to-transparent animate-scanline"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-medium leading-tight text-paper-bright sm:text-4xl">
            Upload sini aja mas/mba, biar aku yang scannin 🙏
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-paper-dim">
            Dokumen digital disulap jadi kayak abis discan — gausah ngeprint,
            gausah antre ke mesin fotokopi. Semua kelar di browser kamu, gak
            ada file yang kekirim ke server manapun. Aman, santuy aja.
          </p>
        </div>

        <Mascot message="Taruh PDF-nya sini, biar aku yang scannin~" />
      </div>
    </section>
  );
}
