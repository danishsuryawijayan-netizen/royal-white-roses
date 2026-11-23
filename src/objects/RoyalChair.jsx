import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Color,
} from 'three';
import { createWoodTextures } from '../utils/proceduralTextures.js';

/**
 * Kursi singgasana ruang kerja kerajaan abad ke-17 di midground belakang meja
 */
export function createRoyalChair() {
  const chair = new Group();
  chair.name = 'RoyalThroneChair';

  const wood = createWoodTextures({
    baseRgb: [46, 28, 19],
    grainRgb: [22, 13, 9],
    highlightRgb: [74, 46, 31],
    seed: 1103,
  });

  const frameMat = new MeshStandardMaterial({
    map: wood.map,
    bumpMap: wood.bumpMap,
    bumpScale: 0.01,
    roughness: 0.42,
  });

  const velvetMat = new MeshStandardMaterial({
    color: new Color('#521620'),
    roughness: 0.84,
  });

  const goldMat = new MeshStandardMaterial({
    color: new Color('#c29b57'),
    roughness: 0.36,
    metalness: 0.82,
  });

  // Dudukan berlapis beludru
  const seatFrame = new Mesh(new BoxGeometry(0.76, 0.09, 0.68), frameMat);
  seatFrame.position.y = -0.34;
  seatFrame.castShadow = true;
  chair.add(seatFrame);

  const seatCushion = new Mesh(new BoxGeometry(0.68, 0.07, 0.6), velvetMat);
  seatCushion.position.y = -0.27;
  seatCushion.receiveShadow = true;
  chair.add(seatCushion);

  // Sandaran tinggi berbingkai ukir
  const backFrame = new Mesh(new BoxGeometry(0.72, 1.06, 0.08), frameMat);
  backFrame.position.set(0, 0.24, -0.3);
  backFrame.rotation.x = -0.08;
  backFrame.castShadow = true;
  chair.add(backFrame);

  const backPanel = new Mesh(new BoxGeometry(0.56, 0.88, 0.09), velvetMat);
  backPanel.position.set(0, 0.25, -0.295);
  backPanel.rotation.x = -0.08;
  chair.add(backPanel);

  // Finial mahkota emas di puncak tiang sandaran
  [-0.36, 0.36].forEach((x) => {
    const post = new Mesh(new CylinderGeometry(0.036, 0.042, 1.18, 14), frameMat);
    post.position.set(x, 0.28, -0.3);
    post.rotation.x = -0.08;
    chair.add(post);

    const finial = new Mesh(new SphereGeometry(0.048, 14, 14), goldMat);
    finial.position.set(x, 0.9, -0.35);
    chair.add(finial);
  });

  // Sandaran tangan & kaki kursi
  [-0.35, 0.35].forEach((x) => {
    const arm = new Mesh(new BoxGeometry(0.07, 0.05, 0.58), frameMat);
    arm.position.set(x, -0.04, -0.02);
    chair.add(arm);

    const frontSupport = new Mesh(new CylinderGeometry(0.028, 0.032, 0.3, 12), frameMat);
    frontSupport.position.set(x, -0.19, 0.24);
    chair.add(frontSupport);

    const frontLeg = new Mesh(new CylinderGeometry(0.034, 0.028, 0.72, 12), frameMat);
    frontLeg.position.set(x, -0.74, 0.26);
    chair.add(frontLeg);

    const backLeg = new Mesh(new CylinderGeometry(0.036, 0.028, 0.72, 12), frameMat);
    backLeg.position.set(x, -0.74, -0.28);
    chair.add(backLeg);
  });

  return chair;
}