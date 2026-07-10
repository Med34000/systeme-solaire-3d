// Dérive galactique vers l'apex solaire.

import * as THREE from 'three';
import { A, EQJ_TO_ECL } from './coords.js';
import { sim, DRIFT_UNITS_PER_YEAR } from './sim.js';
import { camera, controls, systemGroup } from './scene.js';
import { setSpeed } from './time.js';
import { clearTrails, updateTrails } from './trails.js';

const _driftOff = new THREE.Vector3();

// Direction de l'apex solaire (RA 18h, Dec +30°, vers Hercule/Véga)
export const driftDir = (() => {
  const dec = THREE.MathUtils.degToRad(30);
  const eq = { x: 0, y: -Math.cos(dec), z: Math.sin(dec), t: null };
  const ecl = A.RotateVector(EQJ_TO_ECL, eq);
  return new THREE.Vector3(ecl.x, ecl.z, -ecl.y).normalize();
})();

/** Applique la dérive galactique pour la frame courante. */
export function tickDrift() {
  if (!sim.driftEnabled) return;
  const years = (sim.date.getTime() - sim.driftEpochMs) / (365.25 * 86400 * 1000);
  _driftOff.copy(driftDir).multiplyScalar(years * DRIFT_UNITS_PER_YEAR);
  const dx = _driftOff.x - systemGroup.position.x;
  const dy = _driftOff.y - systemGroup.position.y;
  const dz = _driftOff.z - systemGroup.position.z;
  systemGroup.position.set(_driftOff.x, _driftOff.y, _driftOff.z);
  if (!sim.followBody) {
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;
    controls.target.x += dx;
    controls.target.y += dy;
    controls.target.z += dz;
  }
  updateTrails();
}

export function setupDriftToggle(prevFollowPosRef) {
  const driftNote = document.getElementById('drift-note');
  document.getElementById('toggle-drift').addEventListener('change', (e) => {
    sim.driftEnabled = e.target.checked;
    driftNote.classList.toggle('visible', sim.driftEnabled);
    if (sim.driftEnabled) {
      sim.driftEpochMs = sim.date.getTime();
      if (sim.speed <= 3600) { sim.syncedToNow = false; setSpeed(604800); }
    } else {
      const ox = systemGroup.position.x;
      const oy = systemGroup.position.y;
      const oz = systemGroup.position.z;
      systemGroup.position.set(0, 0, 0);
      if (!sim.followBody) {
        camera.position.x -= ox;
        camera.position.y -= oy;
        camera.position.z -= oz;
        controls.target.x -= ox;
        controls.target.y -= oy;
        controls.target.z -= oz;
      }
      if (sim.followBody) sim.followBody.group.getWorldPosition(prevFollowPosRef);
      clearTrails();
    }
  });
}

// Réexport pour les features qui n'ont besoin que de clearTrails via drift
export { clearTrails } from './trails.js';
