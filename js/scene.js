// Scène Three.js : caméra, rendu, contrôles, lumière, fond d'étoiles.

import * as THREE from 'three';
import { OrbitControls } from '../libs/OrbitControls.js';
import { CSS2DRenderer } from '../libs/CSS2DRenderer.js';
import { milkyWayTexture, starSpriteTexture } from './textures.js';
import { QUALITY } from './quality.js';

import { DEFAULT_OVERVIEW_CAM } from './scale.js';

export const DEFAULT_CAM = DEFAULT_OVERVIEW_CAM;

export const scene = new THREE.Scene();
scene.background = milkyWayTexture();
scene.backgroundIntensity = 0.45;

export const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 30000);
camera.position.copy(DEFAULT_CAM);

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY.pixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);

export const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 4000;

scene.add(new THREE.AmbientLight(0x445577, 0.5));

// Groupe contenant tout le système : en mode « dérive galactique », c'est lui qui se déplace.
export const systemGroup = new THREE.Group();
scene.add(systemGroup);

// decay = 0 : pas d'atténuation, sinon les planètes lointaines seraient invisibles
const sunLight = new THREE.PointLight(0xfff2d8, 1.8, 0, 0);
sunLight.decay = 0;
systemGroup.add(sunLight);

// Champ d'étoiles (coquille sphérique)
{
  const N = QUALITY.starCount;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const tints = [[1, 1, 1], [0.8, 0.87, 1], [1, 0.92, 0.8], [1, 0.85, 0.85], [0.85, 1, 0.95]];
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u), r = 6000 + Math.random() * 4000;
    pos[i * 3] = r * s * Math.cos(ph); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(ph);
    const t = tints[(Math.random() * tints.length) | 0], b = 0.4 + Math.random() * 0.6;
    col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 14, map: starSpriteTexture(), vertexColors: true,
    transparent: true, depthWrite: false, sizeAttenuation: true,
  })));
}

export function setupResize() {
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY.pixelRatio));
    labelRenderer.setSize(innerWidth, innerHeight);
  });
}
