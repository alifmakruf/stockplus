import { Check, FileSpreadsheet, X } from 'lucide-react';

export function ImportPreviewModal({ preview, onCancel, onConfirm }) {
  if (!preview) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close icon-btn" onClick={onCancel}>
          <X />
        </button>
        <div className="modal-icon">
          <FileSpreadsheet size={22} />
        </div>
        <div className="eyebrow muted">IMPORT PREVIEW (EXPORT DATA 2)</div>
        <h2>Periksa data sebelum disimpan</h2>
        <p className="subtle">File: {preview.filename}</p>

        <div className="preview-stats">
          <div>
            <b>{preview.rows.length.toLocaleString('id-ID')}</b>
            <span>Total baris</span>
          </div>
          <div>
            <b>{preview.addedCount.toLocaleString('id-ID')}</b>
            <span>Barang baru</span>
          </div>
          <div>
            <b>{preview.updatedCount.toLocaleString('id-ID')}</b>
            <span>Diperbarui</span>
          </div>
        </div>

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>KODE</th>
                <th>NAMA BARANG</th>
                <th>STOK</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 5).map((r) => (
                <tr key={r.code}>
                  <td className="mono">{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.rows.length > 5 && (
            <small>dan {(preview.rows.length - 5).toLocaleString('id-ID')} baris lainnya...</small>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm}>
            <Check size={16} /> Terapkan import
          </button>
        </div>
      </div>
    </div>
  );
}
