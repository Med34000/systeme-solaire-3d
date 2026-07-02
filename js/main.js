// Système Solaire 3D — positions réelles calculées par astronomy-engine (VSOP87/NOVAS).
// Échelle compressée : directions angulaires exactes, distances radiales en loi de puissance
// pour que tout reste visible à l'écran.

import * as THREE from 'three';
import { OrbitControls } from '../libs/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../libs/CSS2DRenderer.js';
import { SUN, PLANETS, MOONS, AU_KM } from './data.js';
import { bodyTexture, ringTexture, glowTexture, starSpriteTexture } from './textures.js';

const A = window.Astronomy;

// ---------- Échelle d'affichage ----------
const DIST_C = 60, DIST_P = 0.45;           // distance affichée = 60 × (AU)^0.45
const scaleDist = (au) => DIST_C * Math.pow(Math.max(au, 1e-6), DIST_P);

// Rotation repère équatorial J2000 → écliptique (calculée une seule fois)
const EQJ_TO_ECL = A.Rotation_EQJ_ECL();
function eqjToEclVec(v) {
  const r = A.RotateVector(EQJ_TO_ECL, { x: v.x, y: v.y, z: v.z, t: v.t ?? null });
  return r;
}
// Écliptique (z = nord) → Three.js (y = haut)
const eclToThree = (v, out) => out.set(v.x, v.z, -v.y);

// ---------- Scène ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 30000);
camera.position.set(0, 260, 430);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 4000;

scene.add(new THREE.AmbientLight(0x445577, 0.5));
// decay = 0 : pas d'atténuation, sinon les planètes lointaines seraient invisibles
const sunLight = new THREE.PointLight(0xfff2d8, 1.8, 0, 0);
sunLight.decay = 0;

// Groupe contenant tout le système solaire : en mode « dérive galactique »,
// c'est lui qui se déplace vers l'apex solaire.
const systemGroup = new THREE.Group();
scene.add(systemGroup);
systemGroup.add(sunLight);

// ---------- Champ d'étoiles ----------
{
  const N = 4500;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const tints = [[1, 1, 1], [0.8, 0.87, 1], [1, 0.92, 0.8], [1, 0.85, 0.85], [0.85, 1, 0.95]];
  for (let i = 0; i < N; i++) {
    // répartition uniforme sur une coquille sphérique
    const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u), r = 6000 + Math.random() * 4000;
    pos[i * 3] = r * s * Math.cos(ph); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(ph);
    const t = tints[(Math.random() * tints.length) | 0], b = 0.4 + Math.random() * 0.6;
    col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: 14, map: starSpriteTexture(), vertexColors: true,
    transparent: true, depthWrite: false, sizeAttenuation: true,
  });
  scene.add(new THREE.Points(g, m));
}

// ---------- Construction des astres ----------
const bodies = [];            // { data, group, mesh, tiltGroup, label, isMoon, parentBody }
const bodyByKey = new Map();
const orbitLines = [];
const clickableMeshes = [];

function makeLabel(text, isMoon, body) {
  const div = document.createElement('div');
  div.className = 'body-label' + (isMoon ? ' moon-label' : '');
  div.textContent = text;
  div.addEventListener('pointerdown', (e) => e.stopPropagation());
  div.addEventListener('click', (e) => { e.stopPropagation(); selectBody(body); });
  return new CSS2DObject(div);
}

