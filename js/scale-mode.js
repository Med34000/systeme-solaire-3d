// Toggle « distances réelles » : transition animée compressé ↔ linéaire.

import { sim } from './sim.js';
import { camera, controls } from './scene.js';
import { updatePositions, rebuildOrbits, clearOrbits } from './world.js';
import { clearTrails } from './trails.js';
import { goOverview } from './focus.js';
import { overviewCamPosition } from './scale.js';

const SCALE_ANIM_DUR = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.15 : 2.8;

const TOAST_LINES_ON = [
  { at: 0,    title: 'Distances réelles', body: 'Les orbites s’étirent à leur vraie proportion…' },
  { at: 0.35, title: 'Le vide se révèle', body: 'Neptune est ~30× plus loin du Soleil que la Terre.' },
  { at: 0.7,  title: 'Surtout du vide', body: 'Les tailles restent exagérées — sinon les planètes seraient invisibles.' },
];
const TOAST_LINES_OFF = [
  { at: 0,    title: 'Vue pédagogique', body: 'Les distances se recompressent pour tout voir d’un coup d’œil.' },
  { at: 0.5,  title: 'Vue d’ensemble', body: 'Mercure et Neptune cohabitent à l’écran — ce n’est plus à l’échelle.' },
];

const toastEl = document.getElementById('scale-toast');
const toastTitle = document.getElementById('scale-toast-title');
const toastBody = document.getElementById('scale-toast-body');
const scaleNote = document.getElementById('scale-note');

function showToast(title, body) {
  if (!toastEl) return;
  toastTitle.textContent = title;
  toastBody.textContent = body;
  toastEl.classList.add('visible');
}

function hideToast() {
  toastEl?.classList.remove('visible');
}

function applyCameraLimits(real) {
  if (real) {
    camera.far = 120000;
    controls.maxDistance = 50000;
  } else {
    camera.far = 30000;
    controls.maxDistance = 4000;
  }
  camera.updateProjectionMatrix();
}

export function startScaleTransition(toReal) {
  const target = toReal ? 1 : 0;
  if (sim.scaleTarget === target && !sim.scaleAnimating && sim.scaleBlend === target) return;

  sim.scaleTarget = target;
  sim.scaleBlendFrom = sim.scaleBlend;
  sim.scaleAnimT = 0;
  sim.scaleAnimating = true;

  // Vue d’ensemble pour voir l’expansion / la compression
  goOverview();
  sim.overviewTimer = SCALE_ANIM_DUR + 0.4;
  clearTrails();
  clearOrbits(); // orbites fausses pendant l’anim → reconstruites à la fin

  applyCameraLimits(toReal || sim.scaleBlend > 0.2);

  // Dérive galactique calibrée pour l’échelle compressée
  if (toReal) {
    const driftCb = document.getElementById('toggle-drift');
    if (driftCb?.checked) {
      driftCb.checked = false;
      driftCb.dispatchEvent(new Event('change'));
    }
  }

  const lines = toReal ? TOAST_LINES_ON : TOAST_LINES_OFF;
  showToast(lines[0].title, lines[0].body);
  scaleNote?.classList.toggle('visible', toReal);
}

/** @returns {boolean} true si les positions doivent être recalculées cette frame */
export function tickScale(dt) {
  if (!sim.scaleAnimating) return false;

  sim.scaleAnimT += dt;
  const k = Math.min(sim.scaleAnimT / SCALE_ANIM_DUR, 1);
  const e = k * k * (3 - 2 * k); // smoothstep
  sim.scaleBlend = sim.scaleBlendFrom + (sim.scaleTarget - sim.scaleBlendFrom) * e;

  const lines = sim.scaleTarget >= 0.5 ? TOAST_LINES_ON : TOAST_LINES_OFF;
  let msg = lines[0];
  for (const line of lines) {
    if (k >= line.at) msg = line;
  }
  if (toastTitle && toastTitle.textContent !== msg.title) {
    showToast(msg.title, msg.body);
  }

  // Pull caméra vers la vue d’ensemble adaptée à l’échelle
  camera.position.lerp(overviewCamPosition(), 0.04);

  if (k >= 1) {
    sim.scaleBlend = sim.scaleTarget;
    sim.scaleAnimating = false;
    applyCameraLimits(sim.scaleTarget === 1);
    rebuildOrbits();
    updatePositions(sim.date);
    setTimeout(hideToast, 2200);
    return true;
  }
  return true;
}

export function setupScaleMode() {
  const cb = document.getElementById('toggle-scale');
  if (!cb) return;

  cb.addEventListener('change', () => {
    startScaleTransition(cb.checked);
  });

  cb.checked = sim.scaleTarget === 1;
  scaleNote?.classList.toggle('visible', sim.scaleTarget === 1);
}
