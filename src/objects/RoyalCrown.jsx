import {
  Group,
  Mesh,
  InstancedMesh,
  LatheGeometry,
  TorusGeometry,
  CylinderGeometry,
  SphereGeometry,
  BoxGeometry,
  ConeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  Color,
  Matrix4,
} from 'three';

/**
 * Mahkota kerajaan emas berukir dengan permata rubi & safir,
 * bertumpu di atas bantal beludru burgundy berjumbai emas.
 */
export function createRoyalCrown() {
  const root = new Group();
  root.name = 'RoyalCrownAssembly';

  const goldMat = new MeshPhysicalMaterial({
    color: new Color('#d6b168'),
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
  });

  const pearlMat = new MeshPhysicalMaterial({
    color: new Color('#f6efe2'),
    metalness: 0.05,
    roughness: 0.24,
    clearcoat: 0.85,
  });

  const rubyMat = new MeshPhysicalMaterial({
    color: new Color('#8f1122'),
    metalness: 0.05,
    roughness: 0.1,
    transmission: 0.42,
    ior: 1.77,
    thickness: 0.18,
    clearcoat: 1.0,
  });

  const sapphireMat = new MeshPhysicalMaterial({
    color: new Color('#14356e'),
    metalness: 0.05,
    roughness: 0.1,
    transmission: 0.42,
    ior: 1.77,
    thickness: 0.18,
    clearcoat: 1.0,
  });

  const velvetMat = new MeshStandardMaterial({
    color: new Color('#4d131d'),
    roughness: 0.88,
    metalness: 0.02,
  });

  // 1. Bantal Beludru Burgundy
  const cushionGroup = new Group();
  const cushion = new Mesh(new BoxGeometry(0.56, 0.11, 0.56, 12, 4, 12), velvetMat);
  const cPos = cushion.geometry.attributes.position;
  for (let i = 0; i < cPos.count; i += 1) {
    const x = cPos.getX(i) / 0.28;
    const y = cPos.getY(i);
    const z = cPos.getZ(i) / 0.28;
    const puff = (1 - x * x * 0.65) * (1 - z * z * 0.65);
    cPos.setY(i, y + (y > 0 ? puff * 0.032 : 0));
  }
  cushion.geometry.computeVertexNormals();
  cushion.position.y = 0.055;
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  cushionGroup.add(cushion);

  // Jumbai sudut emas
  [
    [-0.28, -0.28],
    [0.28, -0.28],
    [-0.28, 0.28],
    [0.28, 0.28],
  ].forEach(([tx, tz]) => {
    const tassel = new Mesh(new ConeGeometry(0.024, 0.075, 10), goldMat);
    tassel.position.set(tx, 0.038, tz);
    tassel.rotation.set(tz > 0 ? 0.45 : -0.45, 0, tx > 0 ? -0.45 : 0.45);
    cushionGroup.add(tassel);
  });
  root.add(cushionGroup);

  // 2. Mahkota Kerajaan
  const crown = new Group();
  crown.position.y = 0.125;
  crown.rotation.set(0.04, 0.35, -0.03);

  // Sirklet utama
  const circletProfile = [
    new Vector2(0.155, 0.0),
    new Vector2(0.168, 0.015),
    new Vector2(0.165, 0.075),
    new Vector2(0.176, 0.095),
    new Vector2(0.158, 0.095),
    new Vector2(0.152, 0.0),
  ];
  const circlet = new Mesh(new LatheGeometry(circletProfile, 48), goldMat);
  circlet.castShadow = true;
  circlet.receiveShadow = true;
  crown.add(circlet);

  // Kap beludru bagian dalam mahkota
  const cap = new Mesh(new SphereGeometry(0.158, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), velvetMat);
  cap.position.y = 0.068;
  cap.scale.set(1, 0.85, 1);
  crown.add(cap);

  // 36 butir mutiara di tepi atas & bawah sirklet (InstancedMesh)
  const pearlGeom = new SphereGeometry(0.0085, 10, 10);
  const pearls = new InstancedMesh(pearlGeom, pearlMat, 36);
  const m = new Matrix4();
  for (let i = 0; i < 36; i += 1) {
    const ring = i < 18 ? 0 : 1;
    const idx = i % 18;
    const a = (idx / 18) * Math.PI * 2;
    const r = ring === 0 ? 0.169 : 0.176;
    const y = ring === 0 ? 0.014 : 0.092;
    m.makeTranslation(Math.cos(a) * r, y, Math.sin(a) * r);
    pearls.setMatrixAt(i, m);
  }
  pearls.instanceMatrix.needsUpdate = true;
  crown.add(pearls);

  // 8 Ornamen Fleur-de-lis & Salib di sekeliling mahkota + Permata Rubi & Safir
  const gemGeom = new SphereGeometry(0.014, 14, 14);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const crest = new Group();
    crest.rotation.y = a;

    const spire = new Mesh(new ConeGeometry(0.022, 0.056, 6), goldMat);
    spire.position.set(0.168, 0.122, 0);
    crest.add(spire);

    const sideLeafL = new Mesh(new SphereGeometry(0.012, 8, 8), goldMat);
    sideLeafL.position.set(0.166, 0.108, 0.018);
    crest.add(sideLeafL);

    const sideLeafR = sideLeafL.clone();
    sideLeafR.position.z = -0.018;
    crest.add(sideLeafR);

    // Permata rubi dan safir bergantian pada sirklet
    const gem = new Mesh(gemGeom, i % 2 === 0 ? rubyMat : sapphireMat);
    gem.scale.set(0.65, 1.15, 1.0);
    gem.position.set(0.171, 0.052, 0);
    crest.add(gem);

    crown.add(crest);
  }

  // 4 Lengkungan Imperial (Imperial Arches) bertemu di puncak
  for (let i = 0; i < 4; i += 1) {
    const arch = new Mesh(
      new TorusGeometry(0.158, 0.011, 10, 28, Math.PI * 0.88),
      goldMat
    );
    arch.rotation.y = (i / 4) * Math.PI * 2;
    arch.rotation.z = Math.PI * 0.06;
    arch.position.y = 0.095;
    arch.castShadow = true;
    crown.add(arch);
  }

  // Bola dunia (Monde) & Salib emas di puncak mahkota
  const monde = new Mesh(new SphereGeometry(0.028, 18, 18), goldMat);
  monde.position.y = 0.258;
  monde.castShadow = true;
  crown.add(monde);

  const crossV = new Mesh(new BoxGeometry(0.01, 0.056, 0.01), goldMat);
  crossV.position.y = 0.305;
  crown.add(crossV);

  const crossH = new Mesh(new BoxGeometry(0.038, 0.01, 0.01), goldMat);
  crossH.position.y = 0.312;
  crown.add(crossH);

  root.add(crown);
  return root;
}