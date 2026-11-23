import { Vector2 } from 'three';

/**
 * Post-processing shader sinematik ruang linear (dijalankan sebelum OutputPass ACESFilmic):
 * - Eksposur teduh & hangat (0.92) agar atmosfer ruang kerja kerajaan lebih intim
 * - Kontras berbasis linear middle-gray (0.18) dengan shadow lift terkendali
 * - Highlight roll-off halus agar 34 kelopak mawar putih tidak silau
 * - Split-toning emas-amber hangat pada midtone, highlight, maupun bayangan malam
 */
export const PainterlyGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new Vector2(1280, 720) },
    uExposure: { value: 0.92 },
    uContrast: { value: 1.12 },
    uWarmth: { value: 0.24 },
    uNightMix: { value: 0.0 },
    uPainterlyStrength: { value: 0.16 },
    uVignetteStrength: { value: 0.30 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uExposure;
    uniform float uContrast;
    uniform float uWarmth;
    uniform float uNightMix;
    uniform float uPainterlyStrength;
    uniform float uVignetteStrength;

    varying vec2 vUv;

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec3 linearFilmicGrade(vec3 x, float contrast) {
      vec3 c = max(x, vec3(0.0));
      // Angkat bayangan terdalam tipis agar serat kayu & lukisan tetap terbaca
      c += vec3(0.008, 0.006, 0.004) * (1.0 - smoothstep(0.0, 0.14, luma(c)));

      // Kontras di sekitar 0.18 linear middle-gray
      float pivot = 0.18;
      c = max(c, vec3(0.0001));
      c = pivot * pow(c / pivot, vec3(contrast));

      // Kompresi sorotan terang (> 0.58 linear) agar lipatan kelopak mawar putih tetap tegas
      vec3 over = max(c - vec3(0.58), vec3(0.0));
      c = min(c, vec3(0.58)) + over / (1.0 + over * 1.55);
      return max(c, vec3(0.0));
    }

    void main() {
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      vec2 centeredUv = vUv - 0.5;
      float radialDist = length(centeredUv);

      float edgeChroma = pow(radialDist, 3.2) * 0.85;
      vec2 chromaShift = centeredUv * texel * edgeChroma;

      vec4 baseSample = texture2D(tDiffuse, vUv);
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + chromaShift).r,
        baseSample.g,
        texture2D(tDiffuse, vUv - chromaShift).b
      );

      float tl = luma(texture2D(tDiffuse, vUv + vec2(-texel.x, texel.y)).rgb);
      float tr = luma(texture2D(tDiffuse, vUv + vec2(texel.x, texel.y)).rgb);
      float bl = luma(texture2D(tDiffuse, vUv + vec2(-texel.x, -texel.y)).rgb);
      float br = luma(texture2D(tDiffuse, vUv + vec2(texel.x, -texel.y)).rgb);
      float edge = clamp((abs(tl - br) + abs(tr - bl)) * 4.0, 0.0, 1.0);

      vec2 brushOffset = vec2(1.2, 0.8) * texel;
      vec3 brushA = texture2D(tDiffuse, vUv + brushOffset).rgb;
      vec3 brushB = texture2D(tDiffuse, vUv - brushOffset).rgb;
      vec3 graded = mix(
        col,
        col * 0.54 + brushA * 0.23 + brushB * 0.23,
        (1.0 - edge) * uPainterlyStrength
      );

      graded *= uExposure;
      graded = linearFilmicGrade(graded, uContrast);

      // Split-toning hangat bergaya cahaya lilin & emas antik (menghindari biru dingin berlebih)
      float lum = luma(graded);
      vec3 dayShadow = vec3(1.04, 0.97, 0.90);
      vec3 nightShadow = vec3(1.02, 0.95, 0.92);
      vec3 shadowTint = mix(dayShadow, nightShadow, uNightMix);

      vec3 warmGoldTint = vec3(
        1.0 + max(uWarmth, 0.0) * 0.32,
        1.0 + max(uWarmth, 0.0) * 0.11,
        1.0 - max(uWarmth, 0.0) * 0.18
      );

      vec3 toneMultiplier = mix(shadowTint, warmGoldTint, smoothstep(0.04, 0.50, lum));
      graded *= toneMultiplier;

      // Halation emas hangat pada kilau kaca kristal & nyala lilin
      vec3 glowSample = (
        texture2D(tDiffuse, vUv + vec2(2.2, 0.0) * texel).rgb +
        texture2D(tDiffuse, vUv + vec2(-2.2, 0.0) * texel).rgb +
        texture2D(tDiffuse, vUv + vec2(0.0, 2.2) * texel).rgb +
        texture2D(tDiffuse, vUv + vec2(0.0, -2.2) * texel).rgb
      ) * 0.25;
      float highlightMask = smoothstep(0.64, 1.12, luma(glowSample));
      vec3 halationTint = vec3(1.0, 0.90, 0.72);
      graded += glowSample * highlightMask * halationTint * 0.055;

      float finalLum = luma(graded);
      graded = mix(vec3(finalLum), graded, 1.12);

      float weave = (hash(floor(vUv * uResolution * 0.5)) - 0.5) * 0.006 * uPainterlyStrength;
      graded = max(graded + weave, vec3(0.0));

      vec2 vigCoord = (vUv - vec2(0.49, 0.48)) * vec2(1.14, 1.06);
      float vigDist = length(vigCoord);
      float edgeVignette = 1.0 - smoothstep(0.48, 1.18, vigDist) * uVignetteStrength;
      graded *= edgeVignette;

      gl_FragColor = vec4(max(graded, vec3(0.0)), baseSample.a);
    }
  `,
};