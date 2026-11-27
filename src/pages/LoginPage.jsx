import { useState } from 'react';
import { ChevronRight, ShieldCheck, Sparkles, UserRound, Users } from 'lucide-react';
import { SHIFTS } from '../config/appConfig';
import { detectShift } from '../utils/format';

export function LoginPage({ onLogin }) {
  const [name, setName] = useState('Rina');
  const [role, setRole] = useState('Karyawan');
  const [shift, setShift] = useState(() => (detectShift(SHIFTS) === 'pagi' ? 'Pagi' : 'Siang'));

  const login = (e) => {
    e.preventDefault();
    onLogin({ name: name.trim() || 'Pengguna', role, shift });
  };

  return (
    <div className="login-shell">
      <div className="login-art">
        <div className="brand">
          <span className="brand-mark">
            S<span>+</span>
          </span>
          <span>
            STOCK<span className="brand-light">PLUS</span>
          </span>
        </div>
        <div className="art-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> INVENTORY, REIMAGINED
          </div>
          <h1>
            Semua stok,
            <br />
            <em>satu kendali.</em>
          </h1>
          <p>Ruang kerja inventaris yang rapi untuk tim yang bergerak cepat.</p>
          <div className="art-stats">
            <div>
              <b>01</b>
              <span>Terorganisir</span>
            </div>
            <div>
              <b>02</b>
              <span>Terukur</span>
            </div>
            <div>
              <b>03</b>
              <span>Terhubung</span>
            </div>
          </div>
        </div>
        <div className="art-footer">
          STOCK PLUS WORKSPACE <span>© 2026</span>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={login}>
          <div className="mobile-brand">
            <span className="brand-mark">
              S<span>+</span>
            </span>{' '}
            STOCK PLUS
          </div>
          <div className="eyebrow muted">SELAMAT DATANG KEMBALI</div>
          <h2>Masuk ke workspace</h2>
          <p className="subtle">Gunakan profil untuk membuka dashboard inventaris.</p>

          <label>Nama pengguna</label>
          <div className="input-icon">
            <UserRound size={17} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
            />
          </div>

          <label>Peran akses</label>
          <div className="role-switch">
            <button
              type="button"
              className={role === 'Karyawan' ? 'selected' : ''}
              onClick={() => setRole('Karyawan')}
            >
              <Users size={16} /> Karyawan
            </button>
            <button
              type="button"
              className={role === 'Admin' ? 'selected' : ''}
              onClick={() => setRole('Admin')}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          </div>

          <label>Shift kerja</label>
          <div className="role-switch">
            <button
              type="button"
              className={shift === 'Pagi' ? 'selected' : ''}
              onClick={() => setShift('Pagi')}
            >
              Shift pagi
            </button>
            <button
              type="button"
              className={shift === 'Siang' ? 'selected' : ''}
              onClick={() => setShift('Siang')}
            >
              Shift siang
            </button>
          </div>

          <button className="primary-btn login-btn">
            Masuk ke Stock Plus <ChevronRight size={18} />
          </button>
          <div className="login-note">
            <ShieldCheck size={15} /> Shift otomatis terdeteksi sesuai jam kerja
          </div>
        </form>
      </div>
    </div>
  );
}
