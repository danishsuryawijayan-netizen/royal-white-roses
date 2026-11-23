import {
  Group,
  Mesh,
  PlaneGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Color,
  DoubleSide,
} from 'three';
import { createParchmentTexture } from '../utils/proceduralTextures.js';

function buildCurledParchmentSheet({ width = 0.44, depth = 0.34, curlAmount = 0.014, seed = 1001 }) {
  const geom = new PlaneGeometry(width, depth, 18, 14);
  geom.rotateX(-Math.PI / 2);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / (width * 0.5);
    const nz = z / (depth * 0.5);
    const cornerLift = Math.pow(Math.abs(nx * nz), 1.8) * curlAmount;
    const wave = Math.sin(nx * 3.1 + nz * 2.2) * 0.0025;
    pos.setY(i, 0.002 + cornerLift + wave);
  }
  geom.computeVertexNormals();

  const tex = createParchmentTexture(seed);
  const mat = new MeshStandardMaterial({
    map: tex,
    roughness: 0.82,
    metalness: 0.0,
    side: DoubleSide,
  });

  const mesh = new Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Tiga lembar perkamen tua di atas alas meja dengan segel lilin kerajaan burgundy.
 */
export function createParchments() {
  const group = new Group();
  group.name = 'RoyalParchments';

  const sheet1 = buildCurledParchmentSheet({ width: 0.48, depth: 0.36, curlAmount: 0.012, seed: 1011 });
  sheet1.position.set(0.24, 0.011, 0.16);
  sheet1.rotation.y = 0.08;
  group.add(sheet1);

  const sheet2 = buildCurledParchmentSheet({ width: 0.42, depth: 0.31, curlAmount: 0.016, seed: 1022 });
  sheet2.position.set(0.31, 0.015, 0.21);
  sheet2.rotation.y = -0.14;
  group.add(sheet2);

  const sheet3 = buildCurledParchmentSheet({ width: 0.34, depth: 0.26, curlAmount: 0.018, seed: 1033 });
  sheet3.position.set(-0.32, 0.003, 0.42);
  sheet3.rotation.y = 0.34;
  group.add(sheet3);

  // Segel lilin merah burgundy pada lembar perkamen kedua
  const waxSeal = new Mesh(
    new CylinderGeometry(0.028, 0.032, 0.008, 20),
    new MeshStandardMaterial({ color: new Color('#681822'), roughness: 0.38, metalness: 0.06 })
  );
  waxSeal.position.set(0.41, 0.02, 0.29);
  waxSeal.castShadow = true;
  group.add(waxSeal);

  return group;
}