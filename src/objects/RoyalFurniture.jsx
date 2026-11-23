import {
  Group,
  Mesh,
  InstancedMesh,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Color,
  Matrix4,
  Vector3,
} from 'three';
import {
  createWoodTextures,
  createRoyalPaintingTexture,
  createPersianCarpetTexture,
} from '../utils/proceduralTextures.js';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';

/**
 * Arsitektur ruang kerja & galeri koleksi kerajaan abad ke-17:
 * panel kayu boiserie, pilar korintus, karpet Persia, rak buku antik,
 * 3 lukisan potret kerajaan berbingkai emas, tempat lilin meja, dan chandelier.
 */
export function createRoyalAtelierRoom(seed = 1680) {
  const rng = createSeededRandom(seed);
  const room = new Group();
  room.name = 'RoyalAtelierArchitecture';

  const wallWood = createWoodTextures({
    baseRgb: [44, 27, 19],
    grainRgb: [22, 13, 9],
    highlightRgb: [68, 44, 30],
    seed: 1201,
    repeatX: 4,
    repeatY: 2,
  });

  const floorWood = createWoodTextures({
    baseRgb: [38, 24, 16],
    grainRgb: [19, 11, 7],
    highlightRgb: [58, 38, 26],
    seed: 1217,
    repeatX: 6,
    repeatY: 6,
  });

  const boiserieMat = new MeshStandardMaterial({
    map: wallWood.map,
    bumpMap: wallWood.bumpMap,
    bumpScale: 0.014,
    roughness: 0.52,
  });

  const plasterWallMat = new MeshStandardMaterial({
    color: new Color('#3a2c22'),
    roughness: 0.86,
  });

  const floorMat = new MeshStandardMaterial({
    map: floorWood.map,
    bumpMap: floorWood.bumpMap,
    bumpScale: 0.012,
    roughness: 0.44,
  });

  const goldMat = new MeshStandardMaterial({
    color: new Color('#bfa062'),
    roughness: 0.36,
    metalness: 0.82,
  });

  const bronzeMat = new MeshStandardMaterial({
    color: new Color('#6a502d'),
    roughness: 0.38,
    metalness: 0.84,
  });

  // Lantai (y = -1.48 di bawah kaki meja) & Karpet Persia
  const floor = new Mesh(new PlaneGeometry(14, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.48;
  floor.receiveShadow = true;
  room.add(floor);

  const carpetTex = createPersianCarpetTexture(1231);
  const carpet = new Mesh(
    new PlaneGeometry(6.8, 5.2),
    new MeshStandardMaterial({ map: carpetTex, roughness: 0.88 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, -1.475, -0.35);
  carpet.receiveShadow = true;
  room.add(carpet);

  // Dinding belakang & samping
  const backWall = new Mesh(new PlaneGeometry(14, 7.2), plasterWallMat);
  backWall.position.set(0, 2.1, -4.4);
  backWall.receiveShadow = true;
  room.add(backWall);

  const leftWall = new Mesh(new PlaneGeometry(12, 7.2), plasterWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-5.6, 2.1, 0.5);
  room.add(leftWall);

  const rightWall = new Mesh(new PlaneGeometry(12, 7.2), plasterWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(5.6, 2.1, 0.5);
  room.add(rightWall);

  // Panel wainscot kayu bawah sepanjang dinding
  const backWainscot = new Mesh(new BoxGeometry(13.8, 1.55, 0.14), boiserieMat);
  backWainscot.position.set(0, -0.7, -4.34);
  room.add(backWainscot);

  const wainscotGoldRail = new Mesh(new BoxGeometry(13.8, 0.05, 0.18), goldMat);
  wainscotGoldRail.position.set(0, 0.08, -4.32);
  room.add(wainscotGoldRail);

  // Pilar arsitektural berukir
  [-4.2, -0.9, 2.1, 4.4].forEach((px) => {
    const pilaster = new Mesh(new BoxGeometry(0.32, 6.4, 0.24), boiserieMat);
    pilaster.position.set(px, 1.7, -4.28);
    room.add(pilaster);

    const capital = new Mesh(new BoxGeometry(0.42, 0.22, 0.32), goldMat);
    capital.position.set(px, 4.85, -4.26);
    room.add(capital);
  });

  // Langit-langit balok kayu coffered & Chandelier
  const ceiling = new Mesh(new PlaneGeometry(14, 12), boiserieMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5.2;
  room.add(ceiling);

  const chandelier = new Group();
  chandelier.position.set(0.2, 4.15, -1.6);
  const chain = new Mesh(new CylinderGeometry(0.018, 0.018, 1.1, 8), bronzeMat);
  chain.position.y = 0.55;
  chandelier.add(chain);

  const hoop = new Mesh(new TorusGeometry(0.62, 0.028, 10, 32), bronzeMat);
  hoop.rotation.x = Math.PI / 2;
  chandelier.add(hoop);
  room.add(chandelier);

  // Rak buku & lemari koleksi antik di sisi kanan belakang (dengan tempat untuk fallingBook)
  const bookcase = new Group();
  bookcase.position.set(2.95, -1.48, -3.55);
  bookcase.rotation.y = -0.24;

  const caseBack = new Mesh(new BoxGeometry(1.85, 3.65, 0.44), boiserieMat);
  caseBack.position.y = 1.825;
  caseBack.castShadow = true;
  caseBack.receiveShadow = true;
  bookcase.add(caseBack);

  const shelfHeights = [0.45, 1.15, 1.85, 2.55, 3.25];
  shelfHeights.forEach((sy) => {
    const shelf = new Mesh(new BoxGeometry(1.9, 0.055, 0.48), goldMat);
    shelf.position.set(0, sy, 0.03);
    bookcase.add(shelf);
  });

  // 45 jilid buku instanced pada rak latar
  const shelfBookGeom = new BoxGeometry(0.058, 0.34, 0.28);
  const shelfBookMat = new MeshStandardMaterial({ roughness: 0.62 });
  const shelfBooks = new InstancedMesh(shelfBookGeom, shelfBookMat, 45);
  const bookColors = ['#4d1920', '#233b30', '#3a2418', '#5e3c22', '#2b1b24'];
  const mat4 = new Matrix4();
  const tempColor = new Color();

  let bIdx = 0;
  for (let row = 0; row < 3; row += 1) {
    const yBase = shelfHeights[row + 1] + 0.195;
    for (let col = 0; col < 15; col += 1) {
      if (bIdx >= 45) break;
      const xPos = -0.74 + col * 0.098;
      const scaleY = randomRange(rng, 0.84, 1.08);
      mat4.makeScale(1, scaleY, 1);
      mat4.setPosition(xPos, yBase - (1 - scaleY) * 0.15, 0.06);
      shelfBooks.setMatrixAt(bIdx, mat4);
      tempColor.set(bookColors[(bIdx + row) % bookColors.length]);
      shelfBooks.setColorAt(bIdx, tempColor);
      bIdx += 1;
    }
  }
  shelfBooks.instanceMatrix.needsUpdate = true;
  if (shelfBooks.instanceColor) shelfBooks.instanceColor.needsUpdate = true;
  bookcase.add(shelfBooks);

  // Artefak bola dunia antik di puncak rak
  const globeStand = new Mesh(new CylinderGeometry(0.11, 0.14, 0.12, 16), bronzeMat);
  globeStand.position.set(-0.35, 3.34, 0.04);
  bookcase.add(globeStand);

  const globe = new Mesh(
    new SphereGeometry(0.17, 20, 16),
    new MeshStandardMaterial({ color: new Color('#9e8356'), roughness: 0.48, metalness: 0.2 })
  );
  globe.position.set(-0.35, 3.55, 0.04);
  bookcase.add(globe);

  room.add(bookcase);

  // 3 Lukisan klasik abad ke-17 berbingkai emas ukir di dinding latar
  const paintings = [
    { x: 0.65, y: 2.05, z: -4.28, w: 1.25, h: 1.56, variant: 0 },
    { x: 2.25, y: 2.15, z: -4.28, w: 0.96, h: 1.2, variant: 1 },
    { x: -0.25, y: 3.45, z: -4.28, w: 1.1, h: 0.82, variant: 2 },
  ];

  paintings.forEach((p, idx) => {
    const frameGroup = new Group();
    frameGroup.position.set(p.x, p.y, p.z);

    const outerFrame = new Mesh(new BoxGeometry(p.w + 0.18, p.h + 0.18, 0.08), goldMat);
    outerFrame.castShadow = true;
    frameGroup.add(outerFrame);

    const canvasTex = createRoyalPaintingTexture(p.variant, 1301 + idx * 19);
    const canvasMesh = new Mesh(
      new PlaneGeometry(p.w, p.h),
      new MeshStandardMaterial({ map: canvasTex, roughness: 0.45 })
    );
    canvasMesh.position.z = 0.045;
    frameGroup.add(canvasMesh);

    room.add(frameGroup);
  });

  // Tempat lilin perak/perunggu di sudut kiri belakang meja + 2 lilin beeswax
  const candelabra = new Group();
  candelabra.position.set(-1.38, 0, -0.46);

  const foot = new Mesh(new CylinderGeometry(0.08, 0.12, 0.045, 20), bronzeMat);
  foot.position.y = 0.022;
  foot.castShadow = true;
  candelabra.add(foot);

  const stem = new Mesh(new CylinderGeometry(0.018, 0.028, 0.34, 14), bronzeMat);
  stem.position.y = 0.21;
  stem.castShadow = true;
  candelabra.add(stem);

  const crossArm = new Mesh(new CylinderGeometry(0.011, 0.011, 0.28, 10), bronzeMat);
  crossArm.rotation.z = Math.PI / 2;
  crossArm.position.y = 0.34;
  candelabra.add(crossArm);

  const waxMat = new MeshStandardMaterial({
    color: new Color('#efe3c6'),
    roughness: 0.58,
  });

  const flameMat = new MeshStandardMaterial({
    color: new Color('#ffdf9e'),
    emissive: new Color('#ff9c38'),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const flameMeshes = [];
  [-0.13, 0.13].forEach((cx) => {
    const cup = new Mesh(new CylinderGeometry(0.028, 0.022, 0.022, 14), bronzeMat);
    cup.position.set(cx, 0.35, 0);
    candelabra.add(cup);

    const candle = new Mesh(new CylinderGeometry(0.016, 0.018, 0.17, 14), waxMat);
    candle.position.set(cx, 0.44, 0);
    candle.castShadow = true;
    candelabra.add(candle);

    const flame = new Mesh(new SphereGeometry(0.014, 10, 12), flameMat);
    flame.scale.set(0.65, 1.85, 0.65);
    flame.position.set(cx, 0.545, 0);
    candelabra.add(flame);
    flameMeshes.push(flame);
  });

  room.add(candelabra);

  return {
    room,
    flameMeshes,
    flameMat,
    candelabraWorldPos: new Vector3(-1.38, 0.56, -0.46),
  };
}