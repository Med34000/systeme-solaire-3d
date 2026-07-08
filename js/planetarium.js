// Planétarium : événements célestes à venir et ciel visible depuis un lieu donné.
// Tous les calculs sont faits localement par astronomy-engine.

const A = window.Astronomy;

function fmtLatLon(lat, lon) {
  const la = `${Math.abs(lat).toFixed(0)}°${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lon).toFixed(0)}°${lon >= 0 ? 'E' : 'O'}`;
  return `${la}, ${lo}`;
}

// Liste triée des prochains événements célestes après `fromDate`.
export function upcomingEvents(fromDate) {
  const t0 = A.MakeTime(fromDate);
  const ev = [];

  // Prochaine éclipse de Soleil
  try {
    const se = A.SearchGlobalSolarEclipse(t0);
    const kinds = { total: 'totale', annular: 'annulaire', partial: 'partielle', hybrid: 'hybride' };
    ev.push({
      date: se.peak.date, icon: '🌑',
      title: `Éclipse de Soleil ${kinds[se.kind] || ''}`,
      desc: Number.isFinite(se.latitude) ? `Maximum au-dessus de ${fmtLatLon(se.latitude, se.longitude)}` : 'La Lune passe devant le Soleil',
      focus: 'Moon',
    });
  } catch (e) { /* hors de la plage de calcul */ }

  // Prochaine éclipse de Lune
  try {
    const le = A.SearchLunarEclipse(t0);
    const kinds = { total: 'totale', partial: 'partielle', penumbral: 'par la pénombre' };
    ev.push({
      date: le.peak.date, icon: '🌕',
      title: `Éclipse de Lune ${kinds[le.kind] || ''}`,
      desc: 'Visible partout où la Lune est au-dessus de l’horizon',
      focus: 'Moon',
    });
  } catch (e) { /* hors plage */ }

  // Oppositions des planètes extérieures (au plus près de la Terre)
  const opps = [
    ['Mars', 'Mars', '🔴', 'Mars au plus près de la Terre — le meilleur moment pour l’observer'],
    ['Jupiter', 'Jupiter', '🟠', 'Jupiter visible toute la nuit, au plus brillant'],
    ['Saturn', 'Saturne', '🪐', 'Saturne et ses anneaux visibles toute la nuit'],
  ];
  for (const [key, name, icon, desc] of opps) {
    try {
      const t = A.SearchRelativeLongitude(A.Body[key], 0, t0);
      ev.push({ date: t.date, icon, title: `Opposition de ${name}`, desc, focus: key });
    } catch (e) { /* hors plage */ }
  }

  // Meilleure visibilité de Mercure et Vénus (élongation maximale)
  for (const [key, name, icon] of [['Mercury', 'Mercure', '☿️'], ['Venus', 'Vénus', '✨']]) {
    try {
      const el = A.SearchMaxElongation(A.Body[key], t0);
      const quand = el.visibility === 'morning' ? 'à l’aube' : 'au crépuscule';
      ev.push({
        date: el.time.date, icon,
        title: `${name} au plus visible`,
        desc: `Élongation maximale (${el.elongation.toFixed(0)}° du Soleil) — à chercher ${quand}`,
        focus: key,
      });
    } catch (e) { /* hors plage */ }
  }

  // Prochaine pleine lune et nouvelle lune
  try {
    let q = A.SearchMoonQuarter(t0);
    let full = false, nouvelle = false;
    for (let i = 0; i < 8 && !(full && nouvelle); i++) {
      if (q.quarter === 2 && !full) {
        ev.push({ date: q.time.date, icon: '🌕', title: 'Pleine lune', desc: '', focus: 'Moon' });
        full = true;
      } else if (q.quarter === 0 && !nouvelle) {
        ev.push({ date: q.time.date, icon: '🌑', title: 'Nouvelle lune', desc: 'Ciel bien noir : parfait pour les étoiles filantes et la Voie lactée', focus: 'Moon' });
        nouvelle = true;
      }
      q = A.NextMoonQuarter(q);
    }
  } catch (e) { /* hors plage */ }

  // Survol historique de l'astéroïde Apophis (événement fixe connu)
  const apophis = new Date(Date.UTC(2029, 3, 13, 21, 46));
  if (apophis > fromDate) {
    ev.push({
      date: apophis, icon: '☄️',
      title: 'L’astéroïde Apophis frôle la Terre',
      desc: '~340 m de large, à ~31 600 km — plus près que les satellites géostationnaires. Visible à l’œil nu depuis l’Europe !',
      focus: 'Earth',
    });
  }

  ev.sort((a, b) => a.date - b.date);
  return ev;
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export function compass(az) {
  return DIRS[Math.round(az / 45) % 8];
}

function phaseName(angle) {
  if (angle < 22.5 || angle >= 337.5) return 'nouvelle lune';
  if (angle < 67.5) return 'premier croissant';
  if (angle < 112.5) return 'premier quartier';
  if (angle < 157.5) return 'gibbeuse croissante';
  if (angle < 202.5) return 'pleine lune';
  if (angle < 247.5) return 'gibbeuse décroissante';
  if (angle < 292.5) return 'dernier quartier';
  return 'dernier croissant';
}

// État du ciel (planètes + Lune + Soleil) vu depuis lat/lon à la date donnée.
export function skyReport(date, lat, lon) {
  const time = A.MakeTime(date);
  const obs = new A.Observer(lat, lon, 0);

  const bodies = [
    ['Mercury', 'Mercure'], ['Venus', 'Vénus'], ['Mars', 'Mars'],
    ['Jupiter', 'Jupiter'], ['Saturn', 'Saturne'], ['Moon', 'Lune'],
  ];
  const rows = [];
  for (const [key, name] of bodies) {
    const body = A.Body[key];
    const eq = A.Equator(body, time, obs, true, true);
    const hor = A.Horizon(time, obs, eq.ra, eq.dec, 'normal');
    let mag = null;
    try { mag = A.Illumination(body, time).mag; } catch (e) { /* pas de magnitude */ }
    let evt = null;
    try {
      const up = hor.altitude > 0;
      const t = A.SearchRiseSet(body, obs, up ? -1 : +1, time, 2);
      if (t) evt = { type: up ? 'set' : 'rise', date: t.date };
    } catch (e) { /* pas de lever/coucher trouvé */ }
    rows.push({
      key, name,
      up: hor.altitude > 0,
      altitude: hor.altitude,
      dir: compass(hor.azimuth),
      mag, evt,
    });
  }

  // Soleil : jour/nuit + prochain lever ou coucher
  const sunEq = A.Equator(A.Body.Sun, time, obs, true, true);
  const sunHor = A.Horizon(time, obs, sunEq.ra, sunEq.dec, 'normal');
  const sun = { up: sunHor.altitude > 0, evt: null };
  try {
    const t = A.SearchRiseSet(A.Body.Sun, obs, sun.up ? -1 : +1, time, 2);
    if (t) sun.evt = { type: sun.up ? 'set' : 'rise', date: t.date };
  } catch (e) { /* — */ }

  // Phase de la Lune
  let moon = null;
  try {
    const ill = A.Illumination(A.Body.Moon, time);
    moon = { name: phaseName(A.MoonPhase(time)), fraction: ill.phase_fraction };
  } catch (e) { /* — */ }

  return { rows, sun, moon };
}
