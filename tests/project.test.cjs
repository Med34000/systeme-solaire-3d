const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const Astronomy = require(path.join(ROOT, 'libs/astronomy.browser.min.js'));

async function loadPlanetarium() {
  const source = fs.readFileSync(path.join(ROOT, 'js/planetarium.js'), 'utf8');
  const context = vm.createContext({ window: { Astronomy } });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(() => {
    throw new Error('planetarium.js ne doit pas importer de dépendance ESM');
  });
  await module.evaluate();
  return module.namespace;
}

async function loadQuality({ search = '', cores = 4, memory, touch = 0, compact = false } = {}) {
  const source = fs.readFileSync(path.join(ROOT, 'js/quality.js'), 'utf8');
  const navigator = { hardwareConcurrency: cores, maxTouchPoints: touch };
  if (memory !== undefined) navigator.deviceMemory = memory;
  const context = vm.createContext({
    URLSearchParams,
    location: { search },
    navigator,
    matchMedia: () => ({ matches: compact }),
    document: { getElementById: () => null },
  });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(() => {
    throw new Error('quality.js ne doit pas importer de dépendance ESM');
  });
  await module.evaluate();
  return module.namespace.QUALITY;
}

test('tous les modules JavaScript sont syntaxiquement valides', () => {
  const directories = [path.join(ROOT, 'js'), path.join(ROOT, 'js/features')];
  const files = directories.flatMap((directory) => fs.readdirSync(directory)
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join(directory, name)));

  for (const file of files) {
    assert.doesNotThrow(
      () => new vm.SourceTextModule(fs.readFileSync(file, 'utf8')),
      path.relative(ROOT, file),
    );
  }
});

test('les directions cardinales restent cohérentes', async () => {
  const { compass } = await loadPlanetarium();
  assert.equal(compass(0), 'N');
  assert.equal(compass(90), 'E');
  assert.equal(compass(180), 'S');
  assert.equal(compass(270), 'O');
});

test('les événements sont futurs, triés et retrouvent l’éclipse du 12 août 2026', async () => {
  const { upcomingEvents } = await loadPlanetarium();
  const from = new Date('2026-07-11T00:00:00Z');
  const events = upcomingEvents(from);

  assert.ok(events.length >= 8);
  assert.ok(events.every((event) => event.date >= from));
  assert.ok(events.every((event, index) => (
    index === 0 || event.date >= events[index - 1].date
  )));
  assert.ok(events.some((event) => (
    event.title === 'Éclipse de Soleil totale'
    && event.date.toISOString().startsWith('2026-08-12')
  )));
});

test('le rapport du ciel du Bouveret renvoie des données finies', async () => {
  const { skyReport } = await loadPlanetarium();
  const report = skyReport(new Date('2026-07-11T22:00:00+02:00'), 46.39, 6.86);

  assert.equal(report.rows.length, 6);
  assert.ok(report.rows.every((row) => Number.isFinite(row.altitude)));
  assert.ok(report.moon && report.moon.fraction >= 0 && report.moon.fraction <= 1);
});

test('la qualité visuelle s’adapte et reste forçable par URL', async () => {
  const desktop = await loadQuality({ cores: 10 });
  const mobile = await loadQuality({ cores: 6, touch: 5, compact: true });
  const forcedLow = await loadQuality({ search: '?quality=low', cores: 12, memory: 16 });

  assert.equal(desktop.tier, 'high');
  assert.equal(desktop.automatic, true);
  assert.equal(mobile.tier, 'medium');
  assert.equal(forcedLow.tier, 'low');
  assert.equal(forcedLow.automatic, false);
  assert.equal(forcedLow.nightLights, false);
});

test('le HTML conserve les garde-fous d’accessibilité essentiels', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(html, /maximum-scale\s*=\s*1/i);
  assert.doesNotMatch(html, /<span[^>]*>\s*<div/i);
  assert.match(html, /id="nav-toggle"[^>]+aria-label=/);
  assert.match(html, /class="panel-close"[^>]+aria-label=/);
  assert.match(html, /id="quality-badge"/);
});
