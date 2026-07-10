// Ciel de naissance + time-lapse de vie.

import { skyReport } from '../planetarium.js';
import { sim, DATE_MIN, DATE_MAX, LAPSE_DUR } from '../sim.js';
import { controls } from '../scene.js';
import { setSpeed, updateBadge } from '../time.js';
import { clearTrails } from '../drift.js';
import { showLeftPanel } from '../panels.js';
import { hidePBD } from '../pbd-ui.js';
import { skyCoords } from './sky.js';

const birthResult = document.getElementById('birth-result');
const liveBadge = document.getElementById('live-badge');
const lapseHud = document.getElementById('lapse-hud');
const lapseYearEl = document.getElementById('lapse-year');
const lapseToursEl = document.getElementById('lapse-tours');
const lapseLunesEl = document.getElementById('lapse-lunes');
const lapseGalEl = document.getElementById('lapse-gal');

const MOON_EMOJIS = {
  'nouvelle lune': '🌑', 'premier croissant': '🌒', 'premier quartier': '🌓',
  'gibbeuse croissante': '🌔', 'pleine lune': '🌕', 'gibbeuse décroissante': '🌖',
  'dernier quartier': '🌗', 'dernier croissant': '🌘',
};

export function startLapse() {
  if (!sim.lastBirthMs || sim.lastBirthMs > Date.now()) return;
  hidePBD();
  showLeftPanel('');
  sim.followBody = null;
  sim.selectedBody = null;
  sim.focusTimer = 0;
  sim.overviewTimer = 1.8;
  controls.minDistance = 2;
  document.getElementById('goto-select').value = '';
  setSpeed(0);
  sim.syncedToNow = false;
  clearTrails();
  sim.date = new Date(sim.lastBirthMs);
  sim.lapse = { t0: sim.lastBirthMs, t1: Date.now(), start: performance.now(), finished: false };
  liveBadge.textContent = '🎬 TIME-LAPSE DE TA VIE';
  liveBadge.classList.add('off');
  document.getElementById('lapse-end').style.display = 'none';
  lapseHud.classList.add('visible');
}

export function updateLapseHud(k) {
  if (!sim.lapse) return;
  const yrs = (sim.date.getTime() - sim.lapse.t0) / (365.25 * 86400e3);
  lapseYearEl.textContent = sim.date.getFullYear();
  lapseToursEl.textContent = Math.floor(yrs);
  lapseLunesEl.textContent = Math.floor(yrs * 12.368);
  lapseGalEl.textContent = Math.round(yrs * 7.26).toLocaleString('fr-FR');
  if (k >= 1 && !sim.lapse.finished) {
    sim.lapse.finished = true;
    document.getElementById('lapse-end').style.display = 'block';
  }
}

export function endLapse() {
  sim.lapse = null;
  lapseHud.classList.remove('visible');
  sim.date = new Date();
  sim.direction = 1;
  setSpeed(1);
  sim.syncedToNow = true;
  updateBadge();
}

export function openBirthPanel() {
  showLeftPanel('birth');
}

export function setupBirth() {
  document.getElementById('birth-go').addEventListener('click', () => {
    const dateVal = document.getElementById('birth-date').value;
    if (!dateVal) {
      birthResult.innerHTML = '<div class="birth-line">Choisis d’abord ta date de naissance ☝️</div>';
      return;
    }
    const timeVal = document.getElementById('birth-time').value || '12:00';
    const d = new Date(`${dateVal}T${timeVal}`);
    if (isNaN(d)) return;
    sim.lastBirthMs = d.getTime();

    sim.date = new Date(Math.min(Math.max(d.getTime(), DATE_MIN), DATE_MAX));
    sim.syncedToNow = false;
    setSpeed(0);
    clearTrails();
    sim.followBody = null;
    sim.selectedBody = null;
    sim.overviewTimer = 1.6;
    controls.minDistance = 2;
    document.getElementById('goto-select').value = '';

    const now = new Date();
    const years = (now - d) / (365.25 * 86400 * 1000);
    const lines = [];
    lines.push(`📅 <b>${d.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b> — voici la disposition des planètes ce jour-là, dans la vue 3D.`);
    if (years > 0.1) {
      lines.push(`🎂 Depuis, tu as bouclé <b>${Math.floor(years)} tours complets</b> autour du Soleil, soit <b>${Math.round(years * 0.94).toLocaleString('fr-FR')} milliards de km</b> parcourus à 107 000 km/h.`);
      lines.push(`🌌 Et le système solaire entier a filé de <b>${Math.round(years * 7.26).toLocaleString('fr-FR')} milliards de km</b> à travers la galaxie.`);
    } else if (years < -0.1) {
      lines.push('🔮 Cette date est dans le futur… un ciel de naissance en avant-première !');
    }
    try {
      const r = skyReport(d, skyCoords.lat, skyCoords.lon);
      if (r.moon) {
        lines.push(`${MOON_EMOJIS[r.moon.name] || '🌙'} La Lune était <b>${r.moon.name}</b>, éclairée à ${Math.round(r.moon.fraction * 100)} %.`);
      }
      const up = r.rows.filter((x) => x.up && x.key !== 'Moon').map((x) => `${x.name} (${x.dir})`);
      lines.push(up.length
        ? `🪐 Au-dessus de l’horizon (${skyCoords.label}) : <b>${up.join(', ')}</b>.`
        : `🪐 Aucune planète n’était au-dessus de l’horizon à cette heure-là (${skyCoords.label}).`);
    } catch { /* date hors plage */ }
    let html = lines.map((l) => `<div class="birth-line">${l}</div>`).join('');
    if (years > 0.1) html += '<button id="lapse-btn">🎬 Rejouer ma vie cosmique (15 s)</button>';
    birthResult.innerHTML = html;
    document.getElementById('lapse-btn')?.addEventListener('click', startLapse);
  });

  document.getElementById('lapse-close').addEventListener('click', endLapse);
}
