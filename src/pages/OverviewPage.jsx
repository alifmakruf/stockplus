import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  Package,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '../config/appConfig';
import { money } from '../utils/format';

export function OverviewPage({
  user,
  items,
  batch,
  history,
  settings,
  isImportStale,
  onNavigate,
  onSelectAllCategory,
}) {
  const lowStock = items.filter((i) => Number(i.stock || 0) <= 2).length;
  const batchQty = batch.reduce((a, b) => a + Number(b.qty || 0), 0);
  const stockValue = items.reduce((a, b) => a + (Number(b.stock) || 0) * (Number(b.cost) || 0), 0);

  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-text">
          <div className="eyebrow">
            <Sparkles size={13} /> YOUR STORE AT A GLANCE
          </div>
          <h2>
            Halo, {user.name.split(' ')[0]} <span>✳</span>
          </h2>
          <p>
            {isImportStale
              ? 'Database EXPORT DATA 2 belum diperbarui hari ini. Pastikan katalog iPOS tetap sinkron.'
              : 'Ini ringkasan inventaris tokomu. Yuk, pastikan barang baru & batch shift tetap terkendali.'}
          </p>
          <button type="button" onClick={() => onNavigate('inventory')}>
            Lihat inventaris <ArrowUpFromLine size={15} />
          </button>
        </div>
        <div className="banner-graphic">
          <div className="graphic-ring ring-one" />
          <div className="graphic-ring ring-two" />
          <div className="graphic-box">
            <Package size={54} />
            <span>
              STOCK
              <br />
              IN SYNC
            </span>
          </div>
          <div className="float-tag tag-a">
            <TrendingUp size={14} /> LIVE INVENTORY
          </div>
          <div className="float-tag tag-b">
            S+ <span>WORKSPACE</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total SKU iPOS</span>
            <div className="stat-icon violet">
              <Package size={18} />
            </div>
          </div>
          <div className="stat-value">
            {items.length.toLocaleString('id-ID')}
            <small> item</small>
          </div>
          <div className="stat-foot">
            <span className="positive">
              <TrendingUp size={13} /> Katalog aktif
            </span>
            <span>
              {settings.lastImportFilename ? 'Update EXPORT DATA 2' : 'Data lokal'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Batch barang baru</span>
            <div className="stat-icon amber">
              <Boxes size={18} />
            </div>
          </div>
          <div className="stat-value">
            {batch.length}
            <small> item</small>
          </div>
          <div className="stat-foot">
            <span className="neutral">
              <Activity size={13} /> {batchQty} pcs siap export
            </span>
            <span>DATA ITEM 1 HARGA</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Perlu perhatian</span>
            <div className="stat-icon red">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value">
            {lowStock}
            <small> item</small>
          </div>
          <div className="stat-foot">
            <span className="negative">
              <TrendingDown size={13} /> Stok ≤ {LOW_STOCK_THRESHOLD}
            </span>
            <span>Referensi iPOS</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Nilai persediaan</span>
            <div className="stat-icon green">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="stat-value compact">{money(stockValue)}</div>
          <div className="stat-foot">
            <span className="positive">
              <CheckCircle2 size={13} /> Berdasarkan HPP
            </span>
            <span>Estimasi nilai</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <h3>Stok perlu perhatian</h3>
              <p>Barang dengan jumlah stok rendah (referensi katalog)</p>
            </div>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                onSelectAllCategory();
                onNavigate('inventory');
              }}
            >
              Lihat semua <ChevronRight size={15} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUK</th>
                  <th>KATEGORI</th>
                  <th>HPP</th>
                  <th>STOK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((x) => Number(x.stock || 0) <= 2)
                  .slice(0, 5)
                  .map((i) => (
                    <tr key={i.code}>
                      <td>
                        <div className="product-cell">
                          <div className="product-thumb">
                            <Package size={17} />
                          </div>
                          <div>
                            <b>{i.name}</b>
                            <small>{i.code}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{i.type || i.group}</span>
                      </td>
                      <td>{money(i.cost)}</td>
                      <td>
                        <b>{i.stock}</b>
                      </td>
                      <td>
                        <span className={`status ${i.stock === 0 ? 'danger' : 'warning'}`}>
                          <i />
                          {i.stock === 0 ? 'Habis' : 'Menipis'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h3>Aktivitas terbaru</h3>
              <p>Pergerakan inventaris & export terkini</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => onNavigate('history')}>
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="activity-list">
            {history.slice(0, 4).map((h, i) => (
              <div className="activity-item" key={h.id}>
                <div className={`activity-symbol ${i % 2 ? 'yellow' : 'purple'}`}>
                  {h.type === 'Penyesuaian' ? (
                    <ArrowLeftRight size={16} />
                  ) : (
                    <ArrowDownToLine size={16} />
                  )}
                </div>
                <div className="activity-copy">
                  <b>
                    {h.type} #{String(h.id).slice(-4)}
                  </b>
                  <span>
                    {h.by} · {h.shift} · {h.rows.length} barang
                  </span>
                </div>
                <div className="activity-time">{h.date}</div>
              </div>
            ))}
            {!history.length && <p className="empty-state">Belum ada aktivitas.</p>}
          </div>
          <button type="button" className="activity-link" onClick={() => onNavigate('history')}>
            Lihat seluruh aktivitas <ArrowUpFromLine size={14} />
          </button>
        </section>
      </div>
    </>
  );
}
