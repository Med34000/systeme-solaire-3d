// Désencombre les étiquettes projetées à l'écran sans lecture de layout coûteuse.

import * as THREE from 'three';
import { QUALITY } from './quality.js';
import { bodies } from './world.js';
import { sim } from './sim.js';

const worldPos = new THREE.Vector3();
const projected = new THREE.Vector3();

function priority(body) {
  if (body === sim.selectedBody || body === sim.followBody) return 1000;
  if (body.data.key === 'Sun' || body.data.key === 'Earth') return 400;
  if (body.data.isSpacecraft) return 240;
  if (!body.isMoon) return 300;
  return 100;
}

function overlaps(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function updateSmartLabels(camera) {
  const labelsEnabled = document.getElementById('toggle-labels')?.checked !== false;
  if (!labelsEnabled) return;

  const width = innerWidth;
  const height = innerHeight;
  const mobilePenalty = width <= 768 ? 4 : 0;
  const budget = Math.max(7, QUALITY.labelBudget - mobilePenalty);
  const reserved = [];
  for (const selector of ['#topbar', '#nav-panel', '#time-controls', '#hint', '.side-panel.visible']) {
    const element = document.querySelector(selector);
    if (!element || element.getClientRects().length === 0) continue;
    const rect = element.getBoundingClientRect();
    reserved.push({
      left: rect.left - 7, right: rect.right + 7,
      top: rect.top - 7, bottom: rect.bottom + 7,
    });
  }
  let focusZone = null;
  const focusedBody = sim.selectedBody || sim.followBody;
  if (focusedBody) {
    focusedBody.group.getWorldPosition(worldPos);
    const distance = Math.max(camera.position.distanceTo(worldPos), 0.01);
    projected.copy(worldPos).project(camera);
    const focalPx = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const radiusPx = Math.max(20, (focusedBody.data.displayR / distance) * focalPx * 1.2);
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    focusZone = {
      left: x - radiusPx, right: x + radiusPx,
      top: y - radiusPx, bottom: y + radiusPx,
    };
  }

  const candidates = [];
  for (const body of bodies) {
    const element = body.label?.element;
    if (!element || !body.group.visible || !body.label.visible) {
      element?.classList.add('label-hidden');
      continue;
    }

    body.label.getWorldPosition(worldPos);
    projected.copy(worldPos).project(camera);
    if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.08 || Math.abs(projected.y) > 1.08) {
      element.classList.add('label-hidden');
      continue;
    }

    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    const textWidth = Math.max(34, body.data.name.length * (body.isMoon ? 6 : 7) + 14);
    candidates.push({
      body, element, x, y,
      score: priority(body),
      distance: camera.position.distanceTo(worldPos),
      box: {
        left: x - textWidth / 2 - 4,
        right: x + textWidth / 2 + 4,
        top: y - 11,
        bottom: y + 11,
      },
    });
  }

  candidates.sort((a, b) => b.score - a.score || a.distance - b.distance);
  const accepted = [];
  let placed = 0;
  for (const candidate of candidates) {
    const essential = candidate.score >= 1000;
    const collides = accepted.some((box) => overlaps(candidate.box, box));
    const obstructed = reserved.some((box) => overlaps(candidate.box, box))
      || (candidate.body !== focusedBody && focusZone && overlaps(candidate.box, focusZone));
    const visible = !obstructed && (essential || (placed < budget && !collides));
    candidate.element.classList.toggle('label-hidden', !visible);
    if (visible) {
      accepted.push(candidate.box);
      placed++;
    }
  }
}
