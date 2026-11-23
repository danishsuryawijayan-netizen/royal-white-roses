import {
  Group,
  Mesh,
  SphereGeometry,
  ConeGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  MeshStandardMaterial,
  Vector3,
  Color,
} from 'three';
import { createSeededRandom, randomRange } from '../utils/seededRandom.js';
import { easeInOutCubic, smoothstep } from '../utils/easing.js';

/**
 * Tupai Eropa naturalistik yang muncul di langkan luar jendela,
 * berhenti mengintip ke ruang kerja raja, menoleh, lalu berlari pergi.
 */
export class SquirrelAnimation {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.rng = createSeededRandom(1725);
    this.group = new Group();
    this.group.name = 'WindowLedgeSquirrel';
    this.group.scale.setScalar(1.48);

    const furMat = new MeshStandardMaterial({
      color: new Color('#9e522b'),
      roughness: 0.72,
    });
    const bellyMat = new MeshStandardMaterial({
      color: new Color('#ebd5b3'),
      roughness: 0.78,
    });
    const eyeMat = new MeshStandardMaterial({
      color: new Color('#120e0c'),
      roughness: 0.15,
    });

    // Tubuh proporsional alami
    const torso = new Mesh(new SphereGeometry(0.068, 16, 14), furMat);
    torso.scale.set(1.45, 0.95, 0.88);
    torso.position.set(0, 0.075, 0);
    torso.castShadow = true;
    this.group.add(torso);

    const belly = new Mesh(new SphereGeometry(0.056, 12, 12), bellyMat);
    belly.scale.set(1.3, 0.75, 0.78);
    belly.position.set(0.01, 0.058, 0);
    this.group.add(belly);

    // Kepala & telinga berjumbai halus
    this.headGroup = new Group();
    this.headGroup.position.set(0.095, 0.115, 0);

    const head = new Mesh(new SphereGeometry(0.044, 14, 14), furMat);
    head.scale.set(1.22, 0.96, 0.92);
    this.headGroup.add(head);

    [-0.022, 0.022].forEach((ez) => {
      const ear = new Mesh(new ConeGeometry(0.013, 0.032, 8), furMat);
      ear.position.set(-0.01, 0.042, ez);
      this.headGroup.add(ear);

      const eye = new Mesh(new SphereGeometry(0.0075, 8, 8), eyeMat);
      eye.position.set(0.026, 0.01, ez * 1.45);
      this.headGroup.add(eye);
    });
    this.group.add(this.headGroup);

    // Ekor lebat melengkung S
    this.tailGroup = new Group();
    this.tailGroup.position.set(-0.085, 0.08, 0);
    const tailCurve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(-0.065, 0.06, 0),
      new Vector3(-0.08, 0.16, 0),
      new Vector3(-0.025, 0.21, 0),
    ]);
    const tailMesh = new Mesh(new TubeGeometry(tailCurve, 18, 0.042, 10, false), furMat);
    tailMesh.castShadow = true;
    this.tailGroup.add(tailMesh);
    this.group.add(this.tailGroup);

    // Kaki depan & belakang
    [
      [0.055, 0.025],
      [0.055, -0.025],
      [-0.055, 0.028],
      [-0.055, -0.028],
    ].forEach(([px, pz]) => {
      const paw = new Mesh(new SphereGeometry(0.018, 8, 8), furMat);
      paw.scale.set(1.3, 0.7, 0.8);
      paw.position.set(px, 0.014, pz);
      this.group.add(paw);
    });

    this.group.visible = false;
    this.elapsed = 0;
    this.cycleDuration = 11.2;
    this.waitTimer = 1.2;
    this.active = false;
  }

  setReducedMotion(flag) {
    this.reducedMotion = flag;
    if (flag) {
      this.active = false;
      this.group.visible = false;
    }
  }

  update(dt) {
    if (this.reducedMotion) return;

    if (!this.active) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.active = true;
        this.elapsed = 0;
        this.group.visible = true;
      }
      return;
    }

    this.elapsed += dt;
    const t = this.elapsed;

    // Koordinat lokal pada langkan batu jendela (x dari -1.25 ke +1.28)
    let x = -1.25;
    let hopY = 0;
    let headYaw = 0;
    let headPitch = 0;

    if (t < 2.8) {
      // Berjalan masuk dari kiri langkan menuju area tengah kaca jendela
      const p = easeInOutCubic(t / 2.8);
      x = -1.25 + p * 1.12;
      hopY = Math.abs(Math.sin(t * 11.0)) * 0.015;
    } else if (t < 8.2) {
      // Berhenti di balik kaca, menoleh mengintip ke dalam ruang kerja raja
      x = -0.13;
      const lookT = t - 2.8;
      headYaw = smoothstep(0.0, 0.7, lookT) * 1.2 - smoothstep(4.5, 5.2, lookT) * 1.2;
      headPitch = Math.sin(lookT * 2.0) * 0.15;
    } else if (t <= this.cycleDuration) {
      // Berlari cepat keluar ke kanan langkan
      const p = easeInOutCubic((t - 8.2) / (this.cycleDuration - 8.2));
      x = -0.13 + p * 1.45;
      hopY = Math.abs(Math.sin(t * 13.0)) * 0.018;
    } else {
      this.active = false;
      this.group.visible = false;
      this.waitTimer = randomRange(this.rng, 14.0, 20.0);
      return;
    }

    this.group.position.set(x, -0.36 + hopY, -0.10);
    this.headGroup.rotation.set(0, headYaw, headPitch);
    this.tailGroup.rotation.z = Math.sin(t * 4.5) * 0.14;
  }
}