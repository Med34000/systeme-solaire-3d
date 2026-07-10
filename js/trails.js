// Traînées hélicoïdales (utilisées par la dérive galactique).

import * as THREE from 'three';
import { PLANETS } from './data.js';
import { scene } from './scene.js';
import { sunBody, bodyByKey } from './world.js';

const TRAIL_MAX = 700;
const trails = [];
const _tw = new THREE.Vector3();

export function initTrails() {
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
      new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.55 }),
    );
    line.frustumCulled = false;
    line.visible = false;
    scene.add(line);
    trails.push({ getBody: d.body, line, count: 0, last: new THREE.Vector3(), hasLast: false });
  }
}

export function clearTrails() {
  for (const t of trails) {
    t.count = 0;
    t.hasLast = false;
    t.line.visible = false;
    t.line.geometry.setDrawRange(0, 0);
  }
}

export function updateTrails() {
  for (const t of trails) {
    t.getBody().group.getWorldPosition(_tw);
    if (t.hasLast && _tw.distanceToSquared(t.last) <= 1.4) continue;
    t.last.copy(_tw);
    t.hasLast = true;
    const attr = t.line.geometry.attributes.position;
    if (t.count === TRAIL_MAX) {
      attr.array.copyWithin(0, 3);
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
