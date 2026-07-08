// Textures des astres. Les planètes, le Soleil et la Lune utilisent les vraies
// images (Solar System Scope, CC BY 4.0, d'après l'imagerie NASA) ; les petites
// lunes gardent des textures procédurales dessinées sur canvas.
import * as THREE from 'three';

export const loadingManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadingManager);

const REAL_TEXTURES = {
  Sun: 'textures/2k_sun.jpg',
  Mercury: 'textures/2k_mercury.jpg',
  Venus: 'textures/2k_venus_atmosphere.jpg',
  Earth: 'textures/2k_earth_daymap.jpg',
  Mars: 'textures/2k_mars.jpg',
  Jupiter: 'textures/2k_jupiter.jpg',
  Saturn: 'textures/2k_saturn.jpg',
  Uranus: 'textures/2k_uranus.jpg',
  Neptune: 'textures/2k_neptune.jpg',
  Moon: 'textures/2k_moon.jpg',
};

function realTexture(path) {
  const t = loader.load(path);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Taches aléatoires (cratères, continents, nuages…)
function blobs(ctx, w, h, n, colors, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * (0.35 + Math.random() * 0.65);
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    const r = rMin + Math.random() * (rMax - rMin);
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Bandes horizontales ondulées (géantes gazeuses)
function bands(ctx, w, h, cols) {
  const n = cols.length;
  const bandH = h / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[i];
    ctx.fillRect(0, i * bandH, w, bandH + 1);
  }
  // Adoucit les frontières avec des ondulations
  for (let i = 1; i < n; i++) {
    const y = i * bandH;
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = cols[(i + (k % 2 === 0 ? 0 : -1) + n) % n];
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.beginPath();
      const amp = 2 + k * 2, freq = 15 + k * 12, phase = i * 2.7 + k * 1.3;
      for (let px = 0; px <= w; px += 6) {
        const py = y + Math.sin(px / freq + phase) * amp;
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

const generators = {
  Sun(ctx, w, h) {
    ctx.fillStyle = '#ffb824';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 900, ['#ffd75e', '#ff9a1f', '#fff3b0', '#ff7a00'], 2, 14, 0.35);
    blobs(ctx, w, h, 60, ['#ffe89a'], 8, 26, 0.25);
  },
  Mercury(ctx, w, h) {
    ctx.fillStyle = '#8f8a84';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 350, ['#6f6a64', '#a39d96', '#7c7770', '#5c5751'], 2, 12, 0.5);
    blobs(ctx, w, h, 80, ['#4f4b46'], 1, 5, 0.7);
  },
  Venus(ctx, w, h) {
    bands(ctx, w, h, ['#e8d5a8', '#dcc28a', '#eeddb5', '#d8bd80', '#e5cf9d', '#dbc189', '#ecd9ae']);
    blobs(ctx, w, h, 120, ['#f2e4c0', '#d1b273'], 8, 40, 0.18);
  },
  Earth(ctx, w, h) {
    ctx.fillStyle = '#1a5bb8';
    ctx.fillRect(0, 0, w, h);
    // Continents
    blobs(ctx, w, h, 45, ['#2e7d32', '#4a7c3f', '#8d6e42', '#6b8e4e'], 12, 45, 0.9);
    blobs(ctx, w, h, 120, ['#3b6e35', '#7a6339'], 4, 15, 0.7);
    // Calottes polaires
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(0, 0, w, h * 0.055);
    ctx.fillRect(0, h * 0.945, w, h * 0.055);
    blobs(ctx, w, h * 0.1, 25, ['#ffffff'], 4, 14, 0.8);
    ctx.save(); ctx.translate(0, h * 0.9); blobs(ctx, w, h * 0.1, 25, ['#ffffff'], 4, 14, 0.8); ctx.restore();
    // Nuages
    blobs(ctx, w, h, 90, ['#ffffff'], 4, 20, 0.28);
  },
  Mars(ctx, w, h) {
    ctx.fillStyle = '#c1592f';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 250, ['#a34a26', '#d96f3d', '#8f3f20', '#e08050'], 3, 18, 0.45);
    blobs(ctx, w, h, 40, ['#6e3018'], 8, 30, 0.35); // régions sombres
    // Calottes polaires
    ctx.fillStyle = 'rgba(255,250,245,0.9)';
    ctx.beginPath(); ctx.ellipse(w * 0.5, 0, w * 0.28, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.5, h, w * 0.22, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  },
  Jupiter(ctx, w, h) {
    bands(ctx, w, h, ['#c8b090', '#a8794f', '#e8dcc8', '#b08355', '#ddceb0', '#96683f',
                      '#e2d4bc', '#ab7c50', '#cdb494', '#b9906a']);
    // Grande Tache Rouge
    ctx.fillStyle = '#b5502d';
    ctx.beginPath(); ctx.ellipse(w * 0.68, h * 0.63, w * 0.055, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4693f';
    ctx.beginPath(); ctx.ellipse(w * 0.68, h * 0.63, w * 0.04, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
  },
  Saturn(ctx, w, h) {
    bands(ctx, w, h, ['#e8d9ae', '#d9c692', '#f0e4c0', '#cdb87f', '#e4d4a5', '#d5c28c', '#eaddb8']);
  },
  Uranus(ctx, w, h) {
    ctx.fillStyle = '#9fd8dd';
    ctx.fillRect(0, 0, w, h);
    bands(ctx, w, h, ['#a3dbe0', '#97d2d8', '#abe0e4', '#9cd5da']);
    blobs(ctx, w, h, 40, ['#b8e8ec'], 15, 50, 0.15);
  },
  Neptune(ctx, w, h) {
    bands(ctx, w, h, ['#3a5fd9', '#2f4fc0', '#4a6ee8', '#3556cc', '#4265e0']);
    // Grande Tache Sombre
    ctx.fillStyle = 'rgba(20,35,110,0.8)';
    ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.4, w * 0.05, h * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    blobs(ctx, w, h, 30, ['#7f9df0'], 5, 18, 0.25); // cirrus blancs
  },
  Moon(ctx, w, h) {
    ctx.fillStyle = '#b5b0aa';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 60, ['#8f8a84', '#7c7772'], 8, 26, 0.5);  // mers lunaires
    blobs(ctx, w, h, 300, ['#9c9791', '#6f6a65', '#c4bfb9'], 1, 7, 0.55); // cratères
  },
  Io(ctx, w, h) {
    ctx.fillStyle = '#e8d44f';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 150, ['#d4a017', '#f0e68c', '#b8860b', '#fff8dc'], 3, 14, 0.5);
    blobs(ctx, w, h, 40, ['#8b4513', '#2f2f2f'], 2, 6, 0.7); // volcans
  },
  Europa(ctx, w, h) {
    ctx.fillStyle = '#d8cfc0';
    ctx.fillRect(0, 0, w, h);
    // Lignes de fracture dans la glace
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(160,90,60,${0.2 + Math.random() * 0.4})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      let x = Math.random() * w, y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 90; y += (Math.random() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    blobs(ctx, w, h, 60, ['#e8e0d4'], 5, 20, 0.3);
  },
  Ganymede(ctx, w, h) {
    ctx.fillStyle = '#9a8f80';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 80, ['#7a7065', '#b5aa9a', '#645a50'], 6, 24, 0.5);
    blobs(ctx, w, h, 150, ['#c9beac', '#55493d'], 1, 5, 0.5);
  },
  Callisto(ctx, w, h) {
    ctx.fillStyle = '#6e6258';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 400, ['#8a7d70', '#57493e', '#a09284', '#4a3e34'], 1, 6, 0.6);
    blobs(ctx, w, h, 30, ['#b0a494'], 4, 10, 0.5);
  },
  Titan(ctx, w, h) {
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, 100, ['#c68f2e', '#e8b955', '#b57f28'], 8, 30, 0.3); // brume épaisse
  },
};

