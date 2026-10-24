/**
 * Helper untuk membaca & menulis rentang halaman, misal "1-3, 5, 8-10".
 */

/** Mengubah teks rentang jadi daftar halaman unik yang terurut. Token tidak valid diabaikan. */
export function parsePageRanges(input: string, maxPage: number): number[] {
  const pages = new Set<number>();

  input
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((token) => {
      const range = token.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (range) {
        let from = parseInt(range[1], 10);
        let to = parseInt(range[2], 10);
        if (from > to) [from, to] = [to, from];
        for (let n = Math.max(1, from); n <= Math.min(maxPage, to); n++) {
          pages.add(n);
        }
        return;
      }
      if (/^\d+$/.test(token)) {
        const n = parseInt(token, 10);
        if (n >= 1 && n <= maxPage) pages.add(n);
      }
    });

  return Array.from(pages).sort((a, b) => a - b);
}

/** Mengubah daftar halaman jadi teks ringkas, misal [1,2,3,5] -> "1-3, 5". */
export function formatPageRanges(pages: number[]): string {
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;

  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i ? `${sorted[i]}-${sorted[j]}` : `${sorted[i]}`);
    i = j + 1;
  }

  return parts.join(", ");
}
