import {
  Group,
  Mesh,
  BufferGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TubeGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Vector3,
  Color,
  DoubleSide,
} from 'three';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';
import { createPetalTextures, createLeafTextures } from '../utils/proceduralTextures.js';

/**
 * Membangun geometri kelopak mawar organik berlapis (cupped spoon + reflexed lip + vertex color gradient)
 */
export function buildOrganicPetalGeometry({
  width = 0.25,
  height = 0.3,
  cupDepth = 0.068,
  curlBack = 0.048,
  asymmetry = 0.02,
} = {}) {
  const uSeg = 16;
  const vSeg = 18;
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  // Gradasi warna pangkal ivory hangat ke ujung putih krem agar lipatan tiap kelopak jelas
  const baseColor = new Color('#cbbba0');
  const midColor = new Color('#f2e9d8');
  const tipColor = new Color('#fdfbf6');
  const tempColor = new Color();

  for (let iv = 0; iv <= vSeg; iv += 1) {
    const v = iv / vSeg;
    const widthEnvelope =
      Math.sin(Math.pow(v, 0.64) * Math.PI) * (0.64 + 0.36 * Math.sin(v * Math.PI * 0.82));

    for (let iu = 0; iu <= uSeg; iu += 1) {
      const uNorm = iu / uSeg;
      const u = uNorm * 2 - 1;

      const x = u * width * 0.5 * widthEnvelope + Math.sin(v * Math.PI) * asymmetry * width;
      const y = v * height;

      const spoon = -cupDepth * Math.sin(v * Math.PI) * (1 - u * u * 0.85);
      const lipFactor = Math.max(0, (v - 0.65) / 0.35);
      const lipCurl = curlBack * lipFactor * lipFactor * (0.4 + 0.6 * u * u);
      const subtleRuffle = Math.sin(u * Math.PI * 2.5) * 0.0055 * v;

      const z = spoon + lipCurl + subtleRuffle;
      const yCurved = y - lipCurl * 0.42;

      positions.push(x, yCurved, z);
      uvs.push(uNorm, v);

      if (v < 0.36) {
        tempColor.lerpColors(baseColor, midColor, v / 0.36);
      } else {
        tempColor.lerpColors(midColor, tipColor, (v - 0.36) / 0.64);
      }
      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }
  }

  const stride = uSeg + 1;
  for (let iv = 0; iv < vSeg; iv += 1) {
    for (let iu = 0; iu < uSeg; iu += 1) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildLeafletGeometry(length = 0.22, width = 0.12) {
  const uSeg = 10;
  const vSeg = 12;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= vSeg; iv += 1) {
    const v = iv / vSeg;
    const serration = 1 + Math.sin(v * Math.PI * 12) * 0.055 * Math.sin(v * Math.PI);
    const w = Math.sin(Math.pow(v, 0.72) * Math.PI) * width * 0.5 * serration;

    for (let iu = 0; iu <= uSeg; iu += 1) {
      const uNorm = iu / uSeg;
      const u = uNorm * 2 - 1;
      const x = u * w;
      const y = v * length;
      const arch = -Math.sin(v * Math.PI) * 0.024 + Math.abs(u) * 0.008;
      positions.push(x, y, arch);
      uvs.push(uNorm, v);
    }
  }

  const stride = uSeg + 1;
  for (let iv = 0; iv < vSeg; iv += 1) {
    for (let iu = 0; iu < uSeg; iu += 1) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Membangun bunga mawar putih lengkap dengan 34 kelopak berlapis (6 lapisan konsentris),
 * sepal, batang alami masuk ke dalam air vas, duri proporsional, dan daun majemuk asimetris.
 */
export function createWhiteRose(seed = 1701) {
  const rng = createSeededRandom(seed);
  const root = new Group();
  root.name = 'RoyalWhiteRose';

  const petalTex = createPetalTextures(seed + 11);
  const leafTex = createLeafTextures(seed + 29);

  const petalMaterial = new MeshPhysicalMaterial({
    map: petalTex.map,
    bumpMap: petalTex.bumpMap,
    bumpScale: 0.005,
    vertexColors: true,
    roughness: 0.58,
    metalness: 0.0,
    sheen: 0.78,
    sheenRoughness: 0.44,
    sheenColor: new Color('#fff6e5'),
    clearcoat: 0.04,
    clearcoatRoughness: 0.65,
    side: DoubleSide,
  });

  const stemMaterial = new MeshStandardMaterial({
    color: new Color('#263f2a'),
    roughness: 0.62,
    metalness: 0.02,
  });

  const thornMaterial = new MeshStandardMaterial({
    color: new Color('#3c2b1e'),
    roughness: 0.55,
  });

  const leafMaterial = new MeshStandardMaterial({
    map: leafTex.map,
    bumpMap: leafTex.bumpMap,
    bumpScale: 0.008,
    roughness: 0.46,
    metalness: 0.02,
    side: DoubleSide,
  });

  // 1. Batang organik dari dasar air vas (y = -0.70) menuju kepala bunga tepat di atas bibir vas (y = 0.34)
  const stemCurve = new CatmullRomCurve3([
    new Vector3(-0.02, -0.70, 0.015),
    new Vector3(0.012, -0.38, -0.01),
    new Vector3(-0.016, -0.08, 0.016),
    new Vector3(0.018, 0.16, 0.024),
    new Vector3(0.005, 0.34, 0.036),
  ]);
  const stemGeometry = new TubeGeometry(stemCurve, 36, 0.017, 12, false);
  const stemMesh = new Mesh(stemGeometry, stemMaterial);
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  stemMesh.renderOrder = 1;
  root.add(stemMesh);

  // 2. Duri-duri kecil proporsional di sepanjang batang
  const thornGeom = new ConeGeometry(0.0085, 0.03, 7);
  thornGeom.translate(0, 0.015, 0);
  const thornTs = [0.22, 0.35, 0.48, 0.61, 0.74, 0.85];
  thornTs.forEach((t, idx) => {
    const pt = stemCurve.getPoint(t);
    const thorn = new Mesh(thornGeom, thornMaterial);
    const angle = idx * 2.15 + randomRange(rng, -0.25, 0.25);
    thorn.position.copy(pt);
    thorn.rotation.set(0.35, angle, -1.18);
    thorn.castShadow = true;
    root.add(thorn);
  });

  // 3. Daun majemuk asimetris di atas bibir vas
  const leafletSmall = buildLeafletGeometry(0.15, 0.085);
  const leafletMain = buildLeafletGeometry(0.21, 0.115);
  const branchConfigs = [
    { t: 0.73, yaw: 0.48, scale: 0.96 },
    { t: 0.79, yaw: -2.35, scale: 0.92 },
    { t: 0.85, yaw: 2.12, scale: 0.84 },
    { t: 0.90, yaw: -0.68, scale: 0.76 },
  ];

  branchConfigs.forEach((cfg) => {
    const origin = stemCurve.getPoint(cfg.t);
    const branchGroup = new Group();
    branchGroup.position.copy(origin);
    branchGroup.rotation.set(0, cfg.yaw, 0);
    branchGroup.scale.setScalar(cfg.scale);

    const petioleCurve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.085, 0.025, 0.01),
      new Vector3(0.19, 0.005, -0.015),
    ]);
    const petiole = new Mesh(new TubeGeometry(petioleCurve, 12, 0.006, 6, false), stemMaterial);
    petiole.castShadow = true;
    branchGroup.add(petiole);

    const tipLeaf = new Mesh(leafletMain, leafMaterial);
    tipLeaf.position.set(0.18, 0.005, -0.015);
    tipLeaf.rotation.set(0.22, 0, -1.45);
    tipLeaf.castShadow = true;
    tipLeaf.receiveShadow = true;
    branchGroup.add(tipLeaf);

    [-1, 1].forEach((side) => {
      const sideLeaf = new Mesh(leafletSmall, leafMaterial);
      sideLeaf.position.set(0.1, 0.02, side * 0.012);
      sideLeaf.rotation.set(side * 1.15, side * 0.25, -1.18);
      sideLeaf.castShadow = true;
      sideLeaf.receiveShadow = true;
      branchGroup.add(sideLeaf);
    });

    root.add(branchGroup);
  });

  // 4. Kepala bunga mawar putih menghadap serong ke depan-atas agar mekar terlihat penuh
  const bloomHead = new Group();
  bloomHead.position.set(0.005, 0.34, 0.036);
  bloomHead.rotation.set(0.36, 0.1, -0.06);
  root.add(bloomHead);

  // Receptacle / dasar kelopak
  const receptacle = new Mesh(new ConeGeometry(0.048, 0.075, 14), stemMaterial);
  receptacle.rotation.x = Math.PI;
  receptacle.position.y = -0.025;
  bloomHead.add(receptacle);

  // 5 Sepal melengkung ke bawah
  const sepalGeom = buildLeafletGeometry(0.15, 0.048);
  for (let s = 0; s < 5; s += 1) {
    const sepal = new Mesh(sepalGeom, stemMaterial);
    const a = (s / 5) * Math.PI * 2 + 0.2;
    sepal.rotation.set(0, a, 0);
    const sepalTilt = new Group();
    sepalTilt.rotation.x = 1.92 + randomRange(rng, -0.1, 0.12);
    sepalTilt.add(sepal);
    bloomHead.add(sepalTilt);
  }

  // Konfigurasi 6 lapisan kelopak konsentris (total 34 kelopak termasuk inti spiral rapat)
  const layers = [
    { count: 6, radius: 0.014, y: 0.032, w: 0.11, h: 0.16, cup: 0.048, curl: 0.006, closedX: 0.05, openX: 0.18, layerIdx: 0 },
    { count: 4, radius: 0.028, y: 0.026, w: 0.15, h: 0.20, cup: 0.058, curl: 0.015, closedX: 0.12, openX: 0.36, layerIdx: 1 },
    { count: 5, radius: 0.046, y: 0.020, w: 0.19, h: 0.24, cup: 0.066, curl: 0.028, closedX: 0.18, openX: 0.56, layerIdx: 2 },
    { count: 6, radius: 0.066, y: 0.012, w: 0.23, h: 0.27, cup: 0.072, curl: 0.042, closedX: 0.26, openX: 0.78, layerIdx: 3 },
    { count: 6, radius: 0.088, y: 0.004, w: 0.27, h: 0.30, cup: 0.074, curl: 0.056, closedX: 0.35, openX: 1.00, layerIdx: 4 },
    { count: 7, radius: 0.108, y: -0.004, w: 0.30, h: 0.32, cup: 0.068, curl: 0.072, closedX: 0.45, openX: 1.24, layerIdx: 5 },
  ];

  const petals = [];
  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      const geom = buildOrganicPetalGeometry({
        width: layer.w * randomRange(rng, 0.94, 1.06),
        height: layer.h * randomRange(rng, 0.95, 1.05),
        cupDepth: layer.cup,
        curlBack: layer.curl,
        asymmetry: randomRange(rng, -0.035, 0.035),
      });

      const azimuth =
        (i / layer.count) * Math.PI * 2 + layer.layerIdx * 0.64 + randomRange(rng, -0.14, 0.14);
      const yawHolder = new Group();
      yawHolder.rotation.y = azimuth;
      yawHolder.position.set(
        Math.sin(azimuth) * layer.radius,
        layer.y + randomRange(rng, -0.003, 0.003),
        Math.cos(azimuth) * layer.radius
      );

      const pitchPivot = new Group();
      pitchPivot.rotation.x = layer.closedX;

      const mesh = new Mesh(geom, petalMaterial);
      mesh.rotation.z = randomRange(rng, -0.08, 0.08);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      pitchPivot.add(mesh);
      yawHolder.add(pitchPivot);
      bloomHead.add(yawHolder);

      petals.push({
        pivot: pitchPivot,
        mesh,
        layerIdx: layer.layerIdx,
        closedX: layer.closedX,
        openX: layer.openX + randomRange(rng, -0.05, 0.06),
        phaseOffset: randomRange(rng, 0, 0.18),
        witherTwist: randomRange(rng, -0.18, 0.18),
      });
    }
  });

  const detachedGeometry = buildOrganicPetalGeometry({
    width: 0.23,
    height: 0.27,
    cupDepth: 0.064,
    curlBack: 0.048,
    asymmetry: 0.02,
  });

  const detachedMaterial = petalMaterial.clone();
  detachedMaterial.transparent = true;
  detachedMaterial.opacity = 1;

  return {
    root,
    bloomHead,
    petals,
    petalMaterial,
    detachedGeometry,
    detachedMaterial,
  };
}