import { Download, FileSpreadsheet, X } from 'lucide-react';
import { IPOS_DEFAULTS } from '../config/appConfig';
import { buildIposImportSheetRows } from '../utils/iposExcel';

export function ExcelPreviewModal({ batch, onClose, onDownload }) {
  if (!batch) return null;

  const rows2D = buildIposImportSheetRows(batch, IPOS_DEFAULTS);
  const headerRow = rows2D[1] || [];
  const dataRows = rows2D.slice(2);
  const visibleIndices = [0, 1, 2, 4, 5, 6, 7, 8, 14, 18, 19];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close icon-btn" onClick={onClose}>
          <X />
        </button>
        <div className="modal-icon">
          <FileSpreadsheet size={22} />
        </div>
        <div className="eyebrow muted">SHEET: {IPOS_DEFAULTS.sheetName}</div>
        <h2>Preview Excel Import iPOS (TIPE {IPOS_DEFAULTS.tipeImport})</h2>
        <p className="subtle">
          Baris 1: TIPE | {IPOS_DEFAULTS.tipeImport} | {IPOS_DEFAULTS.headerNotice}
        </p>

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {visibleIndices.map((idx) => (
                  <th key={idx}>{headerRow[idx]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {visibleIndices.map((colIdx) => (
                    <td key={colIdx} className={colIdx === 0 ? 'mono' : undefined}>
                      {String(row[colIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button type="button" className="outline-btn" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="primary-btn" onClick={onDownload}>
            <Download size={16} /> Download Excel iPOS
          </button>
        </div>
      </div>
    </div>
  );
}
