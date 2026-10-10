/**
 * Helper utilitarian untuk mengekspor data laporan menjadi file CSV
 * (dapat dibuka langsung di Microsoft Excel atau Google Sheets).
 *
 * @param {Array<Object>} rows - Baris data yang akan diekspor
 * @param {Array<{key: string, label: string}>} columns - Definisi kolom
 * @param {string} filename - Nama file tanpa ekstensi, mis. 'laporan-cbt'
 */
export function exportToCsv(rows, columns, filename = 'laporan-export') {
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  // Escape nilai agar aman untuk CSV (tanda kutip, koma, baris baru)
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    let str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Prefix =+-@ untuk mencegah formula injection di Excel
    if (/^[=+\-@]/.test(str)) str = `'${str}`;
    if (/[",\n\r]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.map((col) => escapeCell(col.label)).join(',');
  const bodyRows = rows.map((row) =>
    columns.map((col) => {
      // Mendukung akses bersarang sederhana seperti 'user.name'
      const value = col.key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), row);
      return escapeCell(value);
    }).join(','),
  );

  // BOM UTF-8 agar karakter Indonesia (Ã¤ Ã© dll.) tampil benar di Excel Windows
  const csvContent = '\uFEFF' + [headerRow, ...bodyRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