function buildBody(data, { isMoon = false, parentBody = null } = {}) {
  const group = new THREE.Group();
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.tiltDeg || 0);
  group.add(tiltGroup);

  const isSun = data.key === 'Sun';
  const mat = isSun
    ? new THREE.MeshBasicMaterial({ map: bodyTexture('Sun') })
    : new THREE.MeshLambertMaterial({ map: bodyTexture(data.key) });
  const segs = isMoon ? [32, 24] : [64, 48];
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.displayR, segs[0], segs[1]), mat);
  tiltGroup.add(mesh);

  const body = { data, group, tiltGroup, mesh, isMoon, parentBody, spinRate: 0 };
  if (data.rotHours) body.spinRate = (2 * Math.PI) / (data.rotHours * 3600);

  const label = makeLabel(data.name, isMoon, body);
  label.position.set(0, data.displayR + (isMoon ? 0.9 : 2.2), 0);
  group.add(label);
  body.label = label;

  mesh.userData.body = body;
  clickableMeshes.push(mesh);

  // Anneaux
  if (data.hasRings) {
    const faint = data.hasRings === 'faint';
    const inner = data.displayR * 1.35, outer = data.displayR * 2.35;
    const geo = new THREE.RingGeometry(inner, outer, 128, 1);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    geo.rotateX(-Math.PI / 2);
    const rm = new THREE.MeshBasicMaterial({
      map: ringTexture(faint), side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    tiltGroup.add(new THREE.Mesh(geo, rm));
  }

  bodies.push(body);
  bodyByKey.set(data.key, body);
  return body;
}

// Soleil
const sunBody = buildBody(SUN);
systemGroup.add(sunBody.group);
{
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  glow.scale.setScalar(SUN.displayR * 7);
  sunBody.group.add(glow);
}

// Planètes
for (const p of PLANETS) {
  const b = buildBody(p);
  systemGroup.add(b.group);
}

// Lunes — attachées au groupe de leur planète parente
for (const m of MOONS) {
  const parent = bodyByKey.get(m.parent);
  const b = buildBody(m, { isMoon: true, parentBody: parent });
  if (m.source === 'circular') {
    parent.tiltGroup.add(b.group);   // Titan : dans le plan des anneaux de Saturne
  } else {
    parent.group.add(b.group);
  }
}

// ---------- Lignes d'orbites ----------
const orbitMat = (color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
const _v = new THREE.Vector3();

function addOrbitLine(points, color, parentObj) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.LineLoop(geo, orbitMat(color));
  (parentObj || systemGroup).add(line);
  orbitLines.push(line);
  return line;
}

function buildOrbits() {
  const now = A.MakeTime(new Date());
  // Orbites planétaires : échantillonnage de la vraie trajectoire sur une période
  for (const p of PLANETS) {
    const pts = [];
    const N = 256;
    for (let i = 0; i < N; i++) {
      const t = now.AddDays(-p.periodDays + (i * p.periodDays) / N);
      const ecl = eqjToEclVec(A.HelioVector(A.Body[p.astroBody], t));
      const r = Math.hypot(ecl.x, ecl.y, ecl.z);
      const k = scaleDist(r) / r;
      pts.push(new THREE.Vector3(ecl.x * k, ecl.z * k, -ecl.y * k));
    }
    addOrbitLine(pts, p.orbitColor, null);
  }
  // Orbites des lunes : trajectoire réelle normalisée à la distance d'affichage
  for (const m of MOONS) {
    const parent = bodyByKey.get(m.parent);
    const pts = [];
    const N = 128;
    for (let i = 0; i < N; i++) {
      const t = now.AddDays((i * m.periodDays) / N);
      const dir = moonDirection(m, t);
      pts.push(dir.multiplyScalar(m.displayDist));
    }
    const holder = m.source === 'circular' ? parent.tiltGroup : parent.group;
    addOrbitLine(pts, 0x5a7396, holder);
  }
}

// Direction unitaire (repère Three) d'une lune par rapport à sa planète
function moonDirection(m, time) {
  let vx, vy, vz;
  if (m.source === 'geomoon') {
    const g = eqjToEclVec(A.GeoMoon(time));
    vx = g.x; vy = g.y; vz = g.z;
  } else if (m.source === 'jupiter') {
    const jm = A.JupiterMoons(time);
    const sv = jm[m.jmIndex] ?? jm.moon?.[{ io: 0, europa: 1, ganymede: 2, callisto: 3 }[m.jmIndex]];
    const g = eqjToEclVec(sv);
    vx = g.x; vy = g.y; vz = g.z;
  } else {
    // Titan : orbite circulaire approchée dans le plan équatorial de Saturne
    const angle = 2 * Math.PI * ((time.ut / m.periodDays) % 1) + 1.32;
    return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  }
  const len = Math.hypot(vx, vy, vz) || 1;
  return new THREE.Vector3(vx / len, vz / len, -vy / len);
}

// ---------- Positions en temps réel ----------
const helioReal = new Map();   // key → position héliocentrique réelle (AU, écliptique)

function updatePositions(date) {
  const time = A.MakeTime(date);

  helioReal.set('Sun', { x: 0, y: 0, z: 0 });

  for (const p of PLANETS) {
    const b = bodyByKey.get(p.key);
    const ecl = eqjToEclVec(A.HelioVector(A.Body[p.astroBody], time));
    helioReal.set(p.key, ecl);
    const r = Math.hypot(ecl.x, ecl.y, ecl.z);
    const k = scaleDist(r) / r;
    b.group.position.set(ecl.x * k, ecl.z * k, -ecl.y * k);
  }

  let jmCache = null;
  for (const m of MOONS) {
    const b = bodyByKey.get(m.key);
    const parentEcl = helioReal.get(m.parent);

    if (m.source === 'geomoon') {
      const g = eqjToEclVec(A.GeoMoon(time));
      helioReal.set(m.key, { x: parentEcl.x + g.x, y: parentEcl.y + g.y, z: parentEcl.z + g.z });
      b.group.position.copy(moonDirection(m, time).multiplyScalar(m.displayDist));
    } else if (m.source === 'jupiter') {
      if (!jmCache) jmCache = A.JupiterMoons(time);
      const sv = jmCache[m.jmIndex] ?? jmCache.moon?.[{ io: 0, europa: 1, ganymede: 2, callisto: 3 }[m.jmIndex]];
      const g = eqjToEclVec(sv);
      helioReal.set(m.key, { x: parentEcl.x + g.x, y: parentEcl.y + g.y, z: parentEcl.z + g.z });
      const len = Math.hypot(g.x, g.y, g.z) || 1;
      b.group.position.set(g.x / len, g.z / len, -g.y / len).multiplyScalar(m.displayDist);
    } else {
      b.group.position.copy(moonDirection(m, time).multiplyScalar(m.displayDist));
      helioReal.set(m.key, parentEcl); // approximation suffisante pour les distances affichées
    }
  }
}

// ---------- Temps simulé ----------
let simDate = new Date();
let speed = 1;                 // multiplicateur : secondes simulées / seconde réelle
let direction = 1;
let syncedToNow = true;        // suit l'horloge système en continu
const DATE_MIN = Date.UTC(1600, 0, 1), DATE_MAX = Date.UTC(2500, 0, 1);

const simDateEl = document.getElementById('sim-date');
const liveBadge = document.getElementById('live-badge');

function setSpeed(s) {
  speed = s;
  syncedToNow = (s === 1 && direction === 1 && Math.abs(simDate - Date.now()) < 5000);
  document.querySelectorAll('#time-controls button[data-speed]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.speed) === s);
  });
  updateBadge();
}

