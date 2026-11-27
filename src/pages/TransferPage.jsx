import { useRef } from 'react';
import { Download, FileSpreadsheet, FileUp, ShieldCheck, Upload } from 'lucide-react';

export function TransferPage({
  items,
  batch,
  isAdmin,
  settings,
  onParseImport,
  onExportBatchExcel,
}) {
  const fileRef = useRef(null);
  const newItems = batch.filter((b) => b.isNew !== false);
  const totalNewQty = newItems.reduce((a, b) => a + Number(b.qty || 0), 0);

  return (
    <div className="transfer-layout">
      <section className="panel transfer-card">
        <div className="transfer-icon import">
          <Upload size={22} />
        </div>
        <div className="eyebrow muted">INPUT DATABASE (ADMIN)</div>
        <h3>Import EXPORT DATA 2</h3>
        <p>
          Unggah file export dari iPOS (EXPORT DATA 2) untuk memperbarui daftar kode & nama barang
          lokal.
        </p>
        <div className="format-row">
          <span>
            <FileSpreadsheet size={15} /> .XLSX
          </span>
          <span>
            <FileSpreadsheet size={15} /> .XLS
          </span>
          <span>
            <FileSpreadsheet size={15} /> .CSV
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          hidden
          onChange={(e) => {
            onParseImport(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="primary-btn full-btn"
          disabled={!isAdmin}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp size={17} /> Pilih file EXPORT DATA 2
        </button>
        <small className="subtle">
          {settings.lastImportAt
            ? `Update terakhir: ${new Date(settings.lastImportAt).toLocaleString('id-ID')} (${items.length.toLocaleString('id-ID')} item)`
            : 'Kolom utama: KODEITEM, NAMAITEM, JENIS, HARGAPOKOK1'}
        </small>
      </section>

      <section className="panel transfer-card">
        <div className="transfer-icon export">
          <Download size={22} />
        </div>
        <div className="eyebrow muted">OUTPUT KE IPOS (TIPE O)</div>
        <h3>Export DATA ITEM 1 HARGA</h3>
        <p>
          Unduh file Excel format IMPORT_ITEM_V2 khusus barang baru dari batch aktif untuk di-import
          ke iPOS.
        </p>
        <div className="export-info">
          <div>
            <span>Barang baru di batch</span>
            <b>{newItems.length} item</b>
          </div>
          <div>
            <span>Total stok awal</span>
            <b>{totalNewQty} pcs</b>
          </div>
        </div>
        <button
          type="button"
          className="primary-btn full-btn"
          disabled={!newItems.length}
          onClick={onExportBatchExcel}
        >
          <FileSpreadsheet size={16} /> Export DATA ITEM 1 HARGA (.xlsx)
        </button>
        <small className="subtle">
          {settings.driveFolderUrl
            ? 'Setelah download, folder Google Drive akan dibuka otomatis.'
            : 'Tambahkan barang baru di menu Barang Baru / Batch terlebih dahulu.'}
        </small>
      </section>

      <section className="panel transfer-note">
        <div className="note-icon">
          <ShieldCheck size={19} />
        </div>
        <div>
          <b>Satu pintu import EXPORT DATA 2 & export khusus item baru</b>
          <p>
            Import database dari EXPORT DATA 2 dikelola Admin. Export Excel menghasilkan sheet DATA
            ITEM 1 HARGA (TIPE O) yang hanya berisi barang baru.
          </p>
        </div>
      </section>
    </div>
  );
}
