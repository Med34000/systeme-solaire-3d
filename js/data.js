// Données physiques et descriptives de chaque astre (sources : NASA factsheets).
// radiusKm : rayon réel — displayR : rayon affiché (échelle compressée)
// periodDays : période orbitale sidérale — rotHours : rotation (négatif = rétrograde)
// tiltDeg : inclinaison de l'axe

export const AU_KM = 149597870.7;

function displayRadius(km) {
  return 1.1 + 2.2 * Math.log10(km / 1000);
}
function moonDisplayRadius(km) {
  return 0.55 + 1.1 * Math.log10(km / 1000);
}

export const SUN = {
  key: 'Sun', name: 'Soleil', astroBody: 'Sun',
  radiusKm: 696340, displayR: 14, rotHours: 609.12, tiltDeg: 7.25,
  type: 'Étoile — naine jaune (G2V)',
  desc: "Notre étoile. Elle contient 99,86 % de toute la masse du système solaire et convertit chaque seconde 4 millions de tonnes de matière en énergie par fusion nucléaire.",
  info: {
    'Diamètre': '1 392 700 km (109 × Terre)',
    'Masse': '1,99 × 10³⁰ kg (333 000 × Terre)',
    'Température (surface)': '5 500 °C',
    'Température (cœur)': '15 000 000 °C',
    'Rotation': '≈ 27 jours',
    'Âge': '4,6 milliards d’années',
  },
};

