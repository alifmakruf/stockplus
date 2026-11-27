import { useState } from 'react';
import { ArrowLeftRight, Check, ChevronRight, Package, Search, ShieldCheck, X } from 'lucide-react';
import { dateLabel } from '../utils/format';

export function AdjustmentPage({ items, setHistory, user, notify }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [physical, setPhysical] = useState('');
  const [reason, setReason] = useState('Stok display belum tercatat');

  const matches = items
    .filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 8);

  const submit = (e) => {
    e.preventDefault();
    if (physical === '') return notify('Isi jumlah fisik terlebih dahulu');
    const entry = {
      id: Date.now(),
      type: 'Penyesuaian',
      by: user.name,
      shift: user.shift,
      date: dateLabel(),
      status: 'Terkirim',
      rows: [
        {
          code: selected.code,
          name: selected.name,
          qty: Number(physical),
          system: selected.stock,
          reason,
        },
      ],
    };
    setHistory((old) => [entry, ...old]);
    setSelected(null);
    setPhysical('');
    setQ('');
    notify('Penyesuaian berhasil dicatat');
  };

  return (
    <div className="two-column">
      <section className="panel page-panel">
        <div className="panel-heading">
          <div>
            <h3>Pilih barang</h3>
            <p>Cari barang yang ingin disesuaikan</p>
          </div>
        </div>
        <div className="search-box wide-search">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau kode barang..."
          />
        </div>
        {q && (
          <div className="picker-results">
            {matches.map((i) => (
              <button
                type="button"
                key={i.code}
                onClick={() => {
                  setSelected(i);
                  setQ('');
                }}
              >
                <div className="product-thumb">
                  <Package size={17} />
                </div>
                <div>
                  <b>{i.name}</b>
                  <small>
                    {i.code} · Stok data: {i.stock}
                  </small>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
        {!q && !selected && (
          <div className="empty-large">
            <div>
              <ArrowLeftRight size={26} />
            </div>
            <h3>Belum ada barang dipilih</h3>
            <p>Gunakan pencarian untuk memilih barang yang akan disesuaikan.</p>
          </div>
        )}
        {selected && (
          <form className="adjust-form" onSubmit={submit}>
            <div className="selected-product">
              <div className="product-thumb">
                <Package size={18} />
              </div>
              <div>
                <b>{selected.name}</b>
                <small>
                  {selected.code} · {selected.type || selected.group}
                </small>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelected(null)}>
                <X size={17} />
              </button>
            </div>
            <label>Jumlah fisik di rak</label>
            <input
              type="number"
              min="0"
              value={physical}
              onChange={(e) => setPhysical(e.target.value)}
              placeholder="Masukkan jumlah aktual"
            />
            <div className="difference">
              <span>Selisih dari stok sistem</span>
              <b>
                {physical === '' ? '—' : Number(physical) - selected.stock > 0 ? '+' : ''}
                {physical === '' ? '' : Number(physical) - selected.stock}
              </b>
            </div>
            <label>Alasan penyesuaian</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>Stok display belum tercatat</option>
              <option>Salah input</option>
              <option>Barang rusak</option>
              <option>Hasil stock opname</option>
            </select>
            <button className="primary-btn full-btn">
              <Check size={16} /> Simpan penyesuaian
            </button>
          </form>
        )}
      </section>

      <section className="panel batch-summary">
        <div className="summary-icon">
          <ArrowLeftRight size={21} />
        </div>
        <h3>Catatan penyesuaian</h3>
        <p>Penyesuaian akan masuk ke riwayat aktivitas agar dapat ditinjau kembali.</p>
        <div className="summary-line">
          <span>Pengguna</span>
          <b>{user.name}</b>
        </div>
        <div className="summary-line">
          <span>Role</span>
          <b>{user.role}</b>
        </div>
        <div className="summary-line">
          <span>Shift</span>
          <b>{user.shift}</b>
        </div>
        <div className="permission-note">
          <ShieldCheck size={16} /> Aktivitas tercatat atas nama pengguna yang sedang masuk.
        </div>
      </section>
    </div>
  );
}
