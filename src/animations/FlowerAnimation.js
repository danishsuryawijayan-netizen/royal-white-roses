import { Color } from 'three';
import { clamp, damp, easeInOutCubic } from '../utils/easing.js';

/**
 * Mengatur:
 * 1. Koreografi pembukaan (blooming) bertahap saat scene pertama kali dimuat
 *    (kelopak luar -> tengah -> dalam, lalu diam tenang tanpa goyangan angin).
 * 2. Perubahan kondisi bunga (withering) reversibel berbasis progres scroll
 *    tanpa pernah menghapus atau mengurangi kelopak asli.
 */
export class FlowerAnimation {
  constructor(roseEntity, { reducedMotion = false } = {}) {
    this.rose = roseEntity;
    this.reducedMotion = reducedMotion;
    this.elapsed = reducedMotion ? 10.0 : 0.0;
    this.currentWither = 0.0;

    this.freshTint = new Color('#ffffff');
    this.agedTint = new Color('#dfd1b6');
    this.workingTint = new Color('#ffffff');
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
    if (flag) {
      this.elapsed = 10.0;
    }
  }

  update(dt, targetScrollProgress = 0) {
    if (!this.reducedMotion) {
      this.elapsed += dt;
    }

    this.currentWither = this.reducedMotion
      ? targetScrollProgress
      : damp(this.currentWither, targetScrollProgress, 5.5, dt);

    // Perubahan warna sangat halus saat scroll (reversibel penuh)
    this.workingTint.lerpColors(this.freshTint, this.agedTint, this.currentWither * 0.65);
    this.rose.petalMaterial.color.copy(this.workingTint);

    const petals = this.rose.petals;
    for (let i = 0; i < petals.length; i += 1) {
      const p = petals[i];
      // Kelopak luar (layerIdx 5) mekar lebih dulu, diikuti lapisan tengah, lalu inti spiral (layerIdx 0)
      const layerOrder = 5 - p.layerIdx;
      const startDelay = layerOrder * 0.36 + p.phaseOffset;
      const layerSpan = 2.0;
      const rawT = clamp((this.elapsed - startDelay) / layerSpan, 0, 1);
      const bloomT = easeInOutCubic(rawT);

      const baseOpenAngle = p.closedX + (p.openX - p.closedX) * bloomT;

      // Efek withering reversibel: kelopak luar terkulai lembut, kelopak dalam mengatup
      const witherOffset =
        p.layerIdx >= 4
          ? this.currentWither * 0.25
          : -this.currentWither * 0.12;

      p.pivot.rotation.x = baseOpenAngle + witherOffset;
      p.mesh.rotation.y = p.witherTwist * this.currentWither;
    }

    // Sedikit menundukkan kepala bunga saat progres scroll tinggi (reversibel)
    this.rose.bloomHead.rotation.x = 0.36 + this.currentWither * 0.18;
  }
}