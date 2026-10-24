/**
 * Konfigurasi popup pengumuman yang muncul sekali untuk tiap pengunjung baru.
 *
 * - Ganti `id` kalau mau munculin pengumuman BARU ke semua orang lagi
 *   (orang yang sudah lihat pengumuman lama akan dianggap belum lihat).
 * - `endsAt`: popup berhenti muncul setelah waktu ini (waktu lokal pengunjung).
 *   Hati-hati: bulan di JavaScript dihitung mulai dari 0, jadi 9 = Oktober.
 */
export const ANNOUNCEMENT = {
  id: "fitur-pilih-halaman-2026-10",
  endsAt: new Date(2026, 9, 27, 23, 59, 59),
};

export const ANNOUNCEMENT_STORAGE_KEY = `announcement-seen:${ANNOUNCEMENT.id}`;
