// État mutable partagé de la simulation (évite les dépendances circulaires).

export const DATE_MIN = Date.UTC(1600, 0, 1);
export const DATE_MAX = Date.UTC(2500, 0, 1);
export const LAPSE_DUR = 15000;
export const DRIFT_UNITS_PER_YEAR = 140;

export const sim = {
  date: new Date(),
  speed: 1,                 // secondes simulées / seconde réelle
  direction: 1,
  syncedToNow: true,
  followBody: null,
  selectedBody: null,
  focusTimer: 0,
  overviewTimer: 0,
  liveRows: null,
  lastBirthMs: null,
  /** @type {{ t0: number, t1: number, start: number, finished: boolean } | null} */
  lapse: null,
  /** @type {{ t: number, targets: object[], done: boolean } | null} */
  lightRace: null,
  lightSpeed: 60,
  driftEnabled: false,
  driftEpochMs: 0,
  /** 0 = distances compressées, 1 = distances réelles (linéaires). */
  scaleBlend: 0,
  /** Cible du toggle (0 ou 1). */
  scaleTarget: 0,
  scaleAnimating: false,
  scaleAnimT: 0,
  scaleBlendFrom: 0,
};
