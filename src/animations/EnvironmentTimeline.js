import { DampedSpring } from '../utils/easing.js';

/**
 * Koordinator utama seluruh subsistem animasi, kontrol kamera teredam,
 * pengaman lonjakan delta-time saat perpindahan tab, dan adaptasi kualitas.
 */
export class EnvironmentTimeline {
  constructor({
    camera,
    sceneRoot,
    deskGroup,
    flowerAnim,
    petalAnim,
    bookFallAnim,
    squirrelAnim,
    candleAnim,
    dustSystem,
    lightingCtrl,
    vaseEntity,
    reducedMotion = false,
  }) {
    this.camera = camera;
    this.sceneRoot = sceneRoot;
    this.deskGroup = deskGroup;
    this.flowerAnim = flowerAnim;
    this.petalAnim = petalAnim;
    this.bookFallAnim = bookFallAnim;
    this.squirrelAnim = squirrelAnim;
    this.candleAnim = candleAnim;
    this.dustSystem = dustSystem;
    this.lightingCtrl = lightingCtrl;
    this.vaseEntity = vaseEntity;
    this.reducedMotion = reducedMotion;

    this.camSpringX = new DampedSpring({ value: 0, stiffness: 120, damping: 22, mass: 1.2 });
    this.camSpringY = new DampedSpring({ value: 0, stiffness: 120, damping: 22, mass: 1.2 });

    this.baseCameraPos = { x: 0.04, y: 1.06, z: 2.76 };
    this.baseLookAt = { x: 0.0, y: 0.66, z: -0.04 };
    this.clockTime = 0;
  }

  setBaseFraming(isPortraitMobile) {
    if (isPortraitMobile) {
      this.baseCameraPos = { x: 0.02, y: 1.08, z: 3.35 };
      this.baseLookAt = { x: 0.0, y: 0.66, z: 0.0 };
    } else {
      this.baseCameraPos = { x: 0.04, y: 1.06, z: 2.76 };
      this.baseLookAt = { x: 0.0, y: 0.66, z: -0.04 };
    }
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
    this.flowerAnim.setReducedMotion(flag);
    this.bookFallAnim.setReducedMotion(flag);
    this.squirrelAnim.setReducedMotion(flag);
    this.candleAnim.setReducedMotion(flag);
    this.dustSystem.setReducedMotion(flag);
    if (flag) {
      this.camSpringX.snap(0);
      this.camSpringY.snap(0);
    }
  }

  update(rawDt, { pointerState, timeProfile }) {
    // Klamp dt maksimal 50ms agar perpindahan tab tidak menyebabkan lompatan animasi
    const dt = Math.min(Math.max(rawDt, 0.0001), 0.05);
    this.clockTime += dt;

    // 1. Kamera mengikuti pointer/sentuhan secara lembut dengan batas rotasi ketat
    this.camSpringX.setTarget(this.reducedMotion ? 0 : pointerState.targetX);
    this.camSpringY.setTarget(this.reducedMotion ? 0 : pointerState.targetY);

    const px = this.camSpringX.step(dt);
    const py = this.camSpringY.step(dt);

    this.camera.position.set(
      this.baseCameraPos.x + px * 0.24,
      this.baseCameraPos.y - py * 0.14,
      this.baseCameraPos.z - Math.abs(px) * 0.05
    );
    this.camera.lookAt(
      this.baseLookAt.x + px * 0.06,
      this.baseLookAt.y - py * 0.04,
      this.baseLookAt.z
    );

    // 2. Pencahayaan berbasis waktu lokal perangkat
    const lightState = this.lightingCtrl.update(dt, timeProfile);

    // 3. Animasi bunga mawar putih (blooming awal + withering scroll reversibel, nol angin)
    this.flowerAnim.update(dt, pointerState.scrollProgress);

    // 4. Klon kelopak jatuh interaktif
    this.petalAnim.update(dt);

    // 5. Kejadian buku jatuh & getaran dampak fisik pada meja
    const { vibX, vibY } = this.bookFallAnim.update(dt);
    if (this.deskGroup) {
      this.deskGroup.position.set(vibX, vibY, 0);
    }

    // 6. Tupai di langkan luar jendela
    this.squirrelAnim.update(dt);

    // 7. Lilin & partikel debu atmosferik
    this.candleAnim.update(dt, lightState.nightWeight);
    this.dustSystem.update(dt, lightState.beamColor, lightState.beamStrength);

    if (this.vaseEntity?.meniscusMaterial?.uniforms?.uTime) {
      this.vaseEntity.meniscusMaterial.uniforms.uTime.value = this.clockTime;
    }
  }
}