function updateBadge() {
  if (syncedToNow && speed === 1 && direction === 1) {
    liveBadge.textContent = '● TEMPS RÉEL';
    liveBadge.classList.remove('off');
  } else if (speed === 0) {
    liveBadge.textContent = '⏸ PAUSE';
    liveBadge.classList.add('off');
  } else {
    const dir = direction === -1 ? '⏪ ' : '';
    liveBadge.textContent = `${dir}SIMULATION ×${speed.toLocaleString('fr-FR')}`;
    liveBadge.classList.add('off');
  }
}

document.querySelectorAll('#time-controls button[data-speed]').forEach((btn) => {
  btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)));
});

document.getElementById('reverse-btn').addEventListener('click', (e) => {
  direction *= -1;
  syncedToNow = false;
  e.target.classList.toggle('active', direction === -1);
  updateBadge();
});

document.getElementById('now-btn').addEventListener('click', () => {
  simDate = new Date();
  direction = 1;
  document.getElementById('reverse-btn').classList.remove('active');
  setSpeed(1);
  syncedToNow = true;
  updateBadge();
  clearTrails();
});

const dateInput = document.getElementById('date-input');
function syncDateInput() {
  const d = simDate;
  const pad = (n) => String(n).padStart(2, '0');
  dateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
syncDateInput();

document.getElementById('go-date-btn').addEventListener('click', () => {
  if (!dateInput.value) return;
  const d = new Date(dateInput.value);
  if (isNaN(d)) return;
  simDate = new Date(Math.min(Math.max(d.getTime(), DATE_MIN), DATE_MAX));
  syncedToNow = false;
  updateBadge();
  clearTrails();
});

// ---------- Sélection & caméra ----------
let followBody = null;
let focusTimer = 0;
let overviewTimer = 0;
const prevFollowPos = new THREE.Vector3();
const _wp = new THREE.Vector3();

const infoPanel = document.getElementById('info-panel');
const infoTable = document.getElementById('info-table');
let liveRows = null;

function showInfo(body) {
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
  liveRows = {};
  if (d.key !== 'Sun') {
    const tr1 = infoTable.insertRow(); tr1.className = 'live-row';
    tr1.insertCell().textContent = '☀ Distance au Soleil';
    liveRows.sun = tr1.insertCell();
  }
  if (d.key !== 'Earth') {
    const tr2 = infoTable.insertRow(); tr2.className = 'live-row';
    tr2.insertCell().textContent = '🌍 Distance à la Terre';
    liveRows.earth = tr2.insertCell();
  }
  infoPanel.classList.add('visible');
  updateLiveRows(body);
}

function fmtAU(au) {
  const km = au * AU_KM;
  const kmStr = km >= 1e6
    ? `${(km / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M km`
    : `${Math.round(km).toLocaleString('fr-FR')} km`;
  return `${au.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} UA (${kmStr})`;
}

function updateLiveRows(body) {
  if (!liveRows) return;
  const p = helioReal.get(body.data.key);
  if (!p) return;
  if (liveRows.sun) {
    liveRows.sun.textContent = fmtAU(Math.hypot(p.x, p.y, p.z));
  }
  if (liveRows.earth) {
    const e = helioReal.get('Earth');
    liveRows.earth.textContent = fmtAU(Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z));
  }
}

