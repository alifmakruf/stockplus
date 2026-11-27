import { useState } from 'react';
import { ArrowDownToLine, ArrowLeftRight, Download, MoreHorizontal, ScanBarcode } from 'lucide-react';

export function HistoryPage({
  history,
  isAdmin,
  modal,
  setModal,
  onMarkImported,
  onDownloadHistoryExcel,
  onPrintHistoryBarcodes,
}) {
  const [historyFilter, setHistoryFilter] = useState('Semua');

  const visible = history.filter((h) => historyFilter === 'Semua' || h.type === historyFilter);

  return (
    <section className="panel page-panel">
      <div className="toolbar">
        <div>
          <h3>Semua aktivitas</h3>
          <p className="subtle">Catatan batch barang baru dan penyesuaian stok</p>
        </div>
        <select
          className="select-control"
          value={historyFilter}
          onChange={(e) => setHistoryFilter(e.target.value)}
        >
          {['Semua', 'Barang Baru', 'Penyesuaian'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>

      <div className="history-list">
        {visible.map((h) => (
          <div className="history-card" key={h.id}>
            <div className="history-type-icon">
              {h.type === 'Penyesuaian' ? (
                <ArrowLeftRight size={19} />
              ) : (
                <ArrowDownToLine size={19} />
              )}
            </div>
            <div className="history-main">
              <div className="history-title">
                <b>
                  {h.type} #{String(h.id).slice(-5)}
                </b>
                <span className={`status ${h.status === 'Sudah di-import' ? 'good' : 'warning'}`}>
                  <i />
                  {h.status}
                </span>
              </div>
              <p>
                {h.date} · {h.by} · Shift {h.shift}
              </p>
              <div className="history-products">
                {h.rows.map((r, idx) => (
                  <span key={`${r.code}-${idx}`}>
                    {r.name} <b>×{r.qty}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="history-actions">
              {h.type !== 'Penyesuaian' && (
                <>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Export Excel iPOS"
                    onClick={() => onDownloadHistoryExcel(h)}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Cetak barcode"
                    onClick={() => onPrintHistoryBarcodes(h.rows)}
                  >
                    <ScanBarcode size={16} />
                  </button>
                </>
              )}
              {isAdmin && h.status === 'Terkirim' && (
                <button
                  type="button"
                  className="outline-btn compact-btn"
                  onClick={() => onMarkImported(h.id)}
                >
                  Tandai di-import
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                onClick={() => setModal(modal === `history-${h.id}` ? '' : `history-${h.id}`)}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
            {modal === `history-${h.id}` && (
              <div className="history-detail">
                <b>Detail transaksi</b>
                {h.rows.map((r, idx) => (
                  <p key={`${r.code}-${idx}`}>
                    {r.code} · {r.name} · {r.qty} pcs
                  </p>
                ))}
                <button type="button" className="text-btn" onClick={() => setModal('')}>
                  Tutup
                </button>
              </div>
            )}
          </div>
        ))}
        {!visible.length && <div className="empty-state">Belum ada riwayat aktivitas.</div>}
      </div>
    </section>
  );
}