export function bodyTexture(key) {
  if (REAL_TEXTURES[key]) return realTexture(REAL_TEXTURES[key]);
  const gen = generators[key] || generators.Moon;
  return makeTexture(512, 256, gen);
}

// Panorama réel de la Voie lactée en toile de fond
export function milkyWayTexture() {
  const t = realTexture('textures/2k_stars_milky_way.jpg');
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// Texture radiale des anneaux (u = position radiale).
// Saturne : vraie texture avec division de Cassini — Uranus : dégradé procédural.
export function ringTexture(faint = false) {
  if (!faint) return realTexture('textures/2k_saturn_ring_alpha.png');
  return makeTexture(512, 8, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(150,170,180,0)');
    g.addColorStop(0.3, 'rgba(150,170,180,0.25)');
    g.addColorStop(0.5, 'rgba(170,190,200,0.1)');
    g.addColorStop(0.8, 'rgba(160,180,190,0.3)');
    g.addColorStop(1, 'rgba(150,170,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Halo lumineux du Soleil
export function glowTexture() {
  return makeTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,230,160,1)');
    g.addColorStop(0.25, 'rgba(255,180,80,0.55)');
    g.addColorStop(0.6, 'rgba(255,140,40,0.15)');
    g.addColorStop(1, 'rgba(255,120,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Petit disque flou pour les étoiles
export function starSpriteTexture() {
  return makeTexture(32, 32, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
