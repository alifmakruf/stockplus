import { IPOS_DEFAULTS } from '../config/appConfig.js';
import { dateLabel } from './format.js';

export function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function normalizeNameKey(name) {
  return normalizeName(name).toLowerCase();
}

export function findDuplicateNames(name, items, batch = [], limit = 5) {
  const key = normalizeNameKey(name);
  if (key.length < 3) return [];

  const tokens = key.split(' ').filter((t) => t.length >= 2);
  const pool = [
    ...items.map((it) => ({ ...it, source: 'Database iPOS' })),
    ...batch.map((it) => ({ ...it, source: 'Batch Aktif' })),
  ];

  const exact = [];
  const partial = [];

  for (const item of pool) {
    const itemKey = normalizeNameKey(item.name);
    if (!itemKey) continue;
    if (itemKey === key) {
      exact.push(item);
    } else if (
      itemKey.includes(key) ||
      key.includes(itemKey) ||
      (tokens.length >= 2 && tokens.every((t) => itemKey.includes(t)))
    ) {
      partial.push(item);
    }
  }

  return [...exact, ...partial].slice(0, limit);
}

export function getNextCode(group, items, batch = []) {
  const prefix = String(group || '').trim().toUpperCase();
  if (!prefix) return '';

  let maxNum = 0;
  const all = [...items, ...batch];

  for (const item of all) {
    const code = String(item.code || '').trim().toUpperCase();
    if (!code.startsWith(prefix)) continue;
    const suffix = code.slice(prefix.length);
    if (/^\d+$/.test(suffix)) {
      const n = Number(suffix);
      if (n > maxNum) maxNum = n;
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
}

function normalizeHeader(cell) {
  return String(cell || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');
}

function toNumber(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val || '').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Mem-parse baris 2D dari file EXPORT DATA 2 iPOS (XLS/XLSX/CSV).
 * Baris 1 biasanya "TIPE,J,=> PENTING JANGAN HAPUS BARIS INI",
 * dan baris 2 berisi header (KODEITEM, NAMAITEM, JENIS, MEREK, HARGAPOKOK1, STOKAWAL, dll).
 */
export function parseIposExportRows(rawRows2D) {
  if (!Array.isArray(rawRows2D) || rawRows2D.length === 0) return [];

  let headerIdx = -1;
  const scanLimit = Math.min(rawRows2D.length, 6);

  for (let i = 0; i < scanLimit; i += 1) {
    const row = rawRows2D[i] || [];
    const normalized = row.map(normalizeHeader);
    if (normalized.includes('KODEITEM') || normalized.includes('NAMAITEM')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const headers = (rawRows2D[headerIdx] || []).map(normalizeHeader);
  const idxCode = headers.indexOf('KODEITEM');
  const idxName = headers.indexOf('NAMAITEM');
  const idxGroup = headers.indexOf('JENIS');
  const idxBrand = headers.indexOf('MEREK');
  const idxCost =
    headers.indexOf('HARGAPOKOK1') !== -1
      ? headers.indexOf('HARGAPOKOK1')
      : headers.indexOf('HARGAPOKOK');
  const idxPrice =
    headers.indexOf('HARGAJUAL1') !== -1
      ? headers.indexOf('HARGAJUAL1')
      : headers.indexOf('HARGAJUAL');
  const idxStock =
    headers.indexOf('STOKAWAL') !== -1
      ? headers.indexOf('STOKAWAL')
      : headers.indexOf('STOK');

  const parsed = [];
  for (let r = headerIdx + 1; r < rawRows2D.length; r += 1) {
    const row = rawRows2D[r];
    if (!Array.isArray(row)) continue;

    const code = String(idxCode !== -1 ? row[idxCode] ?? '' : '').trim();
    const name = String(idxName !== -1 ? row[idxName] ?? '' : '').trim();
    if (!code && !name) continue;

    const groupVal = String(idxGroup !== -1 ? row[idxGroup] ?? '' : '').trim() || 'ACC';
    parsed.push({
      code: code || `TMP-${r}`,
      name: name || 'Tanpa Nama',
      group: groupVal,
      type: groupVal,
      brand: String(idxBrand !== -1 ? row[idxBrand] ?? '' : '').trim() || 'NO MERK',
      cost: idxCost !== -1 ? toNumber(row[idxCost]) : 0,
      price: idxPrice !== -1 ? toNumber(row[idxPrice]) : 0,
      stock: idxStock !== -1 ? toNumber(row[idxStock]) : 0,
    });
  }

  return parsed;
}

/**
 * Menggabungkan hasil import EXPORT DATA 2 ke database lokal.
 * Kode yang sudah ada diperbarui field-nya; kode baru ditambahkan.
 * Penambahan stok barang lama tidak dilakukan di sini (aturan iPOS).
 */
export function mergeIposItems(existingItems, importedItems) {
  const byCode = new Map();
  const order = [];

  for (const item of existingItems) {
    const key = String(item.code || '').trim().toUpperCase();
    byCode.set(key, item);
    order.push(key);
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const imp of importedItems) {
    const key = String(imp.code || '').trim().toUpperCase();
    if (!key) continue;

    if (byCode.has(key)) {
      const prev = byCode.get(key);
      byCode.set(key, {
        ...prev,
        name: imp.name || prev.name,
        group: imp.group || prev.group,
        brand: imp.brand || prev.brand,
        cost: imp.cost || prev.cost,
        price: imp.price || prev.price,
        stock: Number.isFinite(imp.stock) ? imp.stock : prev.stock,
      });
      updatedCount += 1;
    } else {
      byCode.set(key, imp);
      order.push(key);
      addedCount += 1;
    }
  }

  return {
    merged: order.map((k) => byCode.get(k)),
    addedCount,
    updatedCount,
  };
}

export async function readIposFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const Papa = (await import('papaparse')).default;
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (res) => resolve(parseIposExportRows(res.data || [])),
        error: reject,
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const rows2D = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
    return parseIposExportRows(rows2D);
  }

  throw new Error('Format file harus .xlsx, .xls, atau .csv (EXPORT DATA 2 iPOS).');
}

export const IPOS_IMPORT_HEADERS = [
  'KODE ITEM',       // 1
  'BARCODE',         // 2
  'NAMA ITEM',       // 3
  'JENIS',           // 4
  'MEREK',           // 5
  'SATUAN',          // 6
  'HARGA POKOK',     // 7
  'HARGA JUAL',      // 8
  'STOK AWAL',       // 9
  'STOK MINIMUM',    // 10
  'TIPE ITEM',       // 11
  'MENGGUNAKAN SERIAL', // 12
  'RAK',             // 13
  'KODE GUDANG -KANTOR', // 14
  'KODE SUPPLIER',   // 15
  'KETERANGAN',      // 16
  'POIN',            // 17
  'KOMISI SALES',    // 18
  'KONSINYASI',      // 19
  'SISTEM HPP',      // 20
  'JENIS PAJAK',     // 21
  'PAJAK INCLUDE (%)', // 22
];

/**
 * Menyusun array 2D untuk sheet "DATA ITEM 1 HARGA" sesuai template IMPORT_ITEM_V2.xls.
 * Urutan kolom WAJIB persis dengan IPOS_IMPORT_HEADERS di atas.
 */
export function buildIposImportSheetRows(batchItems, defaults = IPOS_DEFAULTS) {
  const row1 = [
    'TIPE',
    defaults.tipeImport || 'O',
    defaults.headerNotice || 'Baris Ini Jangan dihapus dan jangan diganti',
  ];

  const dataRows = batchItems.map((item) => {
    const cost  = Number(item.cost  || 0);
    const price = Number(item.price || 0);
    const stock = Number(item.qty ?? item.stock ?? 0);
    const groupVal = item.type || item.group || 'ACC';

    return [
      item.code,                             //  1 KODE ITEM
      item.code,                             //  2 BARCODE (sama dengan kode)
      item.name,                             //  3 NAMA ITEM
      groupVal,                              //  4 JENIS
      item.brand || '',                      //  5 MEREK
      defaults.satuan || 'PCS',             //  6 SATUAN
      cost,                                  //  7 HARGA POKOK
      price,                                 //  8 HARGA JUAL
      stock,                                 //  9 STOK AWAL
      0,                                     // 10 STOK MINIMUM
      defaults.tipeItem || '1',             // 11 TIPE ITEM
      defaults.menggunakanSerial || 'N',    // 12 MENGGUNAKAN SERIAL
      '',                                    // 13 RAK
      defaults.gudangKantor || 'UTM',       // 14 KODE GUDANG -KANTOR
      item.supplier || '',                   // 15 KODE SUPPLIER
      '',                                    // 16 KETERANGAN
      0,                                     // 17 POIN
      0,                                     // 18 KOMISI SALES
      defaults.konsinyasi || 'N',           // 19 KONSINYASI
      defaults.sistemHpp || 'FIFO',         // 20 SISTEM HPP
      '',                                    // 21 JENIS PAJAK
      0,                                     // 22 PAJAK INCLUDE (%)
    ];
  });

  return [row1, IPOS_IMPORT_HEADERS, ...dataRows];
}

export async function downloadIposExcel(batchItems, shiftLabel, defaults = IPOS_DEFAULTS) {
  const XLSX = await import('xlsx');
  const rows2D = buildIposImportSheetRows(batchItems, defaults);
  const ws = XLSX.utils.aoa_to_sheet(rows2D);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, defaults.sheetName || 'DATA ITEM 1 HARGA');

  const safeShift = String(shiftLabel || 'shift').toLowerCase().replace(/\s+/g, '_');
  const filename = `IMPORT_IPOS_${dateLabel()}_${safeShift}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
