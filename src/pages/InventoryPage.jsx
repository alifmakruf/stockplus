import { useMemo, useState } from 'react';
import { ArrowDownToLine, ChevronLeft, ChevronRight, Package, Plus, Search, X } from 'lucide-react';
import { INVENTORY_PAGE_SIZE } from '../config/appConfig';
import { money } from '../utils/format';

export function InventoryPage({
  items,
  query,
  setQuery,
  category,
  setCategory,
  isAdmin,
  onOpenTransfer,
  onAddToBatch,
}) {
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => ['Semua', ...new Set(items.map((x) => x.type || x.group).filter(Boolean))],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        (category === 'Semua' || (i.type || i.group) === category) &&
        `${i.code} ${i.name} ${i.type || i.group}`.toLowerCase().includes(q)
    );
  }, [items, category, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * INVENTORY_PAGE_SIZE,
    safePage * INVENTORY_PAGE_SIZE
  );

  return (
    <section className="panel page-panel">
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama barang atau kode..."
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPage(1);
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <select
            className="select-control"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {isAdmin && (
            <button type="button" className="outline-btn" onClick={onOpenTransfer}>
              <ArrowDownToLine size={16} /> Import / Export
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>PRODUK</th>
              <th>KODE ITEM</th>
              <th>KATEGORI</th>
              <th>HARGA POKOK</th>
              <th>STOK</th>
              <th>STATUS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((i) => (
              <tr key={i.code}>
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">
                      <Package size={17} />
                    </div>
                    <div>
                      <b>{i.name}</b>
                      <small>{i.brand || 'NO MERK'}</small>
                    </div>
                  </div>
                </td>
                <td className="mono">{i.code}</td>
                <td>
                  <span className="category-tag">{i.type || i.group}</span>
                </td>
                <td>{money(i.cost)}</td>
                <td>
                  <b>{i.stock}</b> <span className="subtle">pcs</span>
                </td>
                <td>
                  <span
                    className={`status ${
                      i.stock === 0 ? 'danger' : i.stock <= 2 ? 'warning' : 'good'
                    }`}
                  >
                    <i />
                    {i.stock === 0 ? 'Habis' : i.stock <= 2 ? 'Menipis' : 'Aman'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="small-action"
                    onClick={() => onAddToBatch(i)}
                    title="Tambah ke batch"
                  >
                    <Plus size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="empty-state">Barang tidak ditemukan.</div>}
      </div>

      <div className="table-footer">
        <span>
          Menampilkan <b>{pageItems.length}</b> dari <b>{filtered.length.toLocaleString('id-ID')}</b>{' '}
          barang (Total: {items.length.toLocaleString('id-ID')})
        </span>
        {totalPages > 1 ? (
          <div className="pagination-bar">
            <button
              type="button"
              className="icon-btn"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="subtle">
              Hal {safePage}/{totalPages}
            </span>
            <button
              type="button"
              className="icon-btn"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <span className="subtle">Data tersimpan di perangkat ini</span>
        )}
      </div>
    </section>
  );
}
