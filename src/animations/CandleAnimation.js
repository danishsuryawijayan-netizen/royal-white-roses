/**
 * Animasi nyala lilin beeswax yang tenang dan organik (< 2.5 Hz, aman WCAG 2.3.1).
 */
export class CandleAnimation {
  constructor(flameMeshes, flameMat, candlePointLight, { reducedMotion = false } = {}) {
    this.flames = flameMeshes;
    this.flameMat = flameMat;
    this.light = candlePointLight;
    this.reducedMotion = reducedMotion;
    this.time = 0;
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
  }

  update(dt, nightWeight = 0.2) {
    if (!this.reducedMotion) {
      this.time += dt;
    }

    // Frekuensi lambat & lembut agar tidak pernah berkedip cepat/strobo
    const wave =
      Math.sin(this.time * 3.1) * 0.045 +
      Math.cos(this.time * 1.9) * 0.03;

    const baseIntensity = 0.75 + nightWeight * 1.45;
    this.light.intensity = baseIntensity * (1 + wave);
    this.flameMat.emissiveIntensity = (1.8 + nightWeight * 0.9) * (1 + wave * 1.2);

    for (let i = 0; i < this.flames.length; i += 1) {
      const f = this.flames[i];
      const offset = i * 1.4;
      const localWave = Math.sin(this.time * 2.8 + offset) * 0.06;
      f.scale.set(0.65 - localWave * 0.2, 1.85 + localWave, 0.65 - localWave * 0.2);
      f.rotation.z = Math.sin(this.time * 2.1 + offset) * 0.05;
    }
  }
}