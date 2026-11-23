import { Color } from 'three';

/**
 * Shader Fresnel meniskus & kilau optik air di dalam vas kristal
 */
export const WaterMeniscusShader = {
  uniforms: {
    uTime: { value: 0 },
    uLightColor: { value: new Color('#fff3dc') },
    uWaterColor: { value: new Color('#cfdcd6') },
    uOpacity: { value: 0.68 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uLightColor;
    uniform vec3 uWaterColor;
    uniform float uOpacity;

    varying vec3 vNormalW;
    varying vec3 vViewDir;
    varying vec2 vUv;

    void main() {
      float ndotv = clamp(abs(dot(normalize(vNormalW), normalize(vViewDir))), 0.0, 1.0);
      float fresnel = pow(1.0 - ndotv, 2.4);
      vec2 centered = vUv * 2.0 - 1.0;
      float radial = length(centered);
      float meniscus = smoothstep(0.68, 0.99, radial);
      float microRipple = sin(radial * 24.0 - uTime * 0.9) * 0.03;

      vec3 col = mix(uWaterColor, uLightColor, clamp(fresnel * 0.72 + meniscus * 0.55 + microRipple, 0.0, 1.0));
      float alpha = clamp(uOpacity * (0.38 + fresnel * 0.45 + meniscus * 0.42), 0.12, 0.88);
      gl_FragColor = vec4(col, alpha);
    }
  `,
};