import {
  Group,
  Mesh,
  InstancedMesh,
  LatheGeometry,
  CircleGeometry,
  SphereGeometry,
  MeshPhysicalMaterial,
  ShaderMaterial,
  Vector2,
  Color,
  DoubleSide,
  Matrix4,
} from 'three';
import { WaterMeniscusShader } from '../shaders/glass.glsl.js';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';

/**
 * Vas kaca kristal abad ke-17 dengan ketebalan dinding nyata,
 * air jernih di dalamnya, garis meniskus, dan gelembung mikro halus.
 */
export function createGlassVase(seed = 1712) {
  const rng = createSeededRandom(seed);
  const group = new Group();
  group.name = 'RoyalGlassVase';

  // Profil luar & dalam vas (LatheGeometry) agar refraksi memiliki ketebalan kaca autentik
  const outerProfile = [
    new Vector2(0.0, 0.0),
    new Vector2(0.24, 0.0),
    new Vector2(0.25, 0.03),
    new Vector2(0.18, 0.07),
    new Vector2(0.12, 0.13),
    new Vector2(0.19, 0.24),
    new Vector2(0.27, 0.44),
    new Vector2(0.26, 0.66),
    new Vector2(0.20, 0.84),
    new Vector2(0.23, 0.96),
    new Vector2(0.27, 1.03),
    // Bibir atas dengan ketebalan dinding ~0.022m
    new Vector2(0.248, 1.03),
    new Vector2(0.208, 0.95),
    new Vector2(0.18, 0.83),
    new Vector2(0.236, 0.65),
    new Vector2(0.245, 0.44),
    new Vector2(0.168, 0.24),
    new Vector2(0.095, 0.14),
    new Vector2(0.0, 0.14),
  ];

  const vaseGeometry = new LatheGeometry(outerProfile, 64);
  vaseGeometry.computeVertexNormals();

  const glassMaterial = new MeshPhysicalMaterial({
    color: new Color('#f8fbf8'),
    transmission: 0.93,
    ior: 1.52,
    thickness: 0.92,
    roughness: 0.045,
    metalness: 0.0,
    reflectivity: 0.96,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    envMapIntensity: 1.4,
    attenuationColor: new Color('#e6efe9'),
    attenuationDistance: 2.3,
    transparent: true,
    depthWrite: false,
  });

  const vaseMesh = new Mesh(vaseGeometry, glassMaterial);
  vaseMesh.castShadow = true;
  vaseMesh.receiveShadow = true;
  vaseMesh.renderOrder = 3;
  group.add(vaseMesh);

  // Volume air di dalam vas (tinggi y = 0.145 hingga y = 0.64)
  const waterProfile = [
    new Vector2(0.0, 0.145),
    new Vector2(0.092, 0.145),
    new Vector2(0.164, 0.24),
    new Vector2(0.24, 0.44),
    new Vector2(0.233, 0.64),
    new Vector2(0.0, 0.64),
  ];
  const waterGeometry = new LatheGeometry(waterProfile, 48);
  const waterMaterial = new MeshPhysicalMaterial({
    color: new Color('#dce8e2'),
    transmission: 0.86,
    ior: 1.333,
    thickness: 0.55,
    roughness: 0.06,
    attenuationColor: new Color('#cfe0d8'),
    attenuationDistance: 1.8,
    transparent: true,
    depthWrite: false,
  });

  const waterMesh = new Mesh(waterGeometry, waterMaterial);
  waterMesh.renderOrder = 2;
  group.add(waterMesh);

  // Permukaan batas air (meniscus highlight)
  const meniscusMaterial = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightColor: { value: WaterMeniscusShader.uniforms.uLightColor.value.clone() },
      uWaterColor: { value: WaterMeniscusShader.uniforms.uWaterColor.value.clone() },
      uOpacity: { value: 0.72 },
    },
    vertexShader: WaterMeniscusShader.vertexShader,
    fragmentShader: WaterMeniscusShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });

  const meniscusDisc = new Mesh(new CircleGeometry(0.233, 48), meniscusMaterial);
  meniscusDisc.rotation.x = -Math.PI / 2;
  meniscusDisc.position.y = 0.641;
  meniscusDisc.renderOrder = 2;
  group.add(meniscusDisc);

  // 18 gelembung mikro halus menempel di dinding kaca dalam
  const bubbleGeom = new SphereGeometry(0.0042, 8, 8);
  const bubbleMat = new MeshPhysicalMaterial({
    color: new Color('#ffffff'),
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.62,
  });
  const bubbleCount = 18;
  const bubbles = new InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
  const dummyMat = new Matrix4();

  for (let i = 0; i < bubbleCount; i += 1) {
    const angle = randomRange(rng, 0, Math.PI * 2);
    const y = randomRange(rng, 0.22, 0.59);
    const r = y < 0.35 ? 0.175 : 0.224;
    const scale = randomRange(rng, 0.55, 1.25);
    dummyMat.makeScale(scale, scale, scale);
    dummyMat.setPosition(Math.cos(angle) * r, y, Math.sin(angle) * r);
    bubbles.setMatrixAt(i, dummyMat);
  }
  bubbles.instanceMatrix.needsUpdate = true;
  bubbles.renderOrder = 2;
  group.add(bubbles);

  return {
    group,
    meniscusMaterial,
    glassMaterial,
  };
}