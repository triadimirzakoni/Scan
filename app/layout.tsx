import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tolong Scannin Di! — Digitalisasi dokumen tanpa print & scan",
  description:
    "Alat internal untuk mengubah dokumen digital jadi tampilan hasil scan, langsung di browser. Tanpa print, tanpa mesin scan, tanpa file terkirim ke server.",
  icons: {
    icon: "https://files.catbox.moe/knz8i6.png",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