export const PLANETS = [
  {
    key: 'Mercury', name: 'Mercure', astroBody: 'Mercury',
    radiusKm: 2439.7, displayR: displayRadius(2439.7),
    periodDays: 87.969, rotHours: 1407.6, tiltDeg: 0.03,
    orbitColor: 0x8a8a94,
    type: 'Planète tellurique',
    desc: "La plus petite planète et la plus proche du Soleil. Sa surface criblée de cratères ressemble à la Lune. Une journée solaire y dure 176 jours terrestres !",
    info: {
      'Diamètre': '4 879 km',
      'Masse': '3,30 × 10²³ kg',
      'Gravité': '3,7 m/s²',
      'Durée du jour': '176 j terrestres',
      'Année': '88 jours',
      'Température': '−173 °C à +427 °C',
      'Lunes': '0',
      'Vitesse orbitale': '47,4 km/s',
    },
  },
  {
    key: 'Venus', name: 'Vénus', astroBody: 'Venus',
    radiusKm: 6051.8, displayR: displayRadius(6051.8),
    periodDays: 224.701, rotHours: -5832.5, tiltDeg: 177.4,
    orbitColor: 0xd8b56a,
    type: 'Planète tellurique',
    desc: "La planète la plus chaude du système solaire à cause d'un effet de serre extrême (96 % de CO₂). Elle tourne à l'envers, très lentement : son jour dure plus que son année !",
    info: {
      'Diamètre': '12 104 km',
      'Masse': '4,87 × 10²⁴ kg',
      'Gravité': '8,87 m/s²',
      'Durée du jour': '117 j terrestres',
      'Année': '224,7 jours',
      'Température': '464 °C (constante)',
      'Lunes': '0',
      'Vitesse orbitale': '35,0 km/s',
    },
  },
  {
    key: 'Earth', name: 'Terre', astroBody: 'Earth',
    radiusKm: 6371, displayR: displayRadius(6371),
    periodDays: 365.256, rotHours: 23.93, tiltDeg: 23.44,
    orbitColor: 0x4a90e2,
    type: 'Planète tellurique',
    desc: "Notre maison. La seule planète connue à abriter la vie, recouverte à 71 % d'océans. Son inclinaison de 23,4° crée les saisons.",
    info: {
      'Diamètre': '12 742 km',
      'Masse': '5,97 × 10²⁴ kg',
      'Gravité': '9,81 m/s²',
      'Durée du jour': '24 h',
      'Année': '365,25 jours',
      'Température': '15 °C (moyenne)',
      'Lunes': '1 (la Lune)',
      'Vitesse orbitale': '29,8 km/s',
    },
  },
  {
    key: 'Mars', name: 'Mars', astroBody: 'Mars',
    radiusKm: 3389.5, displayR: displayRadius(3389.5),
    periodDays: 686.98, rotHours: 24.62, tiltDeg: 25.19,
    orbitColor: 0xd2691e,
    type: 'Planète tellurique',
    desc: "La planète rouge, colorée par l'oxyde de fer. Elle abrite le plus grand volcan du système solaire (Olympus Mons, 21 km de haut) et un canyon de 4 000 km (Valles Marineris).",
    info: {
      'Diamètre': '6 779 km',
      'Masse': '6,42 × 10²³ kg',
      'Gravité': '3,71 m/s²',
      'Durée du jour': '24 h 37 min',
      'Année': '687 jours',
      'Température': '−63 °C (moyenne)',
      'Lunes': '2 (Phobos, Deimos)',
      'Vitesse orbitale': '24,1 km/s',
    },
  },
  {
    key: 'Jupiter', name: 'Jupiter', astroBody: 'Jupiter',
    radiusKm: 69911, displayR: displayRadius(69911),
    periodDays: 4332.59, rotHours: 9.93, tiltDeg: 3.13,
    orbitColor: 0xc9a06a,
    type: 'Géante gazeuse',
    desc: "La plus grande planète : 1 300 Terres tiendraient dedans. Sa Grande Tache Rouge est une tempête plus large que la Terre qui fait rage depuis au moins 350 ans.",
    info: {
      'Diamètre': '139 820 km (11 × Terre)',
      'Masse': '1,90 × 10²⁷ kg (318 × Terre)',
      'Gravité': '24,8 m/s²',
      'Durée du jour': '9 h 56 min',
      'Année': '11,86 ans',
      'Température': '−108 °C (nuages)',
      'Lunes': '95 connues',
      'Vitesse orbitale': '13,1 km/s',
    },
  },
  {
    key: 'Saturn', name: 'Saturne', astroBody: 'Saturn',
    radiusKm: 58232, displayR: displayRadius(58232),
    periodDays: 10759.22, rotHours: 10.66, tiltDeg: 26.73,
    orbitColor: 0xe0cda0,
    type: 'Géante gazeuse',
    hasRings: true,
    desc: "Célèbre pour ses anneaux spectaculaires faits de milliards de blocs de glace et de roche. Si dense en gaz légers qu'elle flotterait sur l'eau !",
    info: {
      'Diamètre': '116 460 km (9,1 × Terre)',
      'Masse': '5,68 × 10²⁶ kg (95 × Terre)',
      'Gravité': '10,4 m/s²',
      'Durée du jour': '10 h 42 min',
      'Année': '29,45 ans',
      'Température': '−139 °C',
      'Lunes': '146 connues',
      'Vitesse orbitale': '9,7 km/s',
    },
  },
  {
    key: 'Uranus', name: 'Uranus', astroBody: 'Uranus',
    radiusKm: 25362, displayR: displayRadius(25362),
    periodDays: 30688.5, rotHours: -17.24, tiltDeg: 97.77,
    orbitColor: 0x7fd4d4,
    type: 'Géante de glace',
    hasRings: 'faint',
    desc: "Elle roule sur son orbite, couchée à 98° — probablement suite à une collision géante. Chaque pôle connaît 42 ans de jour puis 42 ans de nuit.",
    info: {
      'Diamètre': '50 724 km (4 × Terre)',
      'Masse': '8,68 × 10²⁵ kg',
      'Gravité': '8,87 m/s²',
      'Durée du jour': '17 h 14 min',
      'Année': '84 ans',
      'Température': '−197 °C',
      'Lunes': '28 connues',
      'Vitesse orbitale': '6,8 km/s',
    },
  },
  {
    key: 'Neptune', name: 'Neptune', astroBody: 'Neptune',
    radiusKm: 24622, displayR: displayRadius(24622),
    periodDays: 60182, rotHours: 16.11, tiltDeg: 28.32,
    orbitColor: 0x4169e1,
    type: 'Géante de glace',
    desc: "La planète la plus lointaine et la plus venteuse : des rafales à 2 100 km/h ! Découverte en 1846 par le calcul, avant même d'être observée.",
    info: {
      'Diamètre': '49 244 km (3,9 × Terre)',
      'Masse': '1,02 × 10²⁶ kg',
      'Gravité': '11,15 m/s²',
      'Durée du jour': '16 h 06 min',
      'Année': '164,8 ans',
      'Température': '−201 °C',
      'Lunes': '16 connues',
      'Vitesse orbitale': '5,4 km/s',
    },
  },
];

