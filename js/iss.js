// Modèle 3D stylisé de la Station spatiale internationale, construit en
// primitives Three.js : poutre centrale, 8 panneaux solaires en 4 paires,
// chaîne de modules pressurisés, radiateurs. Axe +Z orienté vers la Terre
// (la station pivote une fois par orbite, comme la vraie).
import * as THREE from 'three';

export function buildISS() {
  const iss = new THREE.Group();

  // Émissivité légère : la station reste lisible même dans l'ombre de la Terre
  const silver = new THREE.MeshLambertMaterial({ color: 0xb8bcc4, emissive: 0x1a1e26 });
  const white = new THREE.MeshLambertMaterial({ color: 0xdfe3ea, emissive: 0x22262e });
  const gold = new THREE.MeshLambertMaterial({ color: 0xc8862e, emissive: 0x4a2c0a });
  const radiator = new THREE.MeshLambertMaterial({ color: 0xe8ecf4, emissive: 0x24282f, side: THREE.DoubleSide });

  // Poutre centrale (truss) le long de X
  const truss = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 0.07), silver);
  iss.add(truss);

  // 4 paires de panneaux solaires aux extrémités de la poutre
  const panelGeo = new THREE.BoxGeometry(0.2, 0.75, 0.015);
  const mastGeo = new THREE.BoxGeometry(0.025, 0.14, 0.025);
  for (const x of [-1.16, -0.82, 0.82, 1.16]) {
    for (const side of [1, -1]) {
      const panel = new THREE.Mesh(panelGeo, gold);
      panel.position.set(x, side * 0.52, 0);
      iss.add(panel);
      const mast = new THREE.Mesh(mastGeo, silver);
      mast.position.set(x, side * 0.1, 0);
      iss.add(mast);
    }
  }

  // Chaîne de modules pressurisés le long de Y (sens de la marche)
  const modules = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.1, 12), white);
  modules.position.set(0, 0.02, 0.12);
  iss.add(modules);
  for (const y of [-0.53, 0.57]) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), white);
    node.position.set(0, y, 0.12);
    iss.add(node);
  }
  // Modules latéraux (type Columbus / Kibo), le long de X
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.5, 10), white);
  lab.rotation.z = Math.PI / 2;
  lab.position.set(0, 0.3, 0.12);
  iss.add(lab);

  // Radiateurs blancs près du centre
  const radGeo = new THREE.BoxGeometry(0.16, 0.5, 0.012);
  for (const x of [-0.45, 0.45]) {
    const rad = new THREE.Mesh(radGeo, radiator);
    rad.position.set(x, -0.34, 0.1);
    rad.rotation.x = 0.5;
    iss.add(rad);
  }

  iss.scale.setScalar(0.62);
  return iss;
}
