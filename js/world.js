// Construction du monde 3D : astres, orbites, positions en temps réel.

import * as THREE from 'three';
import { CSS2DObject } from '../libs/CSS2DRenderer.js';
import { SUN, PLANETS, MOONS, AU_KM } from './data.js';
import {
  bodyTexture, earthNightTexture, ringTexture, glowTexture, starSpriteTexture,
} from './textures.js';
import { VOYAGERS, voyagerPosition, voyagerPath } from './spacecraft.js';
import { buildISS, buildVoyager } from './models.js';
import { A, eqjToEclVec } from './coords.js';
import { scaleDist, moonOrbitUnits } from './scale.js';
import { systemGroup } from './scene.js';
import { QUALITY } from './quality.js';

export const bodies = [];
export const bodyByKey = new Map();
export const orbitLines = [];
export const clickableMeshes = [];
export const voyagerBodies = [];
/** Positions héliocentriques réelles (UA, écliptique). */
export const helioReal = new Map();

// Handler de sélection injecté par focus.js (évite une dépendance circulaire)
let _onSelectBody = () => {};
export function setSelectBodyHandler(fn) { _onSelectBody = fn; }

const _lookTarget = new THREE.Vector3();
const _sunDirection = new THREE.Vector3(1, 0, 0);
let earthNightMaterial = null;
let earthAtmosphereMaterial = null;
const sunGlowLayers = [];

function atmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x55b7ff) },
      sunDirection: { value: _sunDirection.clone() },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform vec3 sunDirection;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.6);
        float daylight = smoothstep(-0.45, 0.55, dot(normal, normalize(sunDirection)));
        float alpha = rim * mix(0.22, 0.82, daylight);
        gl_FragColor = vec4(glowColor * (0.7 + daylight * 0.45), alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
    toneMapped: false,
  });
}

function nightLightsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightsMap: { value: earthNightTexture(QUALITY.tier === 'high' ? 1024 : 512) },
      sunDirection: { value: _sunDirection.clone() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D lightsMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        float night = smoothstep(0.12, -0.30, dot(normalize(vWorldNormal), normalize(sunDirection)));
        vec4 lights = texture2D(lightsMap, vUv);
        float alpha = lights.a * night * 0.88;
        gl_FragColor = vec4(lights.rgb * night, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

function addEarthEffects(body) {
  if (QUALITY.atmosphere) {
    earthAtmosphereMaterial = atmosphereMaterial();
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(body.data.displayR * 1.065, ...QUALITY.planetSegments),
      earthAtmosphereMaterial,
    );
    atmosphere.renderOrder = 2;
    body.tiltGroup.add(atmosphere);
  }
  if (QUALITY.nightLights) {
    earthNightMaterial = nightLightsMaterial();
    const lights = new THREE.Mesh(
      new THREE.SphereGeometry(body.data.displayR * 1.006, ...QUALITY.planetSegments),
      earthNightMaterial,
    );
    lights.renderOrder = 3;
    body.mesh.add(lights);
  }
}

function makeLabel(text, isMoon, body) {
  const div = document.createElement('div');
  div.className = 'body-label' + (isMoon ? ' moon-label' : '');
  div.textContent = text;
  div.addEventListener('pointerdown', (e) => e.stopPropagation());
  div.addEventListener('click', (e) => { e.stopPropagation(); _onSelectBody(body); });
  return new CSS2DObject(div);
}

function buildBody(data, { isMoon = false, parentBody = null } = {}) {
  const group = new THREE.Group();
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.tiltDeg || 0);
  group.add(tiltGroup);

  let mesh;
  if (data.key === 'ISS') {
    mesh = buildISS();
  } else {
    const isSun = data.key === 'Sun';
    const mat = isSun
      ? new THREE.MeshBasicMaterial({ map: bodyTexture('Sun') })
      : new THREE.MeshLambertMaterial({ map: bodyTexture(data.key) });
    const segs = isMoon ? QUALITY.moonSegments : QUALITY.planetSegments;
    mesh = new THREE.Mesh(new THREE.SphereGeometry(data.displayR, segs[0], segs[1]), mat);
  }
  tiltGroup.add(mesh);

  const body = { data, group, tiltGroup, mesh, isMoon, parentBody, spinRate: 0 };
  if (data.rotHours) body.spinRate = (2 * Math.PI) / (data.rotHours * 3600);
  if (data.key === 'Earth') addEarthEffects(body);

  const label = makeLabel(data.name, isMoon, body);
  label.position.set(0, data.displayR + (isMoon ? 0.9 : 2.2), 0);
  group.add(label);
  body.label = label;

  if (data.key === 'ISS') {
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 8, 6),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.userData.body = body;
    tiltGroup.add(hit);
    clickableMeshes.push(hit);
  } else {
    mesh.userData.body = body;
    clickableMeshes.push(mesh);
  }

  if (data.hasRings) {
    const faint = data.hasRings === 'faint';
    const inner = data.displayR * 1.35, outer = data.displayR * 2.35;
    const geo = new THREE.RingGeometry(inner, outer, QUALITY.ringSegments, 1);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    geo.rotateX(-Math.PI / 2);
    const map = ringTexture(faint);
    const ring = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      map, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      opacity: faint ? 0.55 : 0.96, alphaTest: faint ? 0 : 0.015,
      emissive: faint ? 0x1c252b : 0x887865,
      emissiveMap: map,
      emissiveIntensity: faint ? 0.18 : 0.74,
    }));
    ring.renderOrder = 1;
    tiltGroup.add(ring);
  }

  bodies.push(body);
  bodyByKey.set(data.key, body);
  return body;
}

