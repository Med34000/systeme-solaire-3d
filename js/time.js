// Contrôle du temps simulé.

import { sim, DATE_MIN, DATE_MAX, LAPSE_DUR } from './sim.js';
import { clearTrails } from './trails.js';

const simDateEl = document.getElementById('sim-date');
const liveBadge = document.getElementById('live-badge');
const dateInput = document.getElementById('date-input');

export function setSpeed(s) {
  sim.speed = s;
  sim.syncedToNow = (s === 1 && sim.direction === 1 && Math.abs(sim.date - Date.now()) < 5000);
  document.querySelectorAll('#time-controls button[data-speed]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.speed) === s);
  });
  updateBadge();
}

export function updateBadge() {
  if (sim.syncedToNow && sim.speed === 1 && sim.direction === 1) {
    liveBadge.textContent = '● TEMPS RÉEL';
    liveBadge.classList.remove('off');
  } else if (sim.speed === 0) {
    liveBadge.textContent = '⏸ PAUSE';
    liveBadge.classList.add('off');
  } else {
    const dir = sim.direction === -1 ? '⏪ ' : '';
    liveBadge.textContent = `${dir}SIMULATION ×${sim.speed.toLocaleString('fr-FR')}`;
    liveBadge.classList.add('off');
  }
}

export function goToDate(date, { pause = false, clear = true } = {}) {
  sim.date = new Date(Math.min(Math.max(date.getTime(), DATE_MIN), DATE_MAX));
  sim.syncedToNow = false;
  if (pause) setSpeed(0);
  else updateBadge();
  if (clear) clearTrails();
}

export function goNow() {
  sim.date = new Date();
  sim.direction = 1;
  document.getElementById('reverse-btn').classList.remove('active');
  setSpeed(1);
  sim.syncedToNow = true;
  updateBadge();
  clearTrails();
}

export function syncDateInput() {
  const d = sim.date;
  const pad = (n) => String(n).padStart(2, '0');
  dateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function refreshDateLabel() {
  simDateEl.textContent = sim.date.toLocaleString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function setupTimeControls() {
  document.querySelectorAll('#time-controls button[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)));
  });

  document.getElementById('reverse-btn').addEventListener('click', (e) => {
    sim.direction *= -1;
    sim.syncedToNow = false;
    e.target.classList.toggle('active', sim.direction === -1);
    updateBadge();
  });

  document.getElementById('now-btn').addEventListener('click', goNow);

  document.getElementById('go-date-btn').addEventListener('click', () => {
    if (!dateInput.value) return;
    const d = new Date(dateInput.value);
    if (isNaN(d)) return;
    goToDate(d);
  });

  syncDateInput();
}

/** Avance le temps simulé d'une frame. Retourne true si la date a changé. */
export function tickTime(dt, { onLapseHud } = {}) {
  if (sim.lapse) {
    const k = Math.min((performance.now() - sim.lapse.start) / LAPSE_DUR, 1);
    const e = k * k * (3 - 2 * k);
    sim.date = new Date(sim.lapse.t0 + e * (sim.lapse.t1 - sim.lapse.t0));
    onLapseHud?.(k);
    return true;
  }
  if (sim.syncedToNow && sim.speed === 1 && sim.direction === 1) {
    sim.date = new Date();
    return true;
  }
  if (sim.speed !== 0) {
    let t = sim.date.getTime() + dt * sim.speed * sim.direction * 1000;
    if (t < DATE_MIN || t > DATE_MAX) {
      t = Math.min(Math.max(t, DATE_MIN), DATE_MAX);
      setSpeed(0);
    }
    sim.date = new Date(t);
    return true;
  }
  return false;
}
