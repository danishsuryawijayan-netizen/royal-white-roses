import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Color,
} from 'three';
import { createWoodTextures } from '../utils/proceduralTextures.js';

/**
 * Meja tulis kerajaan abad ke-17 berbahan Dark Walnut & Deep Mahogany
 * dengan tepi berprofil bevel, lis emas antik, dan alas kulit.
 */
export function createRoyalDesk() {
  const group = new Group();
  group.name = 'RoyalDesk';

  const walnut = createWoodTextures({
    baseRgb: [52, 33, 22],
    grainRgb: [25, 15, 10],
    highlightRgb: [84, 55, 36],
    seed: 811,
    repeatX: 2,
    repeatY: 1,
  });

  const mahogany = createWoodTextures({
    baseRgb: [64, 26, 22],
    grainRgb: [32, 12, 11],
    highlightRgb: [96, 42, 34],
    seed: 823,
    repeatX: 2,
    repeatY: 1,
  });

  const walnutMat = new MeshStandardMaterial({
    map: walnut.map,
    bumpMap: walnut.bumpMap,
    bumpScale: 0.012,
    roughness: 0.38,
    metalness: 0.04,
  });

  const mahoganyMat = new MeshStandardMaterial({
    map: mahogany.map,
    bumpMap: mahogany.bumpMap,
    bumpScale: 0.01,
    roughness: 0.42,
    metalness: 0.04,
  });

  const antiqueGoldMat = new MeshStandardMaterial({
    color: new Color('#b9924f'),
    roughness: 0.34,
    metalness: 0.84,
  });

  const leatherPadMat = new MeshStandardMaterial({
    color: new Color('#2b1715'),
    roughness: 0.72,
    metalness: 0.02,
  });

  // Permukaan utama meja (y = 0.0 adalah bidang atas meja tempat objek diletakkan)
  const topSlab = new Mesh(new BoxGeometry(3.8, 0.09, 1.86), walnutMat);
  topSlab.position.y = -0.045;
  topSlab.castShadow = true;
  topSlab.receiveShadow = true;
  group.add(topSlab);

  // Bevel moulding bawah daun meja
  const bevelTrim = new Mesh(new BoxGeometry(3.88, 0.045, 1.94), mahoganyMat);
  bevelTrim.position.y = -0.095;
  bevelTrim.castShadow = true;
  bevelTrim.receiveShadow = true;
  group.add(bevelTrim);

  // Lis ukiran emas tipis di sekeliling tepi meja
  const goldTrim = new Mesh(new BoxGeometry(3.83, 0.014, 1.89), antiqueGoldMat);
  goldTrim.position.y = -0.068;
  group.add(goldTrim);

  // Alas tulis kulit berbingkai emas di tengah-kanan meja
  const padFrame = new Mesh(new BoxGeometry(1.52, 0.008, 0.98), antiqueGoldMat);
  padFrame.position.set(0.28, 0.004, 0.14);
  padFrame.receiveShadow = true;
  group.add(padFrame);

  const leatherPad = new Mesh(new BoxGeometry(1.48, 0.01, 0.94), leatherPadMat);
  leatherPad.position.set(0.28, 0.005, 0.14);
  leatherPad.receiveShadow = true;
  group.add(leatherPad);

  // Apron laci berukir di bawah meja
  const apron = new Mesh(new BoxGeometry(3.46, 0.22, 1.56), mahoganyMat);
  apron.position.y = -0.21;
  apron.castShadow = true;
  apron.receiveShadow = true;
  group.add(apron);

  // Kenop laci kuningan antik
  [-1.05, 0, 1.05].forEach((x) => {
    const knob = new Mesh(new CylinderGeometry(0.024, 0.018, 0.032, 16), antiqueGoldMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, -0.21, 0.79);
    group.add(knob);
  });

  // 4 kaki baluster bubutan klasik abad ke-17
  const legPositions = [
    [-1.62, -0.68],
    [1.62, -0.68],
    [-1.62, 0.68],
    [1.62, 0.68],
  ];

  legPositions.forEach(([lx, lz]) => {
    const legGroup = new Group();
    legGroup.position.set(lx, -0.32, lz);

    const upperBlock = new Mesh(new BoxGeometry(0.16, 0.22, 0.16), walnutMat);
    upperBlock.position.y = -0.11;
    legGroup.add(upperBlock);

    const shaft = new Mesh(new CylinderGeometry(0.068, 0.052, 0.88, 18), walnutMat);
    shaft.position.y = -0.62;
    shaft.castShadow = true;
    legGroup.add(shaft);

    const goldRing = new Mesh(new CylinderGeometry(0.082, 0.082, 0.032, 18), antiqueGoldMat);
    goldRing.position.y = -0.38;
    legGroup.add(goldRing);

    const foot = new Mesh(new CylinderGeometry(0.085, 0.095, 0.14, 18), mahoganyMat);
    foot.position.y = -1.1;
    legGroup.add(foot);

    group.add(legGroup);
  });

  return group;
}