// Profil visuel automatique : garde les effets essentiels tout en adaptant le
// coût GPU aux capacités probables de l'appareil. Forçable via ?quality=low|medium|high.

const PRESETS = {
  low: {
    label: 'Éco', pixelRatio: 1.15, starCount: 2200,
    planetSegments: [32, 24], moonSegments: [24, 16], ringSegments: 128,
    atmosphere: true, nightLights: false, sunGlowLayers: 2, labelBudget: 10,
  },
  medium: {
    label: 'Équilibrée', pixelRatio: 1.5, starCount: 3400,
    planetSegments: [48, 32], moonSegments: [28, 20], ringSegments: 192,
    atmosphere: true, nightLights: true, sunGlowLayers: 3, labelBudget: 14,
  },
  high: {
    label: 'Élevée', pixelRatio: 2, starCount: 4800,
    planetSegments: [64, 48], moonSegments: [32, 24], ringSegments: 256,
    atmosphere: true, nightLights: true, sunGlowLayers: 3, labelBudget: 19,
  },
};

function detectTier() {
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced && PRESETS[forced]) return { tier: forced, automatic: false };

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory ?? null;
  const touchDevice = navigator.maxTouchPoints > 0;
  const compactScreen = matchMedia('(max-width: 768px)').matches;

  if (cores <= 2 || (memory !== null && memory <= 2)) return { tier: 'low', automatic: true };
  if (cores >= 8 && (memory === null || memory >= 8) && !touchDevice && !compactScreen) {
    return { tier: 'high', automatic: true };
  }
  return { tier: 'medium', automatic: true };
}

const detected = detectTier();

export const QUALITY = Object.freeze({
  tier: detected.tier,
  automatic: detected.automatic,
  ...PRESETS[detected.tier],
});

export function setupQualityBadge() {
  const badge = document.getElementById('quality-badge');
  if (!badge) return;
  badge.textContent = `${QUALITY.automatic ? 'Auto' : 'Forcée'} · qualité ${QUALITY.label}`;
  badge.dataset.tier = QUALITY.tier;
  badge.title = QUALITY.automatic
    ? 'Le niveau visuel est choisi selon la mémoire, le processeur et le type d’appareil.'
    : 'Niveau visuel forcé par le paramètre quality dans l’URL.';
}
