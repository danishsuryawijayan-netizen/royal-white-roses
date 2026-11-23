import {
  Group,
  Mesh,
  PlaneGeometry,
  TubeGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  CatmullRomCurve3,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Vector3,
  Color,
  DoubleSide,
} from 'three';
import { createFeatherTexture } from '../utils/proceduralTextures.js';

/**
 * Pena bulu angsa klasik dengan helai bulu alami, batang melengkung,
 * ujung nib logam antik, dan wadah tinta kristal-perunggu.
 */
export function createFeatherQuillAndInkPot() {
  const group = new Group();
  group.name = 'QuillAndInkSet';

  // 1. Wadah Tinta Kerajaan (InkPot)
  const inkPotGroup = new Group();
  inkPotGroup.position.set(0.68, 0, -0.16);

  const bronzeMat = new MeshStandardMaterial({
    color: new Color('#7a5b32'),
    roughness: 0.36,
    metalness: 0.84,
  });

  const glassInkMat = new MeshPhysicalMaterial({
    color: new Color('#e8eee9'),
    transmission: 0.85,
    ior: 1.5,
    thickness: 0.25,
    roughness: 0.08,
    transparent: true,
    depthWrite: false,
  });

  const darkInkMat = new MeshStandardMaterial({
    color: new Color('#130d0b'),
    roughness: 0.12,
    metalness: 0.1,
  });

  const baseTray = new Mesh(new CylinderGeometry(0.115, 0.13, 0.022, 24), bronzeMat);
  baseTray.position.y = 0.011;
  baseTray.castShadow = true;
  baseTray.receiveShadow = true;
  inkPotGroup.add(baseTray);

  const glassWell = new Mesh(new CylinderGeometry(0.068, 0.078, 0.095, 24), glassInkMat);
  glassWell.position.y = 0.068;
  glassWell.castShadow = true;
  inkPotGroup.add(glassWell);

  const inkCore = new Mesh(new CylinderGeometry(0.056, 0.064, 0.052, 20), darkInkMat);
  inkCore.position.y = 0.048;
  inkPotGroup.add(inkCore);

  const collar = new Mesh(new CylinderGeometry(0.074, 0.072, 0.02, 24), bronzeMat);
  collar.position.y = 0.116;
  inkPotGroup.add(collar);

  // Tutup berengsel terbuka ke belakang
  const lid = new Mesh(new SphereGeometry(0.066, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), bronzeMat);
  lid.position.set(0, 0.155, -0.072);
  lid.rotation.x = -1.15;
  inkPotGroup.add(lid);

  group.add(inkPotGroup);

  // 2. Pena Bulu (Feather Quill) berbaring alami di atas perkamen
  const quillGroup = new Group();
  quillGroup.position.set(0.42, 0.028, 0.24);
  quillGroup.rotation.set(0.06, -0.62, 0.14);

  const rachisCurve = new CatmullRomCurve3([
    new Vector3(-0.24, -0.012, 0.0),
    new Vector3(-0.08, 0.012, 0.008),
    new Vector3(0.12, 0.048, 0.018),
    new Vector3(0.32, 0.095, 0.024),
  ]);
  const rachisMat = new MeshStandardMaterial({
    color: new Color('#efe4ce'),
    roughness: 0.45,
  });
  const rachis = new Mesh(new TubeGeometry(rachisCurve, 24, 0.0055, 8, false), rachisMat);
  rachis.castShadow = true;
  quillGroup.add(rachis);

  // Ujung nib logam antik
  const nib = new Mesh(
    new ConeGeometry(0.008, 0.042, 10),
    new MeshStandardMaterial({ color: new Color('#c9a66b'), roughness: 0.28, metalness: 0.88 })
  );
  nib.position.set(-0.258, -0.016, -0.002);
  nib.rotation.z = Math.PI * 0.54;
  quillGroup.add(nib);

  // Helai bulu bertekstur organik melengkung lembut
  const featherTex = createFeatherTexture();
  const vaneGeom = new PlaneGeometry(0.16, 0.44, 8, 16);
  const posAttr = vaneGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i += 1) {
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    const normY = (py + 0.22) / 0.44;
    const archZ = -Math.abs(px) * 0.18 + Math.sin(normY * Math.PI) * 0.022;
    posAttr.setZ(i, archZ);
  }
  vaneGeom.computeVertexNormals();

  const vaneMat = new MeshStandardMaterial({
    map: featherTex,
    transparent: true,
    alphaTest: 0.12,
    roughness: 0.68,
    side: DoubleSide,
  });

  const vaneMesh = new Mesh(vaneGeom, vaneMat);
  vaneMesh.position.set(0.11, 0.052, 0.015);
  vaneMesh.rotation.set(Math.PI * 0.44, 0.18, -Math.PI * 0.42);
  vaneMesh.castShadow = true;
  quillGroup.add(vaneMesh);

  group.add(quillGroup);

  return group;
}