import { Mesh, Color } from 'three';
import { createSeededRandom, randomRange, randomInt } from '../utils/seededRandom.js';

/**
 * Mengelola klon visual kelopak yang jatuh secara sinematik saat bunga diklik/diketuk.
 * Kelopak asli pada bunga tidak pernah dihapus atau dikurangi; setiap klon dibersihkan
 * setelah selesai mendarat agar bebas kebocoran memori.
 */
export class PetalAnimation {
  constructor(scene, roseEntity) {
    this.scene = scene;
    this.rose = roseEntity;
    this.activePetals = [];
    this.rng = createSeededRandom(2026);
  }

  spawnBurst() {
    // Batasi maksimal 24 klon aktif bersamaan demi performa GPU mobile
    if (this.activePetals.length >= 24) return;

    const count = randomInt(this.rng, 8, 12);
    const origin = this.rose.bloomHead.getWorldPosition(this.rose.bloomHead.position.clone());

    for (let i = 0; i < count; i += 1) {
      const mat = this.rose.detachedMaterial.clone();
      const tint = new Color('#faf6ee').lerp(new Color('#e8dcc6'), randomRange(this.rng, 0, 0.45));
      mat.color.copy(tint);

      const mesh = new Mesh(this.rose.detachedGeometry, mat);
      const scale = randomRange(this.rng, 0.78, 1.15);
      mesh.scale.setScalar(scale);

      // Variasi kedalaman (sebagian lebih dekat kamera, sebagian di sekitar/belakang vas)
      const angle = randomRange(this.rng, 0, Math.PI * 2);
      const radius = randomRange(this.rng, 0.08, 0.34);
      mesh.position.set(
        origin.x + Math.cos(angle) * radius,
        origin.y + randomRange(this.rng, -0.06, 0.12),
        origin.z + Math.sin(angle) * radius
      );

      mesh.rotation.set(
        randomRange(this.rng, 0, Math.PI),
        randomRange(this.rng, 0, Math.PI * 2),
        randomRange(this.rng, -0.6, 0.6)
      );
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.activePetals.push({
        mesh,
        material: mat,
        age: 0,
        duration: randomRange(this.rng, 4.8, 6.8),
        fallSpeed: randomRange(this.rng, 0.18, 0.27),
        driftFreq: randomRange(this.rng, 1.1, 1.9),
        driftAmpX: randomRange(this.rng, 0.08, 0.18),
        driftAmpZ: randomRange(this.rng, 0.06, 0.15),
        phase: randomRange(this.rng, 0, Math.PI * 2),
        rotVelX: randomRange(this.rng, -0.9, 0.9),
        rotVelY: randomRange(this.rng, -1.2, 1.2),
        rotVelZ: randomRange(this.rng, -0.8, 0.8),
        landed: false,
      });
    }
  }

  update(dt) {
    for (let i = this.activePetals.length - 1; i >= 0; i -= 1) {
      const p = this.activePetals[i];
      p.age += dt;
      const lifeT = p.age / p.duration;

      if (!p.landed) {
        p.mesh.position.y -= p.fallSpeed * dt;
        p.mesh.position.x += Math.cos(p.age * p.driftFreq + p.phase) * p.driftAmpX * dt;
        p.mesh.position.z += Math.sin(p.age * p.driftFreq * 0.85 + p.phase) * p.driftAmpZ * dt;

        p.mesh.rotation.x += p.rotVelX * dt;
        p.mesh.rotation.y += p.rotVelY * dt;
        p.mesh.rotation.z += p.rotVelZ * dt;

        // Mendarat di permukaan meja kerajaan (y = 0.012)
        if (p.mesh.position.y <= 0.012) {
          p.mesh.position.y = 0.012;
          p.mesh.rotation.x = Math.PI * 0.52;
          p.mesh.rotation.z = 0.04;
          p.landed = true;
        }
      }

      if (lifeT > 0.72) {
        const fade = 1 - (lifeT - 0.72) / 0.28;
        p.material.opacity = Math.max(0, fade);
      }

      if (lifeT >= 1.0) {
        this.scene.remove(p.mesh);
        p.material.dispose();
        this.activePetals.splice(i, 1);
      }
    }
  }

  dispose() {
    for (let i = this.activePetals.length - 1; i >= 0; i -= 1) {
      const p = this.activePetals[i];
      this.scene.remove(p.mesh);
      p.material.dispose();
    }
    this.activePetals.length = 0;
  }
}