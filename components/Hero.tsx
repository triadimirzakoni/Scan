import Mascot from "./Mascot";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ink-soft via-ink to-ink">
      {/* cahaya biru lembut di latar, gantinya garis scanner yang kaku */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-72 w-96 rounded-full bg-scan/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-scan-dim/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-paper-bright sm:text-5xl">
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
