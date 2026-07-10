// Course de la lumière : onde se propageant depuis le Soleil.

import * as THREE from 'three';
import { PLANETS, AU_KM } from '../data.js';
import { AU_LIGHT_S, scaleDist } from '../scale.js';
import { sim } from '../sim.js';
import { scene, systemGroup } from '../scene.js';
import { helioReal, bodyByKey, voyagerBodies } from '../world.js';
import { starSpriteTexture } from '../textures.js';
import { showLeftPanel, onPanelClose } from '../panels.js';

const lightClockEl = document.getElementById('light-clock');
const lightListEl = document.getElementById('light-list');
const lightCompareEl = document.getElementById('light-compare');

const lightSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 48, 24),
  new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }),
);
const ringPts = [];
for (let i = 0; i < 128; i++) {
  const a = (i / 128) * Math.PI * 2;
  ringPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
}
const lightRing = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(ringPts),
  new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 }),
);
lightSphere.visible = lightRing.visible = false;
systemGroup.add(lightSphere, lightRing);

const flashes = [];
const flashTexture = starSpriteTexture();
const _flashPos = new THREE.Vector3();

function spawnFlash(worldPos) {
  const mat = new THREE.SpriteMaterial({
    map: flashTexture, color: 0xffe9a8,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.position.copy(worldPos);
  scene.add(s);
  flashes.push({ sprite: s, t: 0 });
}

function fmtLight(sec) {
  if (sec < 90) return `${Math.round(sec)} s`;
  if (sec < 5400) return `${Math.floor(sec / 60)} min ${String(Math.round(sec % 60)).padStart(2, '0')} s`;
  return `${Math.floor(sec / 3600)} h ${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')} min`;
}

function fmtTravel(km, kmh) {
  const hours = km / kmh;
  const years = hours / 8766;
  if (years >= 1) return `${Math.round(years).toLocaleString('fr-FR')} ans`;
  const days = hours / 24;
  return days >= 2 ? `${Math.round(days)} jours` : `${Math.round(hours)} h`;
}

export function launchLight() {
  const targets = [];
  for (const p of PLANETS) {
    const h = helioReal.get(p.key);
    targets.push({ key: p.key, name: p.name, icon: '🪐', distAU: Math.hypot(h.x, h.y, h.z), hit: false });
  }
  for (const vb of voyagerBodies) {
    const h = helioReal.get(vb.data.key);
    if (h) targets.push({ key: vb.data.key, name: vb.data.name, icon: '🛰️', distAU: Math.hypot(h.x, h.y, h.z), hit: false });
  }
  targets.sort((a, b) => a.distAU - b.distAU);
  sim.lightRace = { t: 0, targets, done: false };
  lightListEl.innerHTML = '';
  for (const tg of targets) {
    const row = document.createElement('div');
    row.className = 'light-row';
    row.id = `lr-${tg.key}`;
    row.innerHTML = `<span class="light-name">${tg.icon} ${tg.name}</span><span class="light-eta">prévu : ${fmtLight(tg.distAU * AU_LIGHT_S)}</span>`;
    lightListEl.appendChild(row);
  }
  lightCompareEl.textContent = '';
  lightSphere.visible = lightRing.visible = true;
  lightSphere.scale.setScalar(0.01);
  lightRing.scale.setScalar(0.01);
}

export function stopLightRace() {
  sim.lightRace = null;
  lightSphere.visible = lightRing.visible = false;
  lightClockEl.textContent = '—';
}

function lightHit(tg) {
  tg.hit = true;
  const row = document.getElementById(`lr-${tg.key}`);
  if (row) {
    row.classList.add('hit');
    row.querySelector('.light-eta').textContent = `✓ atteint en ${fmtLight(tg.distAU * AU_LIGHT_S)}`;
  }
  const b = bodyByKey.get(tg.key);
  if (b) spawnFlash(b.group.getWorldPosition(_flashPos));
  const km = tg.distAU * AU_KM;
  lightCompareEl.innerHTML = `Jusqu'à <b>${tg.name}</b> : 🌟 lumière ${fmtLight(tg.distAU * AU_LIGHT_S)} · 🚀 fusée la plus rapide ${fmtTravel(km, 58000)} · ✈️ avion ${fmtTravel(km, 900)} · 🚗 voiture ${fmtTravel(km, 130)}`;
}

export function tickLightRace(dt) {
  if (sim.lightRace && !sim.lightRace.done) {
    sim.lightRace.t += dt * sim.lightSpeed;
    const rAU = sim.lightRace.t / AU_LIGHT_S;
    const rd = scaleDist(Math.max(rAU, 1e-4));
    lightSphere.scale.setScalar(rd);
    lightRing.scale.setScalar(rd);
    for (const tg of sim.lightRace.targets) {
      if (!tg.hit && tg.distAU <= rAU) lightHit(tg);
    }
    const last = sim.lightRace.targets[sim.lightRace.targets.length - 1];
    if (last.hit && rAU > last.distAU * 1.15) sim.lightRace.done = true;
  }

  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.t += dt;
    f.sprite.scale.setScalar(2 + f.t * 22);
    f.sprite.material.opacity = Math.max(0, 0.95 * (1 - f.t / 0.9));
    if (f.t > 0.9) {
      scene.remove(f.sprite);
      f.sprite.material.dispose();
      flashes.splice(i, 1);
    }
  }
}

export function refreshLightClock() {
  if (!sim.lightRace) return;
  const rAU = sim.lightRace.t / AU_LIGHT_S;
  lightClockEl.textContent = `⏱ ${fmtLight(sim.lightRace.t)} de lumière — ${rAU.toLocaleString('fr-FR', { maximumFractionDigits: rAU < 2 ? 3 : 1 })} UA`;
}

export function openLightPanel() {
  showLeftPanel('light');
}

export function setupLightRace() {
  document.querySelectorAll('.light-speeds button').forEach((btn) => {
    btn.addEventListener('click', () => {
      sim.lightSpeed = Number(btn.dataset.lspeed);
      document.querySelectorAll('.light-speeds button').forEach((b2) => b2.classList.toggle('active', b2 === btn));
    });
  });
  document.getElementById('light-launch').addEventListener('click', launchLight);
  onPanelClose('light-panel', stopLightRace);
}
