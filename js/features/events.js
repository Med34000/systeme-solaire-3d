// Événements célestes à venir.

import { upcomingEvents } from '../planetarium.js';
import { sim } from '../sim.js';
import { bodyByKey } from '../world.js';
import { setSpeed } from '../time.js';
import { clearTrails } from '../drift.js';
import { showLeftPanel } from '../panels.js';
import { focusBody } from '../focus.js';

const eventsList = document.getElementById('events-list');
const eventsFrom = document.getElementById('events-from');

export function renderEvents() {
  eventsFrom.textContent = 'À partir du ' + sim.date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  eventsList.innerHTML = '';
  for (const ev of upcomingEvents(sim.date)) {
    const row = document.createElement('div');
    row.className = 'event-row';
    const icon = document.createElement('div');
    icon.className = 'event-icon';
    icon.textContent = ev.icon;
    const main = document.createElement('div');
    main.className = 'event-main';
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = ev.date.toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = ev.title;
    main.append(date, title);
    if (ev.desc) {
      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = ev.desc;
      main.appendChild(desc);
    }
    const go = document.createElement('button');
    go.className = 'event-go';
    go.textContent = '▶ Voir';
    go.addEventListener('click', () => {
      sim.date = new Date(ev.date);
      sim.syncedToNow = false;
      setSpeed(0);
      clearTrails();
      const b = bodyByKey.get(ev.focus);
      if (b) focusBody(b);
    });
    row.append(icon, main, go);
    eventsList.appendChild(row);
  }
}

export function openEventsPanel() {
  renderEvents();
  showLeftPanel('events');
}
