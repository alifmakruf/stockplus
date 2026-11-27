import assert from 'node:assert/strict';
import {
  buildIposImportSheetRows,
  findDuplicateNames,
  getNextCode,
  IPOS_IMPORT_HEADERS,
  mergeIposItems,
  parseIposExportRows,
} from '../src/utils/iposExcel.js';
import { encodeCode128B } from '../src/utils/barcode.js';

// 1. Parse EXPORT DATA 2 (Row 1 = TIPE,J; Row 2 = headers; Row 3+ = data)
const sampleExport2 = [
  ['TIPE', 'J', '=> PENTING JANGAN HAPUS BARIS INI'],
  ['KODEITEM', 'NAMAITEM', 'JENIS', 'MEREK', 'HARGAPOKOK1', 'HARGAJUAL1', 'STOKAWAL'],
  ['G0101', 'GELANG RANTAI GOLD', 'G01', 'DAIZY', 12000, 25000, 10],
  ['G0199', 'GELANG MANIK', 'G01', 'DAIZY', 8000, 18000, 4],
];
const parsed = parseIposExportRows(sampleExport2);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].code, 'G0101');
assert.equal(parsed[1].price, 18000);

// 2. Merge items case-insensitively by code
const { merged, addedCount, updatedCount } = mergeIposItems(
  [{ code: 'g0101', name: 'OLD NAME', group: 'G01', brand: '', cost: 1000, price: 2000, stock: 1 }],
  parsed
);
assert.equal(updatedCount, 1);
assert.equal(addedCount, 1);
assert.equal(merged[0].name, 'GELANG RANTAI GOLD');

// 3. Auto-increment code across items + batch
assert.equal(getNextCode('G01', parsed, []), 'G01100');
assert.equal(getNextCode('K01', parsed, [{ code: 'K0104' }]), 'K0105');

// 4. Duplicate name detection
const dups = findDuplicateNames('gelang manik', parsed, []);
assert.equal(dups.length, 1);
assert.equal(dups[0].code, 'G0199');

// 5. Build DATA ITEM 1 HARGA (TIPE O) rows
const sheetRows = buildIposImportSheetRows([
  { code: 'G01100', name: 'GELANG MUTIARA', group: 'G01', brand: 'DAIZY', cost: 10000, price: 20000, stock: 5 },
]);
assert.equal(sheetRows[0][0], 'TIPE');
assert.equal(sheetRows[0][1], 'O');
assert.equal(sheetRows[1].length, IPOS_IMPORT_HEADERS.length);
assert.equal(sheetRows[2][0], 'G01100');
assert.equal(sheetRows[2][2], '1');
assert.equal(sheetRows[2][14], 'UTM');
assert.equal(sheetRows[2][18], 'FIFO');
assert.equal(sheetRows[2][19], 5);

// 6. Code 128B encoder
const bc = encodeCode128B('G01100');
assert.ok(bc.bars.length > 0);
assert.ok(bc.totalWidth > 0);

console.log('ALL_CHECKS_PASSED');
