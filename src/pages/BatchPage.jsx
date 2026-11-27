import { Boxes, Check, Download, Eye, Minus, Package, Plus, ScanBarcode, Trash2, FileSpreadsheet } from 'lucide-react';
import { money } from '../utils/format';

export function BatchPage({
  batch,
  onUpdateQty,
  onRemove,
  onSubmitBatch,
  onExportIposExcel,
  onPreviewExcel,
  onPrintBarcodes,
  onGoNewItem,
}) {
  const newItemsOnly = batch.filter((b) => b.isNew !== false);

  return (
    <div className="two-column">
      <section className="panel page-panel">
        <div className="panel-heading">
          <div>
            <h3>Daftar batch</h3>
            <p>Barang baru yang siap di-export ke DATA ITEM 1 HARGA (iPOS)</p>
          </div>
          <span className="count-pill">{batch.length} item</span>
        </div>

        {batch.length ? (
          <div className="batch-list">
            {batch.map((b) => (
              <div className="batch-row" key={b.code}>
                <div className="product-thumb">
                  <Package size={18} />
                </div>
                <div className="batch-product">
                  <b>{b.name}</b>
                  <small className="mono">
                    {b.code} · {b.type || b.group}{' '}
                    {b.isNew && <em className="new-tag">BARU</em>}
                  </small>
                </div>
                <div className="qty-control">
                  <button type="button" onClick={() => onUpdateQty(b.code, -1)}>
                    <Minus size={14} />
                  </button>
                  <b>{b.qty}</b>
                  <button type="button" onClick={() => onUpdateQty(b.code, 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-btn danger-icon"
                  onClick={() => onRemove(b.code)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-large">
            <div>
              <Boxes size={28} />
            </div>
            <h3>Batch masih kosong</h3>
            <p>Tambahkan barang baru untuk mulai membuat batch export DATA ITEM 1 HARGA.</p>
            <button type="button" className="primary-btn" onClick={onGoNewItem}>
              <Plus size={16} /> Tambah barang baru
            </button>
          </div>
        )}
      </section>

      <section className="panel batch-summary">
        <div className="summary-icon">
          <FileSpreadsheet size={21} />
        </div>
        <h3>Ringkasan batch</h3>
        <p>Export hanya menyertakan barang baru sesuai format IMPORT_ITEM_V2 (TIPE O).</p>
        <div className="summary-line">
          <span>Barang baru di batch</span>
          <b>{newItemsOnly.length} item</b>
        </div>
        <div className="summary-line">
          <span>Total unit</span>
          <b>{batch.reduce((a, b) => a + Number(b.qty || 0), 0)} pcs</b>
        </div>
        <div className="summary-line">
          <span>Estimasi nilai HPP</span>
          <b>{money(batch.reduce((a, b) => a + Number(b.qty || 0) * Number(b.cost || 0), 0))}</b>
        </div>

        <button
          type="button"
          className="primary-btn full-btn"
          disabled={!batch.length}
          onClick={onSubmitBatch}
        >
          <Check size={17} /> Simpan & kirim batch
        </button>
        <button
          type="button"
          className="outline-btn full-btn"
          disabled={!newItemsOnly.length}
          onClick={onExportIposExcel}
        >
          <Download size={16} /> Export Excel iPOS
        </button>
        <button
          type="button"
          className="outline-btn full-btn"
          disabled={!batch.length}
          onClick={onPrintBarcodes}
        >
          <ScanBarcode size={16} /> Cetak barcode label
        </button>
        <button
          type="button"
          className="text-btn"
          disabled={!newItemsOnly.length}
          onClick={onPreviewExcel}
        >
          <Eye size={14} /> Preview DATA ITEM 1 HARGA
        </button>
      </section>
    </div>
  );
}
