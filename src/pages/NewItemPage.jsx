import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Info, Plus, RefreshCw, ScanBarcode, Tag } from 'lucide-react';
import { DUPLICATE_MAX_MATCHES } from '../config/appConfig';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { findDuplicateNames, getNextCode } from '../utils/iposExcel';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format angka ke string ribuan Indonesia: 150000 → "150.000" */
function fmtRupiah(val) {
  const n = parseInt(String(val).replace(/\D/g, ''), 10);
  if (!n && n !== 0) return '';
  return n.toLocaleString('id-ID');
}

/** Parse string ribuan Indonesia ke angka murni: "150.000" → 150000 */
function parseRupiah(str) {
  return parseInt(String(str).replace(/\./g, '').replace(/\D/g, ''), 10) || 0;
}

/** Uppercase input, preserve cursor */
function toUp(e) {
  const el = e.target;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  el.value = el.value.toUpperCase();
  el.setSelectionRange(start, end);
  return el.value;
}

// ── Komponen input harga dengan format ribuan ─────────────────────────────────
function RupiahInput({ value, onChange, placeholder = '0' }) {
  const ref = useRef(null);

  function handleChange(e) {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    // Simpan posisi kursor sebelum format ulang
    const cursorFromEnd = e.target.value.length - e.target.selectionEnd;
    onChange(num);
    // Setelah render, kembalikan kursor
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const newLen = ref.current.value.length;
      const pos = Math.max(0, newLen - cursorFromEnd);
      ref.current.setSelectionRange(pos, pos);
    });
  }

  return (
    <input
      ref={ref}
      inputMode="numeric"
      value={value ? fmtRupiah(value) : ''}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
}

