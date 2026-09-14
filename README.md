# Tolong Scannin Di! 📠

Alat internal untuk mengubah dokumen PDF digital jadi tampilan hasil scan
(noise sensor, sedikit kemiringan, tint kertas, dsb) — **tanpa print fisik
dan tanpa mesin scan**. Semua proses berjalan sepenuhnya di browser
(client-side): tidak ada file yang diunggah ke server mana pun, jadi aman
untuk dokumen internal perusahaan.

## Fitur

- Upload banyak PDF sekaligus (drag & drop atau klik)
- 3 preset efek: **Rapi**, **Klasik**, **Hemat Ukuran** — atau atur manual
- Kontrol detail: noise, kegelapan, kehangatan warna, kemiringan halaman,
  resolusi render, kualitas kompresi, mode warna (warna/abu-abu/hitam-putih),
  ukuran halaman (asli/A4)
- Progress per halaman, per file, bisa dibatalkan di tengah proses
- Unduh satu-satu atau semua sekaligus sebagai `.zip`
- 100% client-side (pakai `pdf.js` + `jsPDF` + `JSZip`)

## Menjalankan & mengedit di GitHub Codespaces

1. Push folder ini ke repo GitHub kamu (lihat langkah di bawah).
2. Di halaman repo GitHub, klik **Code → Codespaces → Create codespace on main**.
3. Setelah Codespace terbuka (VS Code di browser), jalankan di terminal:
   ```bash
   npm install
   npm run dev
   ```
4. Codespaces akan menawarkan forward port `3000` — klik notifikasi
   "Open in Browser" untuk melihat hasilnya secara live.
5. Edit file apa pun di `app/`, `components/`, atau `lib/` — perubahan
   otomatis ter-refresh (hot reload).

### Push pertama kali ke GitHub

Kalau folder ini belum jadi repo Git:

```bash
git init
git add .
git commit -m "Tolong Scannin Di! - initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New → Project**.
2. Pilih repo GitHub yang tadi kamu push.
3. Vercel otomatis mendeteksi ini sebagai project Next.js — biarkan semua
   pengaturan default (build command `next build`, output otomatis).
4. Klik **Deploy**. Setelah selesai, kamu dapat URL `*.vercel.app` yang bisa
   dibagikan ke tim internal.
5. Repo yang sama tetap bisa diedit di Codespaces — tiap `git push` ke
   `main` akan otomatis men-trigger deploy baru di Vercel.

> Karena ini untuk pemakaian internal, pertimbangkan mengaktifkan
> **Vercel Authentication / Password Protection** (tersedia di paket Pro
> Vercel, atau taruh di belakang VPN/SSO perusahaan) supaya URL-nya tidak
> bisa diakses publik.

## Struktur proyek

```
app/                 # halaman & layout Next.js (App Router)
  layout.tsx
  page.tsx           # orkestrasi state: antrian file, proses, unduh
  globals.css
components/          # komponen UI (Header, Hero, UploadZone, dst.)
lib/
  types.ts           # tipe data & preset efek
  scanEngine.ts       # inti pemrosesan PDF (render halaman → efek canvas → susun ulang PDF)
```

## Mengganti maskot

Maskot saat ini diambil langsung dari URL eksternal
(`https://files.catbox.moe/knz8i6.png`) di `components/Mascot.tsx` dan
`components/Header.tsx`. Kalau kamu mau maskot disimpan permanen di repo
(disarankan, supaya tidak bergantung pada layanan hosting gambar pihak
ketiga yang bisa hilang sewaktu-waktu):

1. Unduh gambarnya, simpan sebagai `public/mascot.png`.
2. Ganti `MASCOT_SRC` di kedua file tadi menjadi `"/mascot.png"`.

## Catatan teknis

- `pdf.js` di-load lewat dynamic import dan worker-nya diarahkan ke CDN
  (cdnjs) supaya tidak perlu konfigurasi Webpack tambahan untuk membundel
  worker file secara lokal.
- Batas praktis: file PDF sangat besar (ratusan halaman / resolusi tinggi)
  bisa memakan memori browser cukup banyak karena semua rendering terjadi
  di tab browser pengguna, bukan di server.
