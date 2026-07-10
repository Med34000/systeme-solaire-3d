// Moments historiques & reconstitution Pale Blue Dot.

import * as THREE from 'three';
import { MOMENTS } from '../moments.js';
import { sim } from '../sim.js';
import { camera, controls } from '../scene.js';
import { bodyByKey, updatePositions } from '../world.js';
import { setSpeed } from '../time.js';
import { clearTrails } from '../drift.js';
import { showLeftPanel } from '../panels.js';
import { focusBody } from '../focus.js';
import { hidePBD, showPBD } from '../pbd-ui.js';

export { hidePBD };

export function paleBlueDot() {
  sim.date = new Date(Date.UTC(1990, 1, 14, 4, 48));
  sim.syncedToNow = false;
  setSpeed(0);
  clearTrails();
  updatePositions(sim.date);
  sim.followBody = null;
  sim.selectedBody = null;
  sim.focusTimer = 0;
  sim.overviewTimer = 0;
  controls.minDistance = 2;
  document.getElementById('goto-select').value = '';
  const vp = bodyByKey.get('Voyager1').group.getWorldPosition(new THREE.Vector3());
  const ep = bodyByKey.get('Earth').group.getWorldPosition(new THREE.Vector3());
  const away = vp.clone().sub(ep).normalize();
  camera.position.copy(vp).addScaledVector(away, 6).add(new THREE.Vector3(0, 2, 0));
  controls.target.copy(ep);
  showLeftPanel('');
  showPBD();
}

let historyRendered = false;

export function renderHistory() {
  if (historyRendered) return;
  historyRendered = true;
  const list = document.getElementById('history-list');
  for (const m of MOMENTS) {
    const row = document.createElement('div');
    row.className = 'event-row';
    const icon = document.createElement('div');
    icon.className = 'event-icon';
    icon.textContent = m.icon;
    const main = document.createElement('div');
    main.className = 'event-main';
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = m.title;
    const desc = document.createElement('div');
    desc.className = 'event-desc';
    desc.textContent = m.desc;
    main.append(date, title, desc);
    const go = document.createElement('button');
    go.className = 'event-go';
    go.textContent = m.pbd ? '📸 Revivre' : '▶ Voir';
    go.addEventListener('click', () => {
      if (m.pbd) { paleBlueDot(); return; }
      sim.date = new Date(m.date);
      sim.syncedToNow = false;
      setSpeed(0);
      clearTrails();
      const b = bodyByKey.get(m.focus);
      if (b) focusBody(b);
    });
    row.append(icon, main, go);
    list.appendChild(row);
  }
}

export function openHistoryPanel() {
  renderHistory();
  showLeftPanel('history');
}
