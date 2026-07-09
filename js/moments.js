// Les grands moments de l'aventure spatiale — chaque entrée téléporte la
// simulation à la date exacte. `pbd` déclenche la reconstitution spéciale
// de la photographie « Pale Blue Dot » depuis la position de Voyager 1.

export const MOMENTS = [
  {
    date: Date.UTC(1957, 9, 4, 19, 28), icon: '🛰️', focus: 'Earth',
    title: 'Spoutnik 1, premier satellite',
    desc: 'Un bip-bip radio de 58 cm de diamètre lance l’ère spatiale.',
  },
  {
    date: Date.UTC(1961, 3, 12, 6, 7), icon: '👨‍🚀', focus: 'Earth',
    title: 'Gagarine, premier humain dans l’espace',
    desc: '108 minutes pour un tour de la Terre à bord de Vostok 1.',
  },
  {
    date: Date.UTC(1969, 6, 20, 20, 17), icon: '🌙', focus: 'Moon',
    title: 'Apollo 11 : premiers pas sur la Lune',
    desc: '« Un petit pas pour l’homme… » — Armstrong et Aldrin se posent sur la mer de la Tranquillité.',
  },
  {
    date: Date.UTC(1977, 8, 5, 12, 56), icon: '🚀', focus: 'Voyager1',
    title: 'Décollage de Voyager 1',
    desc: 'Elle emporte le Disque d’or. Personne n’imagine qu’elle parlera encore à la Terre 50 ans plus tard.',
  },
  {
    date: Date.UTC(1979, 2, 5, 12, 0), icon: '🟠', focus: 'Jupiter',
    title: 'Voyager 1 survole Jupiter',
    desc: 'Découverte des volcans d’Io et des détails de la Grande Tache Rouge.',
  },
  {
    date: Date.UTC(1980, 10, 12, 23, 46), icon: '🪐', focus: 'Saturn',
    title: 'Voyager 1 survole Saturne',
    desc: 'Les anneaux comme personne ne les avait jamais vus, puis cap vers les étoiles.',
  },
  {
    date: Date.UTC(1986, 0, 24, 17, 59), icon: '🔭', focus: 'Uranus',
    title: 'Voyager 2 survole Uranus',
    desc: 'La seule visite d’Uranus à ce jour. Dix nouvelles lunes découvertes.',
  },
  {
    date: Date.UTC(1989, 7, 25, 3, 56), icon: '💙', focus: 'Neptune',
    title: 'Voyager 2 survole Neptune',
    desc: 'Dernière escale du Grand Tour : vents à 2 100 km/h et geysers de Triton.',
  },
  {
    date: Date.UTC(1990, 1, 14, 4, 48), icon: '📸', pbd: true,
    title: 'La « Pale Blue Dot »',
    desc: 'Voyager 1 se retourne une dernière fois et photographie la Terre : un point pâle de 0,12 pixel, à 6 milliards de km. Clique pour revivre l’instant depuis la sonde.',
  },
  {
    date: Date.UTC(1997, 6, 4, 16, 57), icon: '🤖', focus: 'Mars',
    title: 'Sojourner roule sur Mars',
    desc: 'Le premier rover martien, gros comme un four à micro-ondes, émerveille le monde.',
  },
  {
    date: Date.UTC(2005, 0, 14, 12, 43), icon: '🧡', focus: 'Titan',
    title: 'Huygens se pose sur Titan',
    desc: 'L’atterrissage le plus lointain de l’histoire, sous la brume orange de la lune de Saturne.',
  },
  {
    date: Date.UTC(2012, 7, 6, 5, 17), icon: '🚁', focus: 'Mars',
    title: 'Curiosity atterrit sur Mars',
    desc: 'Les « 7 minutes de terreur » de la grue volante, en direct dans le cratère Gale.',
  },
];
