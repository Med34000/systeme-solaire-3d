// Échelle d'affichage.
// Mode pédagogique : distances compressées (loi de puissance) pour tout voir.
// Mode réel : distances linéaires (1 UA = REAL_UNITS_PER_AU). Les tailles des
// astres restent exagérées — sinon la Terre serait invisible à l'écran.

import * as THREE from 'three';
import { sim } from './sim.js';
import { AU_KM } from './data.js';

export const DIST_C = 60;
export const DIST_P = 0.45;
/** Unités Three.js par UA en mode distances réelles (la Terre reste ~à 60). */
export const REAL_UNITS_PER_AU = 60;

/** Secondes pour que la lumière parcoure 1 UA. */
export const AU_LIGHT_S = 499.005;

/** Caméra d'ensemble en distances réelles (Neptune ~30 UA → ~1800 u). */
export const REAL_OVERVIEW_CAM = new THREE.Vector3(0, 1100, 1900);
export const DEFAULT_OVERVIEW_CAM = new THREE.Vector3(0, 260, 430);

/** Position de caméra vue d'ensemble selon le blend d'échelle courant. */
export function overviewCamPosition(out = new THREE.Vector3()) {
  return out.lerpVectors(DEFAULT_OVERVIEW_CAM, REAL_OVERVIEW_CAM, sim.scaleBlend);
}

export function scaleDistCompressed(au) {
  return DIST_C * Math.pow(Math.max(au, 1e-6), DIST_P);
}

export function scaleDistReal(au) {
  return REAL_UNITS_PER_AU * Math.max(au, 1e-6);
}

/**
 * Distance d'affichage héliocentrique (UA → unités scène).
 * Interpole entre compressé et réel selon sim.scaleBlend (0…1).
 */
export function scaleDist(au) {
  const a = Math.max(au, 1e-6);
  const c = scaleDistCompressed(a);
  const r = scaleDistReal(a);
  const b = sim.scaleBlend;
  if (b <= 0) return c;
  if (b >= 1) return r;
  return c + (r - c) * b;
}

/**
 * Distance d'affichage d'une lune / de l'ISS par rapport à sa planète.
 * En mode réel on utilise la vraie séparation, avec un plancher pour ne pas
 * entrer dans le globe (tailles toujours exagérées).
 */
export function moonOrbitUnits(m, parentDisplayR, realSepAU) {
  const stylized = m.displayDist;
  let realAU = realSepAU;
  if (realAU == null && m.realOrbitKm) realAU = m.realOrbitKm / AU_KM;
  if (realAU == null || !Number.isFinite(realAU)) {
    return stylized;
  }
  // Distance linéaire réelle, au minimum juste hors de la surface affichée
  const physical = Math.max(scaleDistReal(realAU), parentDisplayR * 1.2);
  const b = sim.scaleBlend;
  if (b <= 0) return stylized;
  if (b >= 1) return physical;
  return stylized + (physical - stylized) * b;
}
