import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Settings2,
  Sun,
  X,
} from 'lucide-react';
import { DEFAULT_SETTINGS, IMPORT_STALE_HOURS, IPOS_DEFAULTS, STORAGE_KEYS } from './config/appConfig';
import { EMPTY_DRAFT_FORM, INITIAL_HISTORY, SEED_ITEMS } from './data/seedData';
import { dateLabel, hoursSince, loadStorage, saveStorage } from './utils/format';
import { downloadIposExcel, mergeIposItems, readIposFile } from './utils/iposExcel';
import { PrintBarcodeModal } from './components/BarcodeLabel';
import { ExcelPreviewModal } from './components/ExcelPreviewModal';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { AdjustmentPage } from './pages/AdjustmentPage';
import { AdminPage } from './pages/AdminPage';
import { BatchPage } from './pages/BatchPage';
import { HistoryPage } from './pages/HistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { NewItemPage } from './pages/NewItemPage';
import { OverviewPage } from './pages/OverviewPage';
import { TransferPage } from './pages/TransferPage';

function App() {
  const [user, setUser] = useState(() => loadStorage(STORAGE_KEYS.user, null));
  const [items, setItems] = useState(() => loadStorage(STORAGE_KEYS.items, SEED_ITEMS));
  const [history, setHistory] = useState(() => loadStorage(STORAGE_KEYS.history, INITIAL_HISTORY));
  const [batch, setBatch] = useState(() => loadStorage(STORAGE_KEYS.batch, []));
  const [form, setForm] = useState(() => loadStorage(STORAGE_KEYS.draftForm, EMPTY_DRAFT_FORM));
  const [settings, setSettings] = useState(() =>
    loadStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );
  const [dark, setDark] = useState(() => loadStorage(STORAGE_KEYS.dark, false));

  const [page, setPage] = useState('overview');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [excelPreviewOpen, setExcelPreviewOpen] = useState(false);
  const [printBatch, setPrintBatch] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => saveStorage(STORAGE_KEYS.items, items), [items]);
  useEffect(() => saveStorage(STORAGE_KEYS.history, history), [history]);
  useEffect(() => saveStorage(STORAGE_KEYS.batch, batch), [batch]);
  useEffect(() => saveStorage(STORAGE_KEYS.draftForm, form), [form]);
  useEffect(() => saveStorage(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.dark, dark), [dark]);
  useEffect(() => {
    if (user) saveStorage(STORAGE_KEYS.user, user);
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, [user]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const isAdmin = user?.role === 'Admin';
  const isImportStale = useMemo(
    () => hoursSince(settings.lastImportAt) >= IMPORT_STALE_HOURS,
    [settings.lastImportAt]
  );

  const notify = (msg) => setToast(msg);
  const go = (p) => {
    setPage(p);
    setMobileNav(false);
    setQuery('');
  };

  const addToBatch = (item, qty = 1, isNew = false) => {
    setBatch((old) => {
      const found = old.find((x) => x.code === item.code);
      return found
        ? old.map((x) => (x.code === item.code ? { ...x, qty: x.qty + qty } : x))
        : [...old, { ...item, qty, isNew }];
    });
    notify('Barang ditambahkan ke batch');
  };

  const updateBatchQty = (code, delta) => {
    setBatch((old) =>
      old.map((x) => (x.code === code ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
    );
  };

  const removeBatchItem = (code) => {
    setBatch((old) => old.filter((x) => x.code !== code));
  };

  const saveNew = (e, generatedCode) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Nama barang wajib diisi');
    const item = {
      code: generatedCode,
      name: form.name.trim().toUpperCase(),
      type: form.type,
      group: form.group,
      cost: +form.cost || 0,
      price: +form.price || 0,
      stock: 0,
      brand: form.brand,
    };
    setItems((old) => [...old, item]);
    addToBatch(item, +form.qty || 1, true);
    setForm(EMPTY_DRAFT_FORM);
    go('batch');
  };

  const submitBatch = () => {
    if (!batch.length) return;
    const entry = {
      id: Date.now(),
      type: 'Barang Baru',
      by: user.name,
      shift: user.shift,
      date: dateLabel(),
      status: 'Terkirim',
      rows: batch.map((x) => ({
        code: x.code,
        name: x.name,
        type: x.type || x.group,
        brand: x.brand || 'NO MERK',
        cost: x.cost || 0,
        price: x.price || 0,
        qty: x.qty,
      })),
    };
    setHistory((old) => [entry, ...old]);
    setBatch([]);
    notify('Batch tersimpan di riwayat');
  };

  const handleExportBatchIpos = async (targetItems = batch) => {
    const newItemsOnly = targetItems.filter((x) => x.isNew !== false);
    if (!newItemsOnly.length) return notify('Tidak ada barang baru untuk di-export');
    const filename = await downloadIposExcel(newItemsOnly, user.shift, IPOS_DEFAULTS);
    if (settings.driveFolderUrl) {
      window.open(settings.driveFolderUrl, '_blank', 'noopener,noreferrer');
    }
    notify(`File ${filename} (DATA ITEM 1 HARGA) berhasil diexport`);
  };

  const handleParseImport = async (file) => {
    if (!file) return;
    if (!isAdmin) return notify('Hanya Admin yang dapat meng-import EXPORT DATA 2');
    try {
      const parsed = await readIposFile(file);
      if (!parsed.length) return notify('Tidak menemukan data dengan kolom KODEITEM');
      const { addedCount, updatedCount } = mergeIposItems(items, parsed);
      setImportPreview({
        rows: parsed,
        addedCount,
        updatedCount,
        filename: file.name,
      });
    } catch (err) {
      notify(err.message || 'File EXPORT DATA 2 tidak dapat dibaca');
    }
  };

  const commitImport = () => {
    if (!importPreview) return;
    const { merged } = mergeIposItems(items, importPreview.rows);
    setItems(merged);
    setSettings((prev) => ({
      ...prev,
      lastImportAt: new Date().toISOString(),
      lastImportFilename: importPreview.filename,
      lastImportCount: importPreview.rows.length,
    }));
    notify(`${importPreview.rows.length.toLocaleString('id-ID')} baris berhasil diproses`);
    setImportPreview(null);
    setModal('');
  };

  const markImported = (id) => {
    setHistory((old) =>
      old.map((h) => (h.id === id ? { ...h, status: 'Sudah di-import' } : h))
    );
    notify('Status diperbarui');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'WORKSPACE' },
    { id: 'inventory', label: 'Inventaris', icon: Package },
    { id: 'batch', label: 'Batch & barcode', icon: Boxes, badge: batch.length || null },
    { id: 'adjustment', label: 'Penyesuaian stok', icon: ArrowLeftRight },
    { id: 'history', label: 'Riwayat aktivitas', icon: Clock3 },
    { id: 'transfer', label: 'Import & export', icon: FileSpreadsheet, group: 'TOOLS' },
    ...(isAdmin ? [{ id: 'admin', label: 'Pengaturan admin', icon: Settings2, group: 'ADMIN' }] : []),
  ];

  const pageTitle =
    {
      overview: 'Overview',
      inventory: 'Inventaris barang',
      batch: 'Batch & barcode',
      adjustment: 'Penyesuaian stok',
      history: 'Riwayat aktivitas',
      transfer: 'Import & export',
      admin: 'Pengaturan admin',
      new: 'Tambah barang',
    }[page] || 'Stock Plus';

  if (!user) {
    return (
      <LoginPage
        onLogin={(u) => {
          setUser(u);
          go('overview');
        }}
      />
    );
  }

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`}>
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand sidebar-brand">
          <span className="brand-mark">
            S<span>+</span>
          </span>
          <span>
            STOCK<span className="brand-light">PLUS</span>
            <small>INVENTORY WORKSPACE</small>
          </span>
          <button type="button" className="mobile-close icon-btn" onClick={() => setMobileNav(false)}>
            <X />
          </button>
        </div>

        <nav className="side-nav">
          {navItems.map((n) => (
            <div key={n.id}>
              {n.group && <div className="nav-group">{n.group}</div>}
              <button
                type="button"
                className={`nav-link ${page === n.id ? 'active' : ''}`}
                onClick={() => go(n.id)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {n.badge ? <b className="nav-badge">{n.badge}</b> : null}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="profile-meta">
              <b>{user.name}</b>
              <small>
                {user.role} · Shift {user.shift}
              </small>
            </div>
            <button type="button" className="icon-btn" title="Keluar" onClick={() => setUser(null)}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button type="button" className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}>
              <Menu />
            </button>
            <div className="breadcrumbs">
              Workspace <ChevronRight size={14} /> <b>{pageTitle}</b>
            </div>
          </div>
          <div className="top-actions">
            <div className="today-pill">
              <span className="live-dot" />
              {dateLabel()}
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setDark(!dark)}
              title="Ganti tema"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="icon-btn notification"
              onClick={() =>
                notify(
                  isImportStale
                    ? 'Database EXPORT DATA 2 belum di-update lebih dari 24 jam'
                    : 'Semua sistem sinkron'
                )
              }
            >
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow muted">
                {page === 'overview' ? 'RINGKASAN TOKO' : `STOCK PLUS / ${page.toUpperCase()}`}
              </div>
              <h1>
                {pageTitle}
                <span className="heading-period">{page === 'overview' ? ' / Hari ini' : ''}</span>
              </h1>
              <p className="subtle">
                {page === 'overview'
                  ? 'Pantau kondisi inventaris dan aktivitas operasional toko.'
                  : page === 'inventory'
                    ? 'Kelola katalog, pantau stok, dan temukan barang dengan cepat.'
                    : page === 'transfer'
                      ? 'Import EXPORT DATA 2 dari iPOS dan export DATA ITEM 1 HARGA.'
                      : 'Kelola aktivitas inventaris dalam satu tempat.'}
              </p>
            </div>
            <div className="heading-actions">
              {page === 'overview' && (
                <button type="button" className="outline-btn" onClick={() => go('transfer')}>
                  <ArrowDownToLine size={16} /> Import / Export
                </button>
              )}
              <button type="button" className="primary-btn" onClick={() => go('new')}>
                <Plus size={17} /> Barang baru
              </button>
            </div>
          </div>

          {page === 'overview' && (
            <OverviewPage
              user={user}
              items={items}
              batch={batch}
              history={history}
              settings={settings}
              isImportStale={isImportStale}
              onNavigate={go}
              onSelectAllCategory={() => setCategory('Semua')}
            />
          )}

          {page === 'inventory' && (
            <InventoryPage
              items={items}
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              isAdmin={isAdmin}
              onOpenTransfer={() => go('transfer')}
              onAddToBatch={(i) => addToBatch(i)}
            />
          )}

          {page === 'batch' && (
            <BatchPage
              batch={batch}
              onUpdateQty={updateBatchQty}
              onRemove={removeBatchItem}
              onSubmitBatch={submitBatch}
              onExportIposExcel={() => handleExportBatchIpos(batch)}
              onPreviewExcel={() => setExcelPreviewOpen(true)}
              onPrintBarcodes={() => setPrintBatch(batch)}
              onGoNewItem={() => go('new')}
            />
          )}

          {page === 'new' && (
            <NewItemPage
              items={items}
              batch={batch}
              form={form}
              setForm={setForm}
              onSaveNew={saveNew}
              onCancel={() => go('inventory')}
            />
          )}

          {page === 'adjustment' && (
            <AdjustmentPage items={items} setHistory={setHistory} user={user} notify={notify} />
          )}

          {page === 'history' && (
            <HistoryPage
              history={history}
              isAdmin={isAdmin}
              modal={modal}
              setModal={setModal}
              onMarkImported={markImported}
              onDownloadHistoryExcel={(h) => handleExportBatchIpos(h.rows)}
              onPrintHistoryBarcodes={(rows) => setPrintBatch(rows)}
            />
          )}

          {page === 'transfer' && (
            <TransferPage
              items={items}
              batch={batch}
              isAdmin={isAdmin}
              settings={settings}
              onParseImport={handleParseImport}
              onExportBatchExcel={() => handleExportBatchIpos(batch)}
            />
          )}

          {page === 'admin' && isAdmin && (
            <AdminPage
              settings={settings}
              onSaveSettings={(s) => {
                setSettings(s);
                notify('Pengaturan disimpan');
              }}
              onResetDemo={() => {
                setItems(SEED_ITEMS);
                setHistory(INITIAL_HISTORY);
                setBatch([]);
                setForm(EMPTY_DRAFT_FORM);
                setSettings(DEFAULT_SETTINGS);
                notify('Data dikembalikan ke awal');
              }}
            />
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 Stock Plus</span>
          <span>
            MADE FOR BETTER INVENTORY <span className="footer-star">✳</span>
          </span>
        </footer>
      </main>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}

      <ImportPreviewModal
        preview={importPreview}
        onCancel={() => setImportPreview(null)}
        onConfirm={commitImport}
      />

      {excelPreviewOpen && (
        <ExcelPreviewModal
          batch={batch.filter((b) => b.isNew !== false)}
          onClose={() => setExcelPreviewOpen(false)}
          onDownload={() => {
            setExcelPreviewOpen(false);
            handleExportBatchIpos(batch);
          }}
        />
      )}

      {printBatch && <PrintBarcodeModal batch={printBatch} onClose={() => setPrintBatch(null)} />}
    </div>
  );
}

export default App;
