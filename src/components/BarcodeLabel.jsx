import { useMemo, useState } from 'react';
import { Printer, ScanBarcode, X } from 'lucide-react';
import { BARCODE_CONFIG } from '../config/appConfig';
import { encodeCode128B } from '../utils/barcode';
import { money } from '../utils/format';

export function BarcodeLabel({ item, compact = false }) {
  const encoded = useMemo(() => encodeCode128B(item?.code || ''), [item?.code]);
  const barWidth = compact ? Math.max(1.2, BARCODE_CONFIG.barWidth * 0.85) : BARCODE_CONFIG.barWidth;
  const barHeight = compact ? Math.round(BARCODE_CONFIG.barHeight * 0.78) : BARCODE_CONFIG.barHeight;
  const quiet = BARCODE_CONFIG.quietZone;
  const svgWidth = (encoded.totalWidth + quiet * 2) * barWidth;

  if (!item?.code) return null;

  let xCursor = quiet * barWidth;
  const rects = [];

  encoded.bars.forEach((units, idx) => {
    const w = units * barWidth;
    if (idx % 2 === 0) {
      rects.push(<rect key={idx} x={xCursor} y={0} width={w} height={barHeight} fill="#111111" />);
    }
    xCursor += w;
  });

  return (
    <div className={`barcode-label${compact ? ' is-compact' : ''}`}>
      <div className="barcode-label-name" title={item.name}>
        {item.name}
      </div>
      <svg
        className="barcode-svg"
        viewBox={`0 0 ${svgWidth} ${barHeight}`}
        width="100%"
        height={barHeight}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Barcode ${item.code}`}
      >
        <rect x="0" y="0" width={svgWidth} height={barHeight} fill="#ffffff" />
        {rects}
      </svg>
      <div className="barcode-label-meta" style={{ fontSize: `${BARCODE_CONFIG.fontSize}px` }}>
        <span>{item.code}</span>
        <strong>{money(item.price)}</strong>
      </div>
    </div>
  );
}

export function PrintBarcodeModal({ batch, onClose }) {
  const [byStockQty, setByStockQty] = useState(false);

  if (!batch) return null;

  const labelsToPrint = [];
  batch.forEach((item) => {
    const qty = Number(item.qty ?? item.stock ?? 1);
    const count = byStockQty ? Math.max(1, Math.min(qty, 100)) : 1;
    for (let i = 0; i < count; i += 1) {
      labelsToPrint.push({ ...item, _printKey: `${item.code}-${i}` });
    }
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close icon-btn no-print" onClick={onClose}>
          <X />
        </button>
        <div className="modal-icon no-print">
          <ScanBarcode size={22} />
        </div>
        <div className="eyebrow muted no-print">CETAK BARCODE</div>
        <h2 className="no-print">Label Code 128B ({labelsToPrint.length} label)</h2>
        <label className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '.88rem' }}>
          <input
            type="checkbox"
            checked={byStockQty}
            onChange={(e) => setByStockQty(e.target.checked)}
          />
          Cetak sesuai jumlah qty per item (maks. 100/item)
        </label>

        <div
          className="barcode-print-grid print-sheet"
          style={{ '--print-cols': BARCODE_CONFIG.printColumns }}
        >
          {labelsToPrint.map((item) => (
            <BarcodeLabel key={item._printKey} item={item} compact />
          ))}
        </div>

        <div className="modal-actions no-print">
          <button type="button" className="outline-btn" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="primary-btn" onClick={() => window.print()}>
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
