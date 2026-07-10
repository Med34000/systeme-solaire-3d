// Sélection d'astres, fiches info, caméra.

import * as THREE from 'three';
import { AU_KM, PLANETS, MOONS } from './data.js';
import { VOYAGERS } from './spacecraft.js';
import { AU_LIGHT_S } from './scale.js';
import { sim } from './sim.js';
import { camera, controls, renderer } from './scene.js';
import { bodyByKey, helioReal, clickableMeshes, setSelectBodyHandler } from './world.js';
import { showLeftPanel, leftPanels } from './panels.js';
import { hidePBD } from './pbd-ui.js';
import { overviewCamPosition } from './scale.js';

export const prevFollowPos = new THREE.Vector3();
const _wp = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _overviewCam = new THREE.Vector3();

const infoPanel = leftPanels.info;
const infoTable = document.getElementById('info-table');
const gotoSelect = document.getElementById('goto-select');

function fmtAU(au) {
  const km = au * AU_KM;
  if (au < 0.001) return `${Math.round(km).toLocaleString('fr-FR')} km`;
  const kmStr = km >= 1e6
    ? `${(km / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M km`
    : `${Math.round(km).toLocaleString('fr-FR')} km`;
  return `${au.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} UA (${kmStr})`;
}

function fmtLightTime(au) {
  const s = au * AU_LIGHT_S;
  if (s < 90) return `${Math.round(s)} s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')} min`;
}

export function showInfo(body) {
  const d = body.data;
  document.getElementById('info-name').textContent = d.name;
  document.getElementById('info-type').textContent = d.type;
  document.getElementById('info-desc').textContent = d.desc;
  infoTable.innerHTML = '';
  for (const [k, v] of Object.entries(d.info)) {
    const tr = infoTable.insertRow();
    tr.insertCell().textContent = k;
    tr.insertCell().textContent = v;
  }
  sim.liveRows = {};
  if (d.key !== 'Sun') {
    const tr1 = infoTable.insertRow(); tr1.className = 'live-row';
    tr1.insertCell().textContent = '☀ Distance au Soleil';
    sim.liveRows.sun = tr1.insertCell();
  }
  if (d.key !== 'Earth') {
    const tr2 = infoTable.insertRow(); tr2.className = 'live-row';
    tr2.insertCell().textContent = '🌍 Distance à la Terre';
    sim.liveRows.earth = tr2.insertCell();
  }
  if (d.isSpacecraft) {
    const tr3 = infoTable.insertRow(); tr3.className = 'live-row';
    tr3.insertCell().textContent = '⏱ Trajet de la lumière';
    sim.liveRows.light = tr3.insertCell();
  }
  showLeftPanel('info');
  updateLiveRows(body);
}

export function updateLiveRows(body) {
  if (!sim.liveRows) return;
  const p = helioReal.get(body.data.key);
  if (!p) return;
  if (sim.liveRows.sun) {
    sim.liveRows.sun.textContent = fmtAU(Math.hypot(p.x, p.y, p.z));
  }
  if (sim.liveRows.earth || sim.liveRows.light) {
    const e = helioReal.get('Earth');
    const dAU = Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z);
    if (sim.liveRows.earth) sim.liveRows.earth.textContent = fmtAU(dAU);
    if (sim.liveRows.light) sim.liveRows.light.textContent = fmtLightTime(dAU);
  }
}

export function focusBody(body) {
  hidePBD();
  sim.followBody = body;
  sim.focusTimer = 1.3;
  sim.overviewTimer = 0;
  body.group.getWorldPosition(prevFollowPos);
  controls.minDistance = Math.max(body.data.displayR * 1.5, 0.5);
  gotoSelect.value = body.data.key;
}

export function selectBody(body) {
  sim.selectedBody = body;
  focusBody(body);
  showInfo(body);
}

export function goOverview() {
  hidePBD();
  sim.followBody = null;
  sim.selectedBody = null;
  sim.focusTimer = 0;
  sim.overviewTimer = 1.6;
  controls.minDistance = 2;
  infoPanel.classList.remove('visible');
  sim.liveRows = null;
  gotoSelect.value = '';
}

export function tickCamera(dt, systemGroup) {
  if (sim.followBody) {
    sim.followBody.group.getWorldPosition(_wp);
    _delta.copy(_wp).sub(prevFollowPos);
    camera.position.add(_delta);
    controls.target.copy(_wp);
    prevFollowPos.copy(_wp);
    if (sim.focusTimer > 0) {
      sim.focusTimer -= dt;
      const desired = Math.max(sim.followBody.data.displayR * 6, 3.5);
      _dir.copy(camera.position).sub(_wp).normalize();
      _desired.copy(_wp).addScaledVector(_dir, desired);
      camera.position.lerp(_desired, 0.06);
    }
  } else if (sim.overviewTimer > 0) {
    sim.overviewTimer -= dt;
    controls.target.lerp(systemGroup.position, 0.05);
    overviewCamPosition(_overviewCam).add(systemGroup.position);
    camera.position.lerp(_overviewCam, 0.05);
  }
}

export function setupFocusUI() {
  setSelectBodyHandler(selectBody);

  document.getElementById('overview-btn').addEventListener('click', goOverview);

  {
    const optSun = document.createElement('option');
    optSun.value = 'Sun'; optSun.textContent = '☀️ Soleil';
    gotoSelect.appendChild(optSun);
    for (const p of PLANETS) {
      const o = document.createElement('option');
      o.value = p.key; o.textContent = `🪐 ${p.name}`;
      gotoSelect.appendChild(o);
    }
    for (const m of MOONS) {
      const o = document.createElement('option');
      o.value = m.key; o.textContent = `　${m.icon || '🌙'} ${m.name}`;
      gotoSelect.appendChild(o);
    }
    for (const v of VOYAGERS) {
      const o = document.createElement('option');
      o.value = v.key; o.textContent = `🛰️ ${v.name}`;
      gotoSelect.appendChild(o);
    }
  }
  gotoSelect.addEventListener('change', () => {
    const b = bodyByKey.get(gotoSelect.value);
    if (b) selectBody(b);
  });

  // Clic sur un astre (distingue clic et rotation de caméra)
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return;
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickableMeshes, false);
    if (hits.length) selectBody(hits[0].object.userData.body);
  });
}
