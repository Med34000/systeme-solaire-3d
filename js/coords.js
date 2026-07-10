// Repères astronomiques : équatorial J2000 → écliptique → Three.js.

export const A = window.Astronomy;

const EQJ_TO_ECL = A.Rotation_EQJ_ECL();

/** Rotation équatorial J2000 → écliptique. */
export function eqjToEclVec(v) {
  return A.RotateVector(EQJ_TO_ECL, { x: v.x, y: v.y, z: v.z, t: v.t ?? null });
}

/** Écliptique (z = nord) → Three.js (y = haut). */
export function eclToThree(v, out) {
  return out.set(v.x, v.z, -v.y);
}

export { EQJ_TO_ECL };
