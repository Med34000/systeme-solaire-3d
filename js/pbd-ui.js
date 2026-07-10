// Légende Pale Blue Dot (module minimal pour éviter les cycles).

const pbdCaption = document.getElementById('pbd-caption');

export function hidePBD() {
  pbdCaption.classList.remove('visible');
}

export function showPBD() {
  pbdCaption.classList.add('visible');
}
