// Sondes Voyager 1 & 2 : trajectoires reconstituées par interpolation entre les
// vrais jalons historiques (lancement depuis la Terre, survols planétaires aux
// positions réelles des planètes ce jour-là, puis trajectoire de sortie vers
// leur direction interstellaire mesurée). Précision visuelle, pas scientifique.

const A = window.Astronomy;
const EQJ_TO_ECL = A.Rotation_EQJ_ECL();

const MS_YEAR = 365.25 * 86400 * 1000;

export const VOYAGERS = [
  {
    key: 'Voyager1', name: 'Voyager 1', color: 0xff8fb3, displayR: 1, isSpacecraft: true,
    launch: Date.UTC(1977, 8, 5),
    flybys: [
      ['Jupiter', Date.UTC(1979, 2, 5)],
      ['Saturn', Date.UTC(1980, 10, 12)],
    ],
    // Position approchée au 1er janvier 2026 : ~169 UA vers Ophiuchus
    anchor: { t: Date.UTC(2026, 0, 1), distAU: 169, raDeg: 261.8, decDeg: 12.25 },
    rateAUperYear: 3.58,
    type: 'Sonde spatiale interstellaire (NASA)',
    desc: "L'objet humain le plus lointain de tous les temps. Lancée en 1977, elle a survolé Jupiter et Saturne avant de quitter le système solaire. Depuis 2012, elle navigue dans l'espace interstellaire, emportant le Disque d'or : sons et images de la Terre destinés à d'éventuels extraterrestres. (Modèle 3D et trajectoire simplifiés — invisible avant son lancement en 1977.)",
    info: {
      'Lancement': '5 septembre 1977',
      'Survol de Jupiter': '5 mars 1979',
      'Survol de Saturne': '12 novembre 1980',
      'Espace interstellaire': 'depuis août 2012',
      'Vitesse': '~17 km/s (61 000 km/h)',
      'Masse': '825 kg',
      'Énergie': 'Générateur nucléaire (RTG)',
      'À bord': 'Le Disque d’or 💿',
    },
  },
  {
    key: 'Voyager2', name: 'Voyager 2', color: 0x7dffcf, displayR: 1, isSpacecraft: true,
    launch: Date.UTC(1977, 7, 20),
    flybys: [
      ['Jupiter', Date.UTC(1979, 6, 9)],
      ['Saturn', Date.UTC(1981, 7, 26)],
      ['Uranus', Date.UTC(1986, 0, 24)],
      ['Neptune', Date.UTC(1989, 7, 25)],
    ],
    // ~142 UA vers le Paon (hémisphère sud) début 2026
    anchor: { t: Date.UTC(2026, 0, 1), distAU: 142, raDeg: 301.5, decDeg: -58.5 },
    rateAUperYear: 3.16,
    type: 'Sonde spatiale interstellaire (NASA)',
    desc: "La seule sonde à avoir survolé les quatre planètes géantes : Jupiter, Saturne, Uranus et Neptune — le « Grand Tour » rendu possible par un alignement planétaire qui n'arrive que tous les 175 ans. Dans l'espace interstellaire depuis 2018. (Modèle 3D et trajectoire simplifiés — invisible avant son lancement en 1977.)",
    info: {
      'Lancement': '20 août 1977',
      'Survol de Jupiter': '9 juillet 1979',
      'Survol de Saturne': '26 août 1981',
      'Survol d’Uranus': '24 janvier 1986',
      'Survol de Neptune': '25 août 1989',
      'Espace interstellaire': 'depuis novembre 2018',
      'Vitesse': '~15 km/s (55 000 km/h)',
      'À bord': 'Le Disque d’or 💿',
    },
  },
];

// Jalons (t, position écliptique héliocentrique en UA) calculés une seule fois
const waypointCache = new Map();

function eclOf(vec) {
  const r = A.RotateVector(EQJ_TO_ECL, { x: vec.x, y: vec.y, z: vec.z, t: null });
  return { x: r.x, y: r.y, z: r.z };
}

function buildWaypoints(cfg) {
  const wps = [];
  const launchTime = A.MakeTime(new Date(cfg.launch));
  wps.push({ t: cfg.launch, p: eclOf(A.HelioVector(A.Body.Earth, launchTime)) });
  for (const [planet, when] of cfg.flybys) {
    wps.push({ t: when, p: eclOf(A.HelioVector(A.Body[planet], A.MakeTime(new Date(when)))) });
  }
  // Point d'ancrage : direction interstellaire (RA/Dec J2000) × distance
  const ra = (cfg.anchor.raDeg * Math.PI) / 180;
  const dec = (cfg.anchor.decDeg * Math.PI) / 180;
  const dir = eclOf({ x: Math.cos(dec) * Math.cos(ra), y: Math.cos(dec) * Math.sin(ra), z: Math.sin(dec) });
  wps.push({
    t: cfg.anchor.t,
    p: { x: dir.x * cfg.anchor.distAU, y: dir.y * cfg.anchor.distAU, z: dir.z * cfg.anchor.distAU },
  });
  return wps;
}

function getWaypoints(key) {
  if (!waypointCache.has(key)) {
    const cfg = VOYAGERS.find((v) => v.key === key);
    waypointCache.set(key, buildWaypoints(cfg));
  }
  return waypointCache.get(key);
}

const lerp = (a, b, k) => a + (b - a) * k;

// Position écliptique héliocentrique (UA) à la date donnée — null avant le lancement
export function voyagerPosition(key, date) {
  const cfg = VOYAGERS.find((v) => v.key === key);
  const ms = date.getTime();
  if (ms < cfg.launch) return null;
  const wps = getWaypoints(key);
  const last = wps[wps.length - 1];

  if (ms >= last.t) {
    // Au-delà de l'ancrage : file en ligne droite dans la direction de sortie
    const prev = wps[wps.length - 2].p;
    const dx = last.p.x - prev.x, dy = last.p.y - prev.y, dz = last.p.z - prev.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const dist = (cfg.rateAUperYear * (ms - last.t)) / MS_YEAR;
    return {
      x: last.p.x + (dx / len) * dist,
      y: last.p.y + (dy / len) * dist,
      z: last.p.z + (dz / len) * dist,
    };
  }
  for (let i = 0; i < wps.length - 1; i++) {
    if (ms >= wps[i].t && ms < wps[i + 1].t) {
      const k = (ms - wps[i].t) / (wps[i + 1].t - wps[i].t);
      return {
        x: lerp(wps[i].p.x, wps[i + 1].p.x, k),
        y: lerp(wps[i].p.y, wps[i + 1].p.y, k),
        z: lerp(wps[i].p.z, wps[i + 1].p.z, k),
      };
    }
  }
  return wps[0].p;
}

// Échantillonnage de la trajectoire complète (pour tracer la ligne)
export function voyagerPath(key, until = Date.UTC(2126, 0, 1), n = 600) {
  const cfg = VOYAGERS.find((v) => v.key === key);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const ms = cfg.launch + ((until - cfg.launch) * i) / n;
    const p = voyagerPosition(key, new Date(ms));
    if (p) pts.push(p);
  }
  return pts;
}
