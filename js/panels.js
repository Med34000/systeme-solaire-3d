// Gestion des panneaux latéraux mutuellement exclusifs.

import { sim } from './sim.js';

export const leftPanels = {
  info: document.getElementById('info-panel'),
  discover: document.getElementById('discover-panel'),
  events: document.getElementById('events-panel'),
  sky: document.getElementById('sky-panel'),
  birth: document.getElementById('birth-panel'),
  history: document.getElementById('history-panel'),
  light: document.getElementById('light-panel'),
};

/** Callbacks optionnels à la fermeture d'un panneau (évite les cycles d'import). */
const closeHooks = new Map();
export function onPanelClose(panelId, fn) {
  closeHooks.set(panelId, fn);
}

export function showLeftPanel(name) {
  for (const [k, el] of Object.entries(leftPanels)) {
    el.classList.toggle('visible', k === name);
  }
  if (name !== 'info') sim.liveRows = null;
  if (name && matchMedia('(max-width: 768px)').matches) {
    document.getElementById('time-controls').classList.remove('open');
  }
}

export function setupPanelCloses() {
  document.querySelectorAll('.panel-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      parent.classList.remove('visible');
      if (parent === leftPanels.info) sim.liveRows = null;
      const hook = closeHooks.get(parent.id);
      if (hook) hook();
    });
  });
}

export function setupMobileDrawers() {
  const navPanelEl = document.getElementById('nav-panel');
  const timePanelEl = document.getElementById('time-controls');
  const navToggle = document.getElementById('nav-toggle');
  const timeToggle = document.getElementById('time-toggle');

  const syncDrawerState = () => {
    const navOpen = navPanelEl.classList.contains('open');
    const timeOpen = timePanelEl.classList.contains('open');
    navToggle.setAttribute('aria-expanded', String(navOpen));
    navToggle.setAttribute('aria-label', navOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    timeToggle.setAttribute('aria-expanded', String(timeOpen));
    timeToggle.setAttribute('aria-label', timeOpen
      ? 'Fermer les contrôles du temps'
      : 'Ouvrir les contrôles du temps');
  };

  navToggle.addEventListener('click', () => {
    navPanelEl.classList.toggle('open');
    timePanelEl.classList.remove('open');
    syncDrawerState();
  });
  timeToggle.addEventListener('click', () => {
    timePanelEl.classList.toggle('open');
    navPanelEl.classList.remove('open');
    syncDrawerState();
    if (timePanelEl.classList.contains('open') && matchMedia('(max-width: 768px)').matches) {
      showLeftPanel('');
    }
  });

  const closeNavDrawer = () => {
    if (matchMedia('(max-width: 768px)').matches) {
      navPanelEl.classList.remove('open');
      syncDrawerState();
    }
  };
  navPanelEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', closeNavDrawer));
  document.getElementById('goto-select').addEventListener('change', closeNavDrawer);
}
