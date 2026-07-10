// Accueil + hub « Découvrir » : une entrée Explorer, les expériences en second plan.

import { showLeftPanel } from './panels.js';
import { openEventsPanel } from './features/events.js';
import { openSkyPanel } from './features/sky.js';
import { openBirthPanel } from './features/birth.js';
import { openHistoryPanel } from './features/history.js';
import { openLightPanel } from './features/light-race.js';
import { startScaleTransition } from './scale-mode.js';

const WELCOME_KEY = 'ss3d-welcome-dismissed';

function openRealScale() {
  showLeftPanel('');
  const cb = document.getElementById('toggle-scale');
  if (cb) cb.checked = true;
  startScaleTransition(true);
}

const FEATURES = {
  events: openEventsPanel,
  sky: openSkyPanel,
  birth: openBirthPanel,
  history: openHistoryPanel,
  light: openLightPanel,
  scale: openRealScale,
};

export function openDiscoverPanel() {
  showLeftPanel('discover');
}

function dismissWelcome() {
  const el = document.getElementById('welcome');
  if (el) el.classList.add('hidden');
  try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch { /* — */ }
}

export function setupOnboarding() {
  const welcome = document.getElementById('welcome');
  let already = false;
  try { already = sessionStorage.getItem(WELCOME_KEY) === '1'; } catch { /* — */ }
  if (already && welcome) welcome.classList.add('hidden');

  document.getElementById('welcome-explore')?.addEventListener('click', () => {
    dismissWelcome();
  });
  document.getElementById('welcome-discover')?.addEventListener('click', () => {
    dismissWelcome();
    openDiscoverPanel();
  });

  document.getElementById('discover-btn')?.addEventListener('click', openDiscoverPanel);

  document.querySelectorAll('.discover-card').forEach((card) => {
    card.addEventListener('click', () => {
      const fn = FEATURES[card.dataset.feature];
      if (fn) fn();
    });
  });
}
