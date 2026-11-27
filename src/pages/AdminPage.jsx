import { CloudUpload, FileSpreadsheet, RotateCcw, ShieldCheck, Users } from 'lucide-react';

export function AdminPage({ settings, onSaveSettings, onResetDemo }) {
  const handleSaveDrive = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSaveSettings({
      ...settings,
      driveFolderUrl: String(form.get('driveFolderUrl') || '').trim(),
    });
  };

  return (
    <section className="panel page-panel">
      <div className="panel-heading">
        <div>
          <h3>Pengaturan workspace</h3>
          <p>Area khusus administrator</p>
        </div>
        <span className="admin-tag">
          <ShieldCheck size={14} /> ADMIN
        </span>
      </div>

      <div className="admin-settings">
        <div>
          <div className="settings-icon">
            <Users size={19} />
          </div>
          <div>
            <b>Role & akses</b>
            <p>
              Karyawan dapat mencatat barang baru, mencetak barcode, dan export batch. Import
              EXPORT DATA 2 dan konfirmasi status iPOS khusus Admin.
            </p>
          </div>
        </div>

        <div>
          <div className="settings-icon">
            <FileSpreadsheet size={19} />
          </div>
          <div>
            <b>Format iPOS</b>
            <p>
              Import membaca format EXPORT DATA 2 (.xlsx, .xls, .csv). Export menghasilkan sheet
              DATA ITEM 1 HARGA (TIPE O) sesuai template IMPORT_ITEM_V2.
            </p>
          </div>
        </div>

        <div>
          <div className="settings-icon">
            <CloudUpload size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <b>Link Google Drive tujuan export</b>
            <form onSubmit={handleSaveDrive} style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <input
                type="url"
                name="driveFolderUrl"
                defaultValue={settings.driveFolderUrl}
                placeholder="https://drive.google.com/drive/folders/..."
                style={{ flex: 1, minWidth: 220, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,.35)' }}
              />
              <button type="submit" className="outline-btn compact-btn">
                Simpan link
              </button>
              <button type="button" className="outline-btn compact-btn" onClick={onResetDemo}>
                <RotateCcw size={14} /> Reset data
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
