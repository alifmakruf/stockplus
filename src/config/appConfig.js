/**
 * Konfigurasi Parameter Aplikasi Stock Plus (Daizy Accessories / iPOS Companion)
 * Ubah nilai di bawah ini untuk menyesuaikan perilaku, batas, dan tampilan aplikasi.
 */

export const APP_META = {
  brandName: 'Stock Plus',
  storeName: 'Daizy Accessories',
  version: '2.0.0',
};

/**
 * Pengaturan jam shift kerja (format 24 jam).
 * Digunakan untuk deteksi shift otomatis saat login dan label export Excel.
 */
export const SHIFTS = {
  pagi: {
    id: 'pagi',
    label: 'Shift Pagi',
    startHour: 7,
    endHour: 14,
  },
  siang: {
    id: 'siang',
    label: 'Shift Siang',
    startHour: 14,
    endHour: 22,
  },
};

/**
 * Batas jam sebelum sistem menampilkan peringatan database iPOS perlu di-update (EXPORT DATA 2).
 */
export const IMPORT_STALE_HOURS = 24;

/**
 * Batas stok minimal untuk filter "Stok Menipis" di halaman Inventori.
 */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Jumlah item per halaman di tabel Inventori.
 * Menjaga performa tetap ringan di HP meskipun database iPOS berisi 3.000+ item.
 */
export const INVENTORY_PAGE_SIZE = 50; // items per page (adjustable for performance)
export const BP_SM = 760; // small breakpoint (mobile) – used for sidebar collapse, table wrap
export const BP_MD = 1100; // medium breakpoint – layout adjustments for tablets
export const BP_XS = 390; // extra‑small breakpoint – very small phones

/**
 * Maksimal jumlah item serupa yang ditampilkan pada peringatan duplikat nama.
 */
export const DUPLICATE_MAX_MATCHES = 5;

/**
 * Parameter tampilan & cetak label barcode Code 128B.
 * - barWidth: ketebalan garis terkecil (px)
 * - barHeight: tinggi batang barcode (px)
 * - quietZone: ruang kosong kiri-kanan (modul)
 * - fontSize: ukuran teks di label (px)
 * - printColumns: jumlah kolom label per baris saat cetak PDF
 */
export const BARCODE_CONFIG = {
  barWidth: 1.6,
  barHeight: 46,
  quietZone: 8,
  fontSize: 11,
  printColumns: 3,
};

/**
 * Default template export iPOS (IMPORT_ITEM_V2.xls -> sheet "DATA ITEM 1 HARGA").
 * Jangan ubah tipeImport ('O') atau headerNotice kecuali format iPOS Anda berubah.
 */
export const IPOS_DEFAULTS = {
  sheetName: 'DATA ITEM 1 HARGA',
  tipeImport: 'O',
  headerNotice: 'Baris Ini Jangan dihapus dan jangan diganti',
  tipeItem: '1',
  satuan: 'PCS',
  gudangKantor: 'UTM',
  menggunakanSerial: 'N',
  konsinyasi: 'N',
  sistemHpp: 'FIFO',
};

/**
 * Pengaturan default yang dapat diubah oleh Admin di halaman Admin.
 */
export const DEFAULT_SETTINGS = {
  driveFolderUrl: '',
  apiEndpoint: '',
  lastImportAt: '',
  lastImportFilename: '',
  lastImportCount: 0,
};

export const STORAGE_KEYS = {
  user: 'sp-user',
  items: 'sp-items',
  batch: 'sp-batch',
  draftForm: 'sp-draft-form',
  history: 'sp-history',
  audit: 'sp-audit',
  settings: 'sp-settings',
  dark: 'sp-dark',
};