// ── Komponen ComboBox (dropdown + input manual) ───────────────────────────────
function ComboField({ label, value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter((o) =>
    o.toUpperCase().includes(value.toUpperCase())
  );
  const showList = open && filtered.length > 0;

  return (
    <div className="field combo-field" style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onPaste={(e) => {
          e.preventDefault();
          const txt = e.clipboardData.getData('text').toUpperCase();
          onChange(txt);
        }}
        autoComplete="off"
      />
      {showList && (
        <ul className="combo-list">
          {filtered.slice(0, 8).map((o) => (
            <li
              key={o}
              onMouseDown={() => { onChange(o); setOpen(false); }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Halaman utama ─────────────────────────────────────────────────────────────
export function NewItemPage({ items, batch, form, setForm, onSaveNew, onCancel }) {
  const autoCode = useMemo(
    () => getNextCode(form.group, items, batch),
    [form.group, items, batch]
  );

  // Kode manual: null = pakai auto, string = override pengguna
  const [manualCode, setManualCode] = useState(null);
  const finalCode = manualCode !== null ? manualCode : autoCode;

  // Reset ke auto jika kelompok kode berubah
  const prevGroup = useRef(form.group);
  if (prevGroup.current !== form.group) {
    prevGroup.current = form.group;
    if (manualCode !== null) setManualCode(null);
  }

  // Cek apakah kode final sudah dipakai
  const allCodes = useMemo(
    () => new Set([...items, ...batch].map((i) => String(i.code || '').toUpperCase())),
    [items, batch]
  );
  const codeConflict = finalCode && allCodes.has(finalCode.toUpperCase());

  const duplicates = useMemo(
    () => findDuplicateNames(form.name, items, batch, DUPLICATE_MAX_MATCHES),
    [form.name, items, batch]
  );

  // Daftar kelompok kode unik dari data nyata
  const groups = useMemo(
    () => [...new Set(items.map((i) => i.code.slice(0, 3)))].sort(),
    [items]
  );

  // Daftar kategori unik dari data nyata
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.type || i.group).filter(Boolean))].sort(),
    [items]
  );

  // Daftar merek unik dari data nyata
  const brands = useMemo(() => {
    const set = new Set(['NO MERK']);
    items.forEach((i) => { if (i.brand) set.add(i.brand.toUpperCase()); });
    return [...set].sort();
  }, [items]);

  // Contoh barang dari kelompok kode yang dipilih (maks 5)
  const groupExamples = useMemo(() => {
    if (!form.group) return [];
    const prefix = form.group.toUpperCase();
    return items
      .filter((i) => String(i.code || '').toUpperCase().startsWith(prefix))
      .slice(0, 5);
  }, [form.group, items]);

  // Apakah kelompok kode sudah ada di database?
  const groupExists = groups.includes(form.group.toUpperCase());

  function setName(val) {
    setForm({ ...form, name: val.toUpperCase() });
  }

  return (
    <section className="panel form-panel">
      <div className="form-intro">
        <div className="form-icon">
          <Tag size={21} />
        </div>
        <div>
          <h3>Informasi barang</h3>
          <p>Lengkapi detail barang baru. Kode item dibuat otomatis dan draft tersimpan.</p>
        </div>
      </div>

      <form onSubmit={(e) => onSaveNew(e, finalCode)} className="product-form">
        <div className="form-grid">

          {/* ── Nama barang ── */}
          <div className="field full">
            <label>Nama barang *</label>
            <input
              required
              value={form.name}
              placeholder="Contoh: GANCI KUCING"
              onChange={(e) => setName(e.target.value)}
              onKeyUp={(e) => { if (e.target.value !== e.target.value.toUpperCase()) setName(e.target.value); }}
              onPaste={(e) => {
                e.preventDefault();
                const txt = e.clipboardData.getData('text').toUpperCase();
                setForm({ ...form, name: txt });
              }}
            />
            {duplicates.length > 0 && (
              <div className="dup-warn">
                <AlertTriangle size={16} />
                <div>
                  <b>Kemungkinan nama barang sudah ada di katalog/batch:</b>
                  <ul>
                    {duplicates.map((d) => (
                      <li key={`${d.source}-${d.code}`}>
                        <span className="mono">{d.code}</span> — {d.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ── Kelompok kode ── */}
          <div className="field" style={{ position: 'relative' }}>
            <label>Kelompok kode</label>
            <ComboField
              label=""
              value={form.group}
              options={groups}
              placeholder="Contoh: A01"
              onChange={(v) => setForm({ ...form, group: v })}
            />
            {/* Info/warning kelompok */}
            {form.group && (
              <div className={`group-info ${groupExists ? 'group-exists' : 'group-new'}`}>
                <Info size={13} />
                {groupExists
                  ? `Kelompok "${form.group}" sudah terdaftar.`
                  : `Kelompok "${form.group}" belum ada — akan jadi kelompok baru.`}
              </div>
            )}
            {/* Contoh barang dalam kelompok */}
            {groupExamples.length > 0 ? (
              <div className="group-examples">
                <span className="group-examples-title">Kelompok {form.group}:</span>
                <ul>
                  {groupExamples.map((ex) => (
                    <li key={ex.code}>
                      <span className="mono">{ex.code}</span> — {ex.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : form.group ? (
              <div className="group-examples group-examples--empty">
                Belum ada contoh barang dalam kelompok ini.
              </div>
            ) : null}
          </div>

          {/* ── Kode item berikutnya ── */}
          <div className="field">
            <label>Kode item berikutnya</label>
            <div className="code-input-wrap">
              <input
                className="code-input"
                value={finalCode}
                placeholder="Contoh: A0105"
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onPaste={(e) => {
                  e.preventDefault();
                  setManualCode(e.clipboardData.getData('text').toUpperCase());
                }}
              />
              <ScanBarcode size={16} className="code-input-icon" />
              {manualCode !== null && (
                <button
                  type="button"
                  className="code-reset-btn"
                  title="Reset ke kode otomatis"
                  onClick={() => setManualCode(null)}
                >
                  <RefreshCw size={14} /> auto
                </button>
              )}
            </div>
            {codeConflict && (
              <div className="dup-warn" style={{ marginTop: 6 }}>
                <AlertTriangle size={14} />
                <span>Kode <b>{finalCode}</b> sudah digunakan. Ganti atau reset ke otomatis.</span>
              </div>
            )}
            {manualCode === null && (
              <span className="code-auto-label">Dibuat otomatis dari kelompok kode</span>
            )}
          </div>

          {/* ── Kategori ── */}
          <ComboField
            label="Kategori"
            value={form.type}
            options={categories}
            placeholder="Contoh: ACC"
            onChange={(v) => setForm({ ...form, type: v })}
          />

          {/* ── Merek ── */}
          <ComboField
            label="Merek"
            value={form.brand}
            options={brands}
            placeholder="Contoh: NO MERK"
            onChange={(v) => setForm({ ...form, brand: v })}
          />

          {/* ── Harga pokok ── */}
          <div className="field">
            <label>Harga pokok (HPP)</label>
            <div className="currency-input">
              <span>Rp</span>
              <RupiahInput
                value={form.cost}
                onChange={(n) => setForm({ ...form, cost: n })}
              />
            </div>
          </div>

          {/* ── Harga jual ── */}
          <div className="field">
            <label>Harga jual</label>
            <div className="currency-input">
              <span>Rp</span>
              <RupiahInput
                value={form.price}
                onChange={(n) => setForm({ ...form, price: n })}
              />
            </div>
          </div>

          {/* ── Jumlah awal ── */}
          <div className="field">
            <label>Jumlah awal</label>
            <input
              type="number"
              min="1"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </div>

          {/* ── Preview barcode ── */}
          <div className="field">
            <label>Preview barcode</label>
            <BarcodeLabel
              compact
              item={{
                code: finalCode,
                name: form.name.trim() || 'BARANG BARU',
                price: Number(form.price || 0),
              }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="outline-btn" onClick={onCancel}>
            Batal
          </button>
          <button className="primary-btn">
            <Plus size={16} /> Simpan &amp; tambah ke batch
          </button>
        </div>
      </form>
    </section>
  );
}