document.getElementById('info-close').addEventListener('click', () => {
  infoPanel.classList.remove('visible');
  liveRows = null;
});

let selectedBody = null;
function selectBody(body) {
  selectedBody = body;
  followBody = body;
  focusTimer = 1.3;
  overviewTimer = 0;
  body.group.getWorldPosition(prevFollowPos);
  controls.minDistance = Math.max(body.data.displayR * 1.5, 0.5);
  showInfo(body);
  gotoSelect.value = body.data.key;
}

function goOverview() {
  followBody = null;
  selectedBody = null;
  focusTimer = 0;
  overviewTimer = 1.6;
  controls.minDistance = 2;
  infoPanel.classList.remove('visible');
  liveRows = null;
  gotoSelect.value = '';
}
document.getElementById('overview-btn').addEventListener('click', goOverview);

// Menu « Aller à »
const gotoSelect = document.getElementById('goto-select');
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
    o.value = m.key; o.textContent = `　🌙 ${m.name}`;
    gotoSelect.appendChild(o);
  }
}
gotoSelect.addEventListener('change', () => {
  const b = bodyByKey.get(gotoSelect.value);
  if (b) selectBody(b);
});

// Clic sur un astre (en distinguant clic et rotation de caméra)
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

// ---------- Options d'affichage ----------
document.getElementById('toggle-orbits').addEventListener('change', (e) => {
  orbitLines.forEach((l) => (l.visible = e.target.checked));
});
document.getElementById('toggle-labels').addEventListener('change', (e) => {
  bodies.forEach((b) => (b.label.visible = e.target.checked));
});
document.getElementById('toggle-moons').addEventListener('change', (e) => {
  const show = e.target.checked;
  bodies.filter((b) => b.isMoon).forEach((b) => (b.group.visible = show));
});

// ---------- Dérive galactique ----------
// Le Soleil se déplace à ~230 km/s autour du centre galactique, en direction de
// l'apex solaire (RA 18h, Dec +30°, vers Hercule/Véga). Vitesse d'affichage
// stylisée, comme les distances — sinon rien ne bougerait à l'œil nu.
let driftEnabled = false;
let driftEpochMs = 0;
const DRIFT_UNITS_PER_YEAR = 140;
const driftDir = (() => {
  const dec = THREE.MathUtils.degToRad(30);
  const eq = { x: 0, y: -Math.cos(dec), z: Math.sin(dec), t: null }; // RA 270°, Dec +30°
  const ecl = A.RotateVector(EQJ_TO_ECL, eq);
  return new THREE.Vector3(ecl.x, ecl.z, -ecl.y).normalize();
})();

// Traînées hélicoïdales derrière le Soleil et les planètes.
// Buffer préalloué : aucune allocation pendant l'animation.
const TRAIL_MAX = 700;
const trails = [];
{
  const defs = [{ body: () => sunBody, color: 0xffd27f }]
    .concat(PLANETS.map((p) => ({ body: () => bodyByKey.get(p.key), color: p.orbitColor })));
  for (const d of defs) {
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.55 })
    );
    line.frustumCulled = false;
    line.visible = false;
    scene.add(line);
    trails.push({ getBody: d.body, line, count: 0, last: new THREE.Vector3(), hasLast: false });
  }
}

function clearTrails() {
  for (const t of trails) {
    t.count = 0;
    t.hasLast = false;
    t.line.visible = false;
    t.line.geometry.setDrawRange(0, 0);
  }
}

