/**
 * Konfigurasi popup pengumuman. Popup muncul TIAP KALI halaman dimuat/di-refresh
 * (tidak lagi disimpan "sudah dilihat"), selama belum lewat `endsAt`.
 *
 * - `endsAt`: popup berhenti muncul setelah waktu ini (waktu lokal pengunjung).
 *   Hati-hati: bulan di JavaScript dihitung mulai dari 0, jadi 9 = Oktober.
 */
export const ANNOUNCEMENT = {
  id: "fitur-pilih-halaman-2026-10",
  endsAt: new Date(2026, 9, 27, 23, 59, 59),
};