// Lunes — displayDist : distance affichée depuis le centre du parent (stylisée,
// la direction est calculée en temps réel par astronomy-engine quand disponible).
export const MOONS = [
  {
    key: 'Moon', name: 'Lune', parent: 'Earth', source: 'geomoon',
    radiusKm: 1737.4, displayR: moonDisplayRadius(1737.4), displayDist: 8, periodDays: 27.322,
    type: 'Satellite naturel de la Terre',
    desc: "Notre satellite, né il y a 4,5 milliards d'années d'une collision titanesque. Il stabilise l'axe de la Terre et crée les marées. Position réelle calculée en temps réel.",
    info: {
      'Diamètre': '3 474 km',
      'Masse': '7,35 × 10²² kg',
      'Gravité': '1,62 m/s²',
      'Distance à la Terre': '384 400 km (moy.)',
      'Révolution': '27,3 jours',
      'Température': '−173 °C à +127 °C',
    },
  },
  {
    key: 'Io', name: 'Io', parent: 'Jupiter', source: 'jupiter', jmIndex: 'io',
    radiusKm: 1821.6, displayR: moonDisplayRadius(1821.6), displayDist: 9.5, periodDays: 1.769,
    type: 'Lune galiléenne de Jupiter',
    desc: "L'objet le plus volcanique du système solaire : plus de 400 volcans actifs, chauffés par les marées gravitationnelles de Jupiter. Position réelle calculée en temps réel.",
    info: {
      'Diamètre': '3 643 km',
      'Distance à Jupiter': '421 700 km',
      'Révolution': '1,77 jour',
      'Découverte': 'Galilée, 1610',
    },
  },
  {
    key: 'Europa', name: 'Europe', parent: 'Jupiter', source: 'jupiter', jmIndex: 'europa',
    radiusKm: 1560.8, displayR: moonDisplayRadius(1560.8), displayDist: 12, periodDays: 3.551,
    type: 'Lune galiléenne de Jupiter',
    desc: "Sous sa croûte de glace se cache un océan d'eau liquide contenant deux fois plus d'eau que tous les océans terrestres — l'un des meilleurs candidats pour la vie extraterrestre.",
    info: {
      'Diamètre': '3 122 km',
      'Distance à Jupiter': '671 000 km',
      'Révolution': '3,55 jours',
      'Découverte': 'Galilée, 1610',
    },
  },
  {
    key: 'Ganymede', name: 'Ganymède', parent: 'Jupiter', source: 'jupiter', jmIndex: 'ganymede',
    radiusKm: 2634.1, displayR: moonDisplayRadius(2634.1), displayDist: 15, periodDays: 7.155,
    type: 'Lune galiléenne de Jupiter',
    desc: "La plus grande lune du système solaire — plus grande que Mercure ! C'est la seule lune à posséder son propre champ magnétique.",
    info: {
      'Diamètre': '5 268 km',
      'Distance à Jupiter': '1 070 000 km',
      'Révolution': '7,15 jours',
      'Découverte': 'Galilée, 1610',
    },
  },
  {
    key: 'Callisto', name: 'Callisto', parent: 'Jupiter', source: 'jupiter', jmIndex: 'callisto',
    radiusKm: 2410.3, displayR: moonDisplayRadius(2410.3), displayDist: 18.5, periodDays: 16.689,
    type: 'Lune galiléenne de Jupiter',
    desc: "La surface la plus cratérisée du système solaire, quasiment inchangée depuis 4 milliards d'années — un fossile de la jeunesse du système solaire.",
    info: {
      'Diamètre': '4 821 km',
      'Distance à Jupiter': '1 883 000 km',
      'Révolution': '16,7 jours',
      'Découverte': 'Galilée, 1610',
    },
  },
  {
    key: 'Titan', name: 'Titan', parent: 'Saturn', source: 'circular', periodDays: 15.945,
    radiusKm: 2574.7, displayR: moonDisplayRadius(2574.7), displayDist: 15, realOrbitKm: 1221870,
    type: 'Plus grande lune de Saturne',
    desc: "La seule lune avec une atmosphère épaisse. Il y pleut du méthane liquide qui forme lacs et rivières. La sonde Huygens s'y est posée en 2005. (Position approximative : orbite circulaire.)",
    info: {
      'Diamètre': '5 150 km',
      'Distance à Saturne': '1 222 000 km',
      'Révolution': '15,9 jours',
      'Atmosphère': '95 % azote, 5 % méthane',
    },
  },
  {
    key: 'ISS', name: 'ISS', parent: 'Earth', source: 'circular', periodDays: 0.06452,
    inclinationDeg: 51.6, icon: '🛰️',
    radiusKm: 0.055, displayR: 0.35, displayDist: 4.4, realOrbitKm: 420,
    type: 'Station spatiale internationale',
    desc: "Le plus grand objet jamais construit dans l'espace, habité en permanence depuis novembre 2000. Elle fait le tour de la Terre en 93 minutes à 27 600 km/h — ses occupants voient 16 levers de soleil par jour. Position illustrative : la période, la vitesse et l'inclinaison (51,6°) sont réelles.",
    info: {
      'Altitude': '≈ 400 km',
      'Vitesse': '27 600 km/h (7,7 km/s)',
      'Période': '92,9 min (15,5 tours/jour)',
      'Équipage': '7 astronautes (en général)',
      'Dimensions': '109 m × 73 m',
      'Masse': '≈ 420 tonnes',
      'En orbite depuis': '1998',
      'Visible à l’œil nu': 'Oui, point brillant qui file',
    },
  },
];