// Soleil
export const sunBody = buildBody(SUN);
systemGroup.add(sunBody.group);
{
  const glowMap = glowTexture();
  const configs = [
    { scale: 4.4, color: 0xfff5d2, opacity: 0.88, speed: 0.55 },
    { scale: 8.5, color: 0xffb45f, opacity: 0.34, speed: 0.31 },
    { scale: 15.5, color: 0xff7b35, opacity: 0.11, speed: 0.19 },
  ].slice(0, QUALITY.sunGlowLayers);
  for (const config of configs) {
    const material = new THREE.SpriteMaterial({
      map: glowMap, color: config.color, opacity: config.opacity,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.userData.glow = { ...config, baseScale: SUN.displayR * config.scale };
    sprite.scale.setScalar(sprite.userData.glow.baseScale);
    sunBody.group.add(sprite);
    sunGlowLayers.push(sprite);
  }
}

export function tickWorldVisuals(elapsed) {
  for (let i = 0; i < sunGlowLayers.length; i++) {
    const sprite = sunGlowLayers[i];
    const cfg = sprite.userData.glow;
    const pulse = 1 + Math.sin(elapsed * cfg.speed + i * 1.7) * 0.012;
    sprite.scale.setScalar(cfg.baseScale * pulse);
    sprite.material.opacity = cfg.opacity * (0.96 + Math.sin(elapsed * cfg.speed * 1.3 + i) * 0.04);
  }
}

for (const p of PLANETS) {
  systemGroup.add(buildBody(p).group);
}

for (const m of MOONS) {
  const parent = bodyByKey.get(m.parent);
  const b = buildBody(m, { isMoon: true, parentBody: parent });
  if (m.source === 'circular') parent.tiltGroup.add(b.group);
  else parent.group.add(b.group);
}

// Sondes Voyager
for (const v of VOYAGERS) {
  const group = new THREE.Group();
  const model = buildVoyager();
  group.add(model);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: starSpriteTexture(), color: v.color,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7,
  }));
  spark.scale.setScalar(2.5);
  group.add(spark);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: starSpriteTexture(), color: v.color,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false,
  }));
  beacon.scale.setScalar(0.022);
  group.add(beacon);
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(3, 8, 6),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(hit);

  const body = { data: v, group, tiltGroup: group, mesh: model, isMoon: false, parentBody: null, spinRate: 0, beacon };
  hit.userData.body = body;
  clickableMeshes.push(hit);
  const label = makeLabel(v.name, false, body);
  label.position.set(0, 2.2, 0);
  group.add(label);
  body.label = label;

  bodies.push(body);
  bodyByKey.set(v.key, body);
  systemGroup.add(group);
  voyagerBodies.push(body);
}

const orbitMat = (color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });

function addOrbitLine(points, color, parentObj) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.LineLoop(geo, orbitMat(color));
  (parentObj || systemGroup).add(line);
  orbitLines.push(line);
  return line;
}

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
    const angle = 2 * Math.PI * ((time.ut / m.periodDays) % 1) + 1.32;
    const inc = THREE.MathUtils.degToRad(m.inclinationDeg || 0);
    return new THREE.Vector3(
      Math.cos(angle),
      Math.sin(angle) * Math.sin(inc),
      Math.sin(angle) * Math.cos(inc),
    );
  }
  const len = Math.hypot(vx, vy, vz) || 1;
  return new THREE.Vector3(vx / len, vz / len, -vy / len);
}

export function clearOrbits() {
  for (const line of orbitLines) {
    line.parent?.remove(line);
    line.geometry?.dispose();
    line.material?.dispose();
  }
  orbitLines.length = 0;
}

/** Estime la séparation lune–planète en UA pour l'échelle d'orbite. */
function moonSepAU(m, time) {
  if (m.realOrbitKm) return m.realOrbitKm / AU_KM;
  if (m.source === 'geomoon') {
    const g = eqjToEclVec(A.GeoMoon(time));
    return Math.hypot(g.x, g.y, g.z);
  }
  if (m.source === 'jupiter') {
    const jm = A.JupiterMoons(time);
    const sv = jm[m.jmIndex] ?? jm.moon?.[{ io: 0, europa: 1, ganymede: 2, callisto: 3 }[m.jmIndex]];
    const g = eqjToEclVec(sv);
    return Math.hypot(g.x, g.y, g.z);
  }
  return null;
}

