// Système Solaire 3D — orchestration : scène, temps, features, boucle d'animation.
// Positions réelles via astronomy-engine (VSOP87/NOVAS). Distances compressées.

import * as THREE from 'three';
import { sim } from './sim.js';
import {
  scene, camera, renderer, labelRenderer, controls, systemGroup, setupResize,
} from './scene.js';
import {
  bodies, voyagerBodies, buildOrbits, updatePositions, setupDisplayToggles,
} from './world.js';
import { loadingManager } from './textures.js';
import {
  setupTimeControls, tickTime, refreshDateLabel, syncDateInput,
} from './time.js';
import { setupPanelCloses, setupMobileDrawers } from './panels.js';
import {
  setupFocusUI, tickCamera, updateLiveRows, prevFollowPos,
} from './focus.js';
import { initTrails } from './trails.js';
import { setupDriftToggle, tickDrift } from './drift.js';
import { setupLightRace, tickLightRace, refreshLightClock } from './features/light-race.js';
import { setupSky, isSkyPanelVisible, renderSky } from './features/sky.js';
import { setupBirth, updateLapseHud } from './features/birth.js';
import { setupOnboarding } from './onboarding.js';
import { setupScaleMode, tickScale } from './scale-mode.js';

// ---------- Initialisation ----------
setupResize();
buildOrbits();
initTrails();
updatePositions(sim.date);

setupTimeControls();
setupPanelCloses();
setupMobileDrawers();
setupFocusUI();
setupDisplayToggles();
setupDriftToggle(prevFollowPos);
setupScaleMode();
setupLightRace();
setupSky();
setupBirth();
setupOnboarding();

// Chargement des textures
const loadingEl = document.getElementById('loading');
loadingManager.onLoad = () => loadingEl.remove();
setTimeout(() => loadingEl.remove(), 8000);

// ---------- Boucle d'animation ----------
const clock = new THREE.Clock();
let liveRowTimer = 0;
let skyTimer = 0;
let lastSimMs = NaN;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Temps simulé
  tickTime(dt, { onLapseHud: updateLapseHud });
  const scaleMoved = tickScale(dt);
  const simMs = sim.date.getTime();
  if (scaleMoved || simMs !== lastSimMs) {
    lastSimMs = simMs;
    updatePositions(sim.date);
  }

  tickDrift();
  tickLightRace(dt);

  // Balises Voyager
  const elapsed = clock.elapsedTime;
  for (let i = 0; i < voyagerBodies.length; i++) {
    const vb = voyagerBodies[i];
    if (vb.group.visible) vb.beacon.scale.setScalar(0.022 * (1 + 0.2 * Math.sin(elapsed * 2.2 + i * 2)));
  }

  // Rotation propre des astres
  const simDt = dt * (sim.speed === 0 ? 0 : sim.speed);
  for (const b of bodies) {
    if (!b.spinRate) continue;
    const dr = b.spinRate * simDt * sim.direction;
    b.mesh.rotation.y += THREE.MathUtils.clamp(dr, -0.25, 0.25);
  }

  tickCamera(dt, systemGroup);

  // UI 4×/s
  liveRowTimer += dt;
  if (liveRowTimer > 0.25) {
    liveRowTimer = 0;
    refreshDateLabel();
    if (sim.selectedBody && sim.liveRows) updateLiveRows(sim.selectedBody);
    if (document.activeElement !== document.getElementById('date-input')) syncDateInput();
    refreshLightClock();
  }

  if (isSkyPanelVisible()) {
    skyTimer += dt;
    if (skyTimer > 2) { skyTimer = 0; renderSky(); }
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
