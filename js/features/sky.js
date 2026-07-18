// Ciel local : planètes au-dessus de l'horizon.

import { skyReport } from '../planetarium.js';
import { sim } from '../sim.js';
import { showLeftPanel, leftPanels } from '../panels.js';

export let skyCoords = { lat: 46.39, lon: 6.86, label: 'Le Bouveret (par défaut)' };
try {
  const saved = JSON.parse(localStorage.getItem('skyCoords'));
  if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) skyCoords = saved;
} catch { /* stockage local indisponible */ }

const skyLocation = document.getElementById('sky-location');
const skySummary = document.getElementById('sky-summary');
const skyList = document.getElementById('sky-list');
const fmtHour = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function renderSky() {
  const r = skyReport(sim.date, skyCoords.lat, skyCoords.lon);
  skyLocation.textContent = `📍 ${skyCoords.label} · ${sim.date.toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })}`;
  const parts = [];
  if (r.sun.up) {
    parts.push('☀️ Il fait jour' + (r.sun.evt ? ` (coucher du soleil à ${fmtHour(r.sun.evt.date)})` : '') + '. Les astres ci-dessous seront visibles à la nuit tombée.');
  } else {
    parts.push('🌙 Il fait nuit' + (r.sun.evt ? ` (lever du soleil à ${fmtHour(r.sun.evt.date)})` : '') + '.');
  }
  if (r.moon) parts.push(`Lune : ${r.moon.name}, ${Math.round(r.moon.fraction * 100)} % éclairée.`);
  skySummary.textContent = parts.join(' ');
  skyList.innerHTML = '';
  for (const row of r.rows) {
    const div = document.createElement('div');
    div.className = 'sky-row ' + (row.up ? 'sky-up' : 'sky-down');
    const name = document.createElement('div');
    name.className = 'sky-name';
    name.textContent = row.name;
    const detail = document.createElement('div');
    detail.className = 'sky-detail';
    if (row.up) {
      detail.textContent = `${row.dir}, ${Math.round(row.altitude)}° de hauteur`
        + (row.mag !== null ? `, mag ${row.mag.toFixed(1)}` : '')
        + (row.evt ? ` · se couche à ${fmtHour(row.evt.date)}` : '');
    } else {
      detail.textContent = 'sous l’horizon' + (row.evt ? ` · se lève à ${fmtHour(row.evt.date)}` : '');
    }
    div.append(name, detail);
    skyList.appendChild(div);
  }
}

export function openSkyPanel() {
  renderSky();
  showLeftPanel('sky');
}

export function isSkyPanelVisible() {
  return leftPanels.sky.classList.contains('visible');
}

export function setupSky() {
  document.getElementById('geo-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
      skyLocation.textContent = `📍 Géolocalisation indisponible · ${skyCoords.label}`;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        skyCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
        };
        try { localStorage.setItem('skyCoords', JSON.stringify(skyCoords)); } catch { /* — */ }
        renderSky();
      },
      () => { skyLocation.textContent = `📍 Position refusée · ${skyCoords.label}`; },
    );
  });
}