export function buildOrbits() {
  const now = A.MakeTime(new Date());
  const orbitsVisible = document.getElementById('toggle-orbits')?.checked !== false;

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
    const line = addOrbitLine(pts, p.orbitColor, null);
    line.visible = orbitsVisible;
  }
  for (const v of VOYAGERS) {
    const pts = voyagerPath(v.key).map((p) => {
      const r = Math.hypot(p.x, p.y, p.z);
      const k = scaleDist(r) / r;
      return new THREE.Vector3(p.x * k, p.z * k, -p.y * k);
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: v.color, transparent: true, opacity: 0.55 }),
    );
    line.visible = orbitsVisible;
    systemGroup.add(line);
    orbitLines.push(line);
  }
  for (const m of MOONS) {
    const parent = bodyByKey.get(m.parent);
    const pts = [];
    const N = 128;
    const sep = moonSepAU(m, now);
    const dist = moonOrbitUnits(m, parent.data.displayR, sep);
    for (let i = 0; i < N; i++) {
      const t = now.AddDays((i * m.periodDays) / N);
      pts.push(moonDirection(m, t).multiplyScalar(dist));
    }
    const holder = m.source === 'circular' ? parent.tiltGroup : parent.group;
    const line = addOrbitLine(pts, 0x5a7396, holder);
    line.visible = orbitsVisible;
  }
}

export function rebuildOrbits() {
  clearOrbits();
  buildOrbits();
}

export function updatePositions(date) {
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

  const earth = bodyByKey.get('Earth');
  if (earth) {
    _sunDirection.copy(earth.group.position).multiplyScalar(-1).normalize();
    earthNightMaterial?.uniforms.sunDirection.value.copy(_sunDirection);
    earthAtmosphereMaterial?.uniforms.sunDirection.value.copy(_sunDirection);
  }

  let jmCache = null;
  for (const m of MOONS) {
    const b = bodyByKey.get(m.key);
    const parent = bodyByKey.get(m.parent);
    const parentEcl = helioReal.get(m.parent);
    const parentR = parent.data.displayR;

    if (m.source === 'geomoon') {
      const g = eqjToEclVec(A.GeoMoon(time));
      helioReal.set(m.key, { x: parentEcl.x + g.x, y: parentEcl.y + g.y, z: parentEcl.z + g.z });
      const sep = Math.hypot(g.x, g.y, g.z);
      const dist = moonOrbitUnits(m, parentR, sep);
      b.group.position.copy(moonDirection(m, time).multiplyScalar(dist));
    } else if (m.source === 'jupiter') {
      if (!jmCache) jmCache = A.JupiterMoons(time);
      const sv = jmCache[m.jmIndex] ?? jmCache.moon?.[{ io: 0, europa: 1, ganymede: 2, callisto: 3 }[m.jmIndex]];
      const g = eqjToEclVec(sv);
      helioReal.set(m.key, { x: parentEcl.x + g.x, y: parentEcl.y + g.y, z: parentEcl.z + g.z });
      const len = Math.hypot(g.x, g.y, g.z) || 1;
      const dist = moonOrbitUnits(m, parentR, len);
      b.group.position.set(g.x / len, g.z / len, -g.y / len).multiplyScalar(dist);
    } else {
      const dir = moonDirection(m, time);
      const dist = moonOrbitUnits(m, parentR, m.realOrbitKm ? m.realOrbitKm / AU_KM : null);
      b.group.position.copy(dir).multiplyScalar(dist);
      if (m.realOrbitKm) {
        const off = m.realOrbitKm / AU_KM;
        helioReal.set(m.key, {
          x: parentEcl.x + dir.x * off,
          y: parentEcl.y - dir.z * off,
          z: parentEcl.z + dir.y * off,
        });
      } else {
        helioReal.set(m.key, parentEcl);
      }
      if (m.key === 'ISS') {
        bodyByKey.get('Earth').group.getWorldPosition(_lookTarget);
        b.mesh.lookAt(_lookTarget);
      }
    }
  }

  for (const b of voyagerBodies) {
    const p = voyagerPosition(b.data.key, date);
    if (!p) {
      b.group.visible = false;
      helioReal.delete(b.data.key);
      continue;
    }
    b.group.visible = true;
    helioReal.set(b.data.key, p);
    const r = Math.hypot(p.x, p.y, p.z);
    const k = scaleDist(r) / r;
    b.group.position.set(p.x * k, p.z * k, -p.y * k);
    bodyByKey.get('Earth').group.getWorldPosition(_lookTarget);
    b.mesh.lookAt(_lookTarget);
  }
}

export function setupDisplayToggles() {
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
}
