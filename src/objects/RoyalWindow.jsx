import {
  Group,
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  ShaderMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Color,
  DoubleSide,
  AdditiveBlending,
} from 'three';

/**
 * Jendela tinggi abad ke-17 di latar belakang, langkan batu tempat tupai muncul,
 * pemandangan taman kerajaan di kejauhan (tidak menutupi kaca), tirai beludru,
 * dan berkas cahaya volumetrik hangat.
 */
export function createRoyalWindow() {
  const group = new Group();
  group.name = 'RoyalArchedWindow';

  const stoneMat = new MeshStandardMaterial({
    color: new Color('#6e6152'),
    roughness: 0.78,
  });

  const leadFrameMat = new MeshStandardMaterial({
    color: new Color('#211914'),
    roughness: 0.48,
    metalness: 0.55,
  });

  const curtainMat = new MeshStandardMaterial({
    color: new Color('#521620'),
    roughness: 0.85,
  });

  const goldCordMat = new MeshStandardMaterial({
    color: new Color('#cca55e'),
    roughness: 0.34,
    metalness: 0.82,
  });

  // Latar langit luar jendela ditempatkan jauh di belakang (z = -2.35)
  const exteriorSkyMat = new MeshStandardMaterial({
    color: new Color('#d9c39e'),
    emissive: new Color('#7a6242'),
    emissiveIntensity: 0.55,
    roughness: 0.92,
  });
  const exteriorBackdrop = new Mesh(new PlaneGeometry(6.8, 6.4), exteriorSkyMat);
  exteriorBackdrop.position.set(0, 1.45, -2.35);
  group.add(exteriorBackdrop);

  // Siluet pepohonan taman & cemara istana di kejauhan bawah (tidak menghalangi bidang kaca)
  const gardenMat = new MeshStandardMaterial({
    color: new Color('#1f2b1e'),
    roughness: 0.94,
  });

  [-1.45, -0.75, 0.85, 1.55].forEach((tx, i) => {
    const bush = new Mesh(new SphereGeometry(0.46 + (i % 2) * 0.1, 14, 10), gardenMat);
    bush.scale.set(1.25, 0.72, 0.8);
    bush.position.set(tx, -0.42, -1.85);
    group.add(bush);
  });

  [-1.08, 1.12].forEach((cx, idx) => {
    const cypress = new Mesh(new ConeGeometry(0.24, 1.45 + idx * 0.2, 12), gardenMat);
    cypress.position.set(cx, 0.12, -2.05);
    group.add(cypress);
  });

  // Kaca jendela bening tipis
  const windowGlass = new Mesh(
    new PlaneGeometry(2.35, 3.8),
    new MeshPhysicalMaterial({
      color: new Color('#f7efe2'),
      transmission: 0.88,
      roughness: 0.1,
      ior: 1.46,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    })
  );
  windowGlass.position.set(0, 1.45, -0.02);
  group.add(windowGlass);

  // Kusen batu kiri, kanan, atas & langkan luar (jalur tupai)
  const leftJamb = new Mesh(new BoxGeometry(0.26, 4.1, 0.42), stoneMat);
  leftJamb.position.set(-1.26, 1.45, 0.04);
  group.add(leftJamb);

  const rightJamb = new Mesh(new BoxGeometry(0.26, 4.1, 0.42), stoneMat);
  rightJamb.position.set(1.26, 1.45, 0.04);
  group.add(rightJamb);

  const topLintel = new Mesh(new BoxGeometry(2.82, 0.34, 0.46), stoneMat);
  topLintel.position.set(0, 3.55, 0.04);
  group.add(topLintel);

  // Langkan batu tempat tupai berjalan (permukaan atas berada di y = -0.36)
  const stoneSill = new Mesh(new BoxGeometry(2.86, 0.18, 0.68), stoneMat);
  stoneSill.position.set(0, -0.45, -0.08);
  stoneSill.receiveShadow = true;
  group.add(stoneSill);

  // Kisi-kisi timah klasik (mullions & transoms)
  [-0.58, 0, 0.58].forEach((mx) => {
    const mullion = new Mesh(new BoxGeometry(0.035, 3.85, 0.05), leadFrameMat);
    mullion.position.set(mx, 1.45, 0.0);
    mullion.castShadow = true;
    group.add(mullion);
  });

  [0.2, 0.95, 1.7, 2.45, 3.15].forEach((ty) => {
    const transom = new Mesh(new BoxGeometry(2.38, 0.035, 0.05), leadFrameMat);
    transom.position.set(0, ty, 0.0);
    transom.castShadow = true;
    group.add(transom);
  });

  // Tirai beludru berat di sisi kiri dan kanan jendela
  [-1.28, 1.28].forEach((cx, sideIdx) => {
    const dir = sideIdx === 0 ? 1 : -1;
    for (let fold = 0; fold < 4; fold += 1) {
      const drape = new Mesh(new CylinderGeometry(0.11, 0.14, 4.15, 14), curtainMat);
      drape.position.set(cx + dir * fold * 0.11, 1.42, 0.24 + (fold % 2) * 0.04);
      drape.castShadow = true;
      group.add(drape);
    }
    const tieBack = new Mesh(new CylinderGeometry(0.022, 0.022, 0.56, 10), goldCordMat);
    tieBack.rotation.z = Math.PI / 2;
    tieBack.position.set(cx + dir * 0.16, 0.72, 0.34);
    group.add(tieBack);
  });

  // Berkas cahaya volumetrik hangat (Volumetric Light Beams)
  const beamMaterial = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color('#ffdca8') },
      uOpacity: { value: 0.15 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        float edgeFade = pow(abs(dot(normalize(vNormalW), normalize(vViewDir))), 1.65);
        float lengthFade = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
        float sideFade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float alpha = uOpacity * edgeFade * lengthFade * sideFade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });

  const beamsGroup = new Group();
  [-0.45, 0.35].forEach((bx, idx) => {
    const beam = new Mesh(new PlaneGeometry(1.45, 5.6), beamMaterial);
    beam.position.set(bx + 0.55, 0.75, 2.1 + idx * 0.25);
    beam.rotation.set(-0.68, 0.38, -0.26);
    beamsGroup.add(beam);
  });
  group.add(beamsGroup);

  return {
    group,
    exteriorSkyMat,
    beamMaterial,
  };
}