const _tw = new THREE.Vector3();
function updateTrails() {
  for (const t of trails) {
    t.getBody().group.getWorldPosition(_tw);
    if (t.hasLast && _tw.distanceToSquared(t.last) <= 1.4) continue;
    t.last.copy(_tw);
    t.hasLast = true;
    const attr = t.line.geometry.attributes.position;
    if (t.count === TRAIL_MAX) {
      attr.array.copyWithin(0, 3); // décale d'un point : le plus ancien disparaît
      t.count--;
    }
    attr.array[t.count * 3] = _tw.x;
    attr.array[t.count * 3 + 1] = _tw.y;
    attr.array[t.count * 3 + 2] = _tw.z;
    t.count++;
    attr.needsUpdate = true;
    t.line.geometry.setDrawRange(0, t.count);
    if (t.count > 1) t.line.visible = true;
  }
}

const driftNote = document.getElementById('drift-note');
document.getElementById('toggle-drift').addEventListener('change', (e) => {
  driftEnabled = e.target.checked;
  driftNote.classList.toggle('visible', driftEnabled);
  if (driftEnabled) {
    driftEpochMs = simDate.getTime();
    // En temps réel la dérive est invisible : on accélère automatiquement
    if (speed <= 3600) { syncedToNow = false; setSpeed(604800); }
  } else {
    const off = systemGroup.position.clone();
    systemGroup.position.set(0, 0, 0);
    if (!followBody) { camera.position.sub(off); controls.target.sub(off); }
    if (followBody) followBody.group.getWorldPosition(prevFollowPos);
    clearTrails();
  }
});

// ---------- Boucle d'animation ----------
const clock = new THREE.Clock();
let liveRowTimer = 0;
let lastSimMs = NaN;
const DEFAULT_CAM = new THREE.Vector3(0, 260, 430);
const _origin = new THREE.Vector3(0, 0, 0);

buildOrbits();
updatePositions(simDate);
document.getElementById('loading').remove();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Avance du temps simulé
  if (syncedToNow && speed === 1 && direction === 1) {
    simDate = new Date();
  } else if (speed !== 0) {
    let t = simDate.getTime() + dt * speed * direction * 1000;
    if (t < DATE_MIN || t > DATE_MAX) { t = Math.min(Math.max(t, DATE_MIN), DATE_MAX); setSpeed(0); }
    simDate = new Date(t);
  }

  // Positions recalculées uniquement si le temps simulé a changé (pause = 0 calcul)
  const simMs = simDate.getTime();
  if (simMs !== lastSimMs) {
    lastSimMs = simMs;
    updatePositions(simDate);
  }

  // Dérive galactique : translation du système entier vers l'apex solaire
  if (driftEnabled) {
    const years = (simDate.getTime() - driftEpochMs) / (365.25 * 86400 * 1000);
    const newOffset = driftDir.clone().multiplyScalar(years * DRIFT_UNITS_PER_YEAR);
    const deltaDrift = newOffset.sub(systemGroup.position);
    systemGroup.position.add(deltaDrift);
    if (!followBody) {
      camera.position.add(deltaDrift);
      controls.target.add(deltaDrift);
    }
    updateTrails();
  }

  // Rotation propre des astres (bornée pour éviter le stroboscope aux grandes vitesses)
  const simDt = dt * (speed === 0 ? 0 : speed);
  for (const b of bodies) {
    if (!b.spinRate) continue;
    const dr = b.spinRate * simDt * direction;
    b.mesh.rotation.y += THREE.MathUtils.clamp(dr, -0.25, 0.25);
  }

  // Suivi de l'astre sélectionné
  if (followBody) {
    followBody.group.getWorldPosition(_wp);
    const delta = _wp.clone().sub(prevFollowPos);
    camera.position.add(delta);
    controls.target.copy(_wp);
    prevFollowPos.copy(_wp);
    if (focusTimer > 0) {
      focusTimer -= dt;
      const desired = Math.max(followBody.data.displayR * 6, 3.5);
      const dir = camera.position.clone().sub(_wp).normalize();
      camera.position.lerp(_wp.clone().add(dir.multiplyScalar(desired)), 0.06);
    }
  } else if (overviewTimer > 0) {
    overviewTimer -= dt;
    controls.target.lerp(systemGroup.position, 0.05);
    camera.position.lerp(_origin.copy(DEFAULT_CAM).add(systemGroup.position), 0.05);
  }

  // Interface — rafraîchie 4×/s, inutile de formater des dates à chaque frame
  liveRowTimer += dt;
  if (liveRowTimer > 0.25) {
    liveRowTimer = 0;
    simDateEl.textContent = simDate.toLocaleString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    if (selectedBody && liveRows) updateLiveRows(selectedBody);
    if (document.activeElement !== dateInput) syncDateInput();
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
