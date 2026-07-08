// Modèles 3D stylisés des engins spatiaux, construits en primitives Three.js.
// Légère émissivité sur les matériaux : les engins restent lisibles à l'ombre.
import * as THREE from 'three';

// ---------- Station spatiale internationale ----------
// Poutre centrale, 8 panneaux solaires en 4 paires, chaîne de modules
// pressurisés, radiateurs. Axe +Z orienté vers la Terre (la station pivote
// une fois par orbite, comme la vraie).
export function buildISS() {
  const iss = new THREE.Group();

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

// ---------- Sonde Voyager ----------
// Grande antenne parabolique blanche (ouverte vers +Z, pointée vers la Terre
// par lookAt), bus décagonal sous couvertures thermiques sombres, Disque d'or,
// bras des RTG, bras scientifique avec caméras, perche du magnétomètre.
export function buildVoyager() {
  const v = new THREE.Group();

  const white = new THREE.MeshLambertMaterial({ color: 0xe8eaf0, emissive: 0x262a32, side: THREE.DoubleSide });
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a3d45, emissive: 0x15171d });
  const black = new THREE.MeshLambertMaterial({ color: 0x22242a, emissive: 0x0e1014 });
  const silver = new THREE.MeshLambertMaterial({ color: 0xb0b4bc, emissive: 0x1c2028 });
  const gold = new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0x66490a });

  // Antenne parabolique : calotte sphérique, concavité ouverte vers +Z
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.35),
    white,
  );
  dish.rotation.x = -Math.PI / 2;
  v.add(dish);

  // Mât du récepteur au foyer de la parabole
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), silver);
  strut.rotation.x = Math.PI / 2;
  strut.position.set(0, 0, -0.28);
  v.add(strut);
  const feed = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 10), dark);
  feed.rotation.x = -Math.PI / 2;
  feed.position.set(0, 0, -0.06);
  v.add(feed);

  // Bus décagonal derrière la parabole
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 10), dark);
  bus.rotation.x = Math.PI / 2;
  bus.position.set(0, 0, -0.58);
  v.add(bus);

  // Le Disque d'or 💿 sur le flanc du bus
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 20), gold);
  record.rotation.z = Math.PI / 2;
  record.position.set(0.175, 0.02, -0.58);
  v.add(record);

  // Bras des générateurs nucléaires (RTG) côté -X
  const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), silver);
  rtgBoom.rotation.z = Math.PI / 2;
  rtgBoom.position.set(-0.42, 0, -0.58);
  v.add(rtgBoom);
  const rtgGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.1, 10);
  for (const x of [-0.3, -0.43, -0.56]) {
    const rtg = new THREE.Mesh(rtgGeo, black);
    rtg.rotation.z = Math.PI / 2;
    rtg.position.set(x, 0, -0.58);
    v.add(rtg);
  }

  // Bras scientifique côté +X, avec plateforme de balayage et caméras
  const sciBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), silver);
  sciBoom.rotation.z = Math.PI / 2;
  sciBoom.position.set(0.52, 0, -0.58);
  v.add(sciBoom);
  const platform = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), silver);
  platform.position.set(0.9, 0, -0.58);
  v.add(platform);
  const camera = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 10), black);
  camera.rotation.x = Math.PI / 2;
  camera.position.set(0.9, 0.02, -0.5);
  v.add(camera);

  // Longue perche du magnétomètre vers l'arrière
  const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.3, 6), silver);
  magBoom.rotation.set(Math.PI / 2 + 0.32, 0.22, 0);
  magBoom.position.set(-0.14, 0.2, -1.05);
  v.add(magBoom);

  // Deux antennes filaires en V (radioastronomie planétaire)
  const whipGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.8, 6);
  for (const side of [1, -1]) {
    const whip = new THREE.Mesh(whipGeo, silver);
    whip.rotation.set(Math.PI / 2, side * 0.28, 0);
    whip.position.set(side * 0.14, -0.08, -0.92);
    v.add(whip);
  }

  v.scale.setScalar(0.75);
  return v;
}
