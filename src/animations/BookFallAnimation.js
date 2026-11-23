import { Vector3 } from 'three';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';
import { easeInCubic, easeOutCubic } from '../utils/easing.js';

/**
 * Koreografi buku jatuh berkala dengan antisipasi, rotasi fisik realistis,
 * dampak pendaratan, dan getaran berbobot pada meja/properti terdekat (tanpa suara).
 */
export class BookFallAnimation {
  constructor(fallingBook, { reducedMotion = false } = {}) {
    this.book = fallingBook;
    this.reducedMotion = reducedMotion;
    this.rng = createSeededRandom(1699);

    // Posisi awal di tepi rak latar-kanan
    this.shelfPos = new Vector3(2.38, 0.52, -3.12);
    // Posisi mendarat di atas bangku/meja samping kanan
    this.floorRestPos = new Vector3(2.26, -0.62, -2.52);

    this.state = 'idle';
    this.timer = 0;
    this.nextTriggerDelay = randomRange(this.rng, 16, 24);
    this.vibrationTimer = 0;
    this.vibrationStrength = 0;
    this.hasImpacted = false;

    this.resetToShelf();
  }

  resetToShelf() {
    this.book.position.copy(this.shelfPos);
    this.book.rotation.set(0, -0.24, 0);
    this.hasImpacted = false;
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
    if (flag) {
      this.state = 'idle';
      this.vibrationStrength = 0;
      this.resetToShelf();
    }
  }

  update(dt) {
    if (this.reducedMotion) {
      return { vibX: 0, vibY: 0 };
    }

    this.timer += dt;

    if (this.state === 'idle') {
      if (this.timer >= this.nextTriggerDelay) {
        this.state = 'slide';
        this.timer = 0;
        this.resetToShelf();
      }
    } else if (this.state === 'slide') {
      // Tahap 1: Pergeseran halus mendekati bibir rak (0.65s)
      const t = easeOutCubic(this.timer / 0.65);
      this.book.position.z = this.shelfPos.z + t * 0.16;
      this.book.position.x = this.shelfPos.x - t * 0.04;
      if (this.timer >= 0.65) {
        this.state = 'teeter';
        this.timer = 0;
      }
    } else if (this.state === 'teeter') {
      // Tahap 2: Gerakan antisipasi kehilangan keseimbangan (0.48s)
      const t = easeInCubic(this.timer / 0.48);
      this.book.position.z = this.shelfPos.z + 0.16 + t * 0.08;
      this.book.rotation.x = t * 0.42;
      if (this.timer >= 0.48) {
        this.state = 'fall';
        this.timer = 0;
      }
    } else if (this.state === 'fall') {
      // Tahap 3: Jatuh dengan percepatan gravitasi dan rotasi alami (0.62s)
      const t = easeInCubic(this.timer / 0.62);
      this.book.position.x = this.shelfPos.x - 0.04 - t * 0.08;
      this.book.position.y = this.shelfPos.y + (this.floorRestPos.y - this.shelfPos.y) * t;
      this.book.position.z = this.shelfPos.z + 0.24 + t * 0.36;
      this.book.rotation.x = 0.42 + t * (Math.PI * 1.58);
      this.book.rotation.z = t * 0.14;

      if (this.timer >= 0.62) {
        this.book.position.copy(this.floorRestPos);
        this.book.rotation.set(Math.PI * 2, -0.12, 0);
        this.state = 'settled';
        this.timer = 0;
        this.vibrationTimer = 0;
        this.vibrationStrength = 1.0;
        this.hasImpacted = true;
      }
    } else if (this.state === 'settled') {
      // Tetap diam konsisten di permukaan bawah selama 18 detik sebelum kembali
      if (this.timer >= 18.0) {
        this.state = 'idle';
        this.timer = 0;
        this.nextTriggerDelay = randomRange(this.rng, 26, 38);
        this.resetToShelf();
      }
    }

    // Getaran dampak fisik singkat yang mereda secara eksponensial (0.85s)
    let vibX = 0;
    let vibY = 0;
    if (this.vibrationStrength > 0.001) {
      this.vibrationTimer += dt;
      const decay = Math.exp(-this.vibrationTimer * 5.8);
      vibY = Math.sin(this.vibrationTimer * 36.0) * 0.0038 * decay;
      vibX = Math.cos(this.vibrationTimer * 28.0) * 0.0016 * decay;
      if (this.vibrationTimer > 0.9) {
        this.vibrationStrength = 0;
      }
    }

    return { vibX, vibY };
  }
}