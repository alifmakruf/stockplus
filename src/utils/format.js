export function money(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

export function dateLabel(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function timeLabel(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

export function detectShift(shiftsConfig, date = new Date()) {
  const h = date.getHours();
  if (h >= shiftsConfig.pagi.startHour && h < shiftsConfig.pagi.endHour) {
    return 'pagi';
  }
  return 'siang';
}

export function hoursSince(isoString) {
  if (!isoString) return Infinity;
  const ts = Date.parse(isoString);
  if (Number.isNaN(ts)) return Infinity;
  return (Date.now() - ts) / (1000 * 60 * 60);
}

export function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Abaikan jika kuota storage penuh atau mode privat memblokir
  }
}
