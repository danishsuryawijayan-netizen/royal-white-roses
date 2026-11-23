import {
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  Color,
  AdditiveBlending,
} from 'three';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';

/**
 * Sistem partikel debu atmosferik semi-transparan dengan distribusi deterministik,
 * variasi kedalaman foreground-background, dan kecerahan yang bereaksi terhadap berkas cahaya.
 */
export class DustParticleSystem {
  constructor({ count = 220, seed = 1740, reducedMotion = false } = {}) {
    this.count = count;
    this.reducedMotion = reducedMotion;
    const rng = createSeededRandom(seed);

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = randomRange(rng, -2.6, 2.4);
      positions[i * 3 + 1] = randomRange(rng, -0.35, 2.45);
      positions[i * 3 + 2] = randomRange(rng, -2.8, 1.85);
      seeds[i] = randomRange(rng, 0, Math.PI * 2);
      sizes[i] = randomRange(rng, 1.4, 3.6);
    }

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
    this.geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));

    this.material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uBeamColor: { value: new Color('#ffe7bd') },
        uBeamStrength: { value: 0.85 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aSize;

        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uBeamStrength;

        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.22 + aSeed) * 0.08;
          pos.y += cos(uTime * 0.18 + aSeed * 1.3) * 0.06;
          pos.z += sin(uTime * 0.16 + aSeed * 0.7) * 0.07;

          // Berkas cahaya jendela masuk dari kiri-belakang menuju meja tengah
          float beamDist = abs((pos.x + 0.55) - (pos.z + 2.2) * 0.28);
          float inBeam = 1.0 - smoothstep(0.15, 1.55, beamDist);
          float twinkle = 0.65 + 0.35 * sin(uTime * 0.9 + aSeed * 2.0);

          vAlpha = (0.06 + inBeam * 0.42 * uBeamStrength) * twinkle;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * (2.6 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uBeamColor;
        varying float vAlpha;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          if (r > 1.0) discard;
          float soft = pow(1.0 - r, 2.2);
          gl_FragColor = vec4(uBeamColor, soft * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.name = 'AtelierDustMotes';
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
  }

  setPixelRatio(dpr) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  update(dt, beamColor, beamStrength) {
    if (!this.reducedMotion) {
      this.material.uniforms.uTime.value += dt;
    }
    this.material.uniforms.uBeamColor.value.copy(beamColor);
    this.material.uniforms.uBeamStrength.value = beamStrength;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}