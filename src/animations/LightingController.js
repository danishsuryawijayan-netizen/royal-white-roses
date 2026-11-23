import {
  DirectionalLight,
  PointLight,
  HemisphereLight,
  SpotLight,
  Color,
} from 'three';
import { damp } from '../utils/easing.js';

/**
 * Mengatur pencahayaan real-time berdasarkan waktu lokal perangkat pengguna
 * dengan nuansa hangat sinematik yang teduh dan intim.
 */
export class LightingController {
  constructor(scene, windowEntity, painterlyPass = null) {
    this.scene = scene;
    this.windowEntity = windowEntity;
    this.painterlyPass = painterlyPass;

    // 1. Cahaya utama dari jendela tinggi
    this.keyLight = new DirectionalLight('#ffebd0', 2.45);
    this.keyLight.position.set(-3.2, 4.4, -2.6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 14.0;
    this.keyLight.shadow.camera.left = -3.4;
    this.keyLight.shadow.camera.right = 3.4;
    this.keyLight.shadow.camera.top = 3.4;
    this.keyLight.shadow.camera.bottom = -2.4;
    this.keyLight.shadow.bias = -0.00045;
    this.keyLight.shadow.normalBias = 0.018;
    scene.add(this.keyLight);

    // 2. Rim light hangat untuk memisahkan kontur kelopak mawar & kaca kristal
    this.rimLight = new SpotLight('#ffe2b8', 1.05, 7.5, Math.PI * 0.24, 0.85, 1.4);
    this.rimLight.position.set(-1.85, 2.35, -1.65);
    this.rimLight.target.position.set(-0.04, 0.72, 0.02);
    scene.add(this.rimLight);
    scene.add(this.rimLight.target);

    // 3. Sorotan lembut pada mawar putih & mahkota
    this.heroSpot = new SpotLight('#fff0d9', 0.95, 8.5, Math.PI * 0.25, 0.85, 1.4);
    this.heroSpot.position.set(-1.15, 2.55, 1.55);
    this.heroSpot.target.position.set(0.05, 0.56, 0.0);
    scene.add(this.heroSpot);
    scene.add(this.heroSpot.target);

    // 4. Cahaya lilin beeswax hangat di atas meja
    this.candleLight = new PointLight('#ff9e42', 2.25, 7.2, 1.35);
    this.candleLight.position.set(-1.38, 0.68, -0.46);
    scene.add(this.candleLight);

    // 5. Pantulan hangat chandelier & perapian ruangan (diturunkan agar tidak terlalu terang)
    this.roomBounceLight = new PointLight('#ffbe78', 1.35, 10.5, 1.25);
    this.roomBounceLight.position.set(0.85, 2.45, 1.35);
    scene.add(this.roomBounceLight);

    // 6. Cahaya ambien ruangan klasik hangat
    this.hemiLight = new HemisphereLight('#dec59f', '#2e1c13', 0.52);
    scene.add(this.hemiLight);

    // Palet warna hangat tiap fase waktu
    this.colors = {
      dayKey: new Color('#ffebd0'),
      sunsetKey: new Color('#ffae52'),
      nightKey: new Color('#e8cfa8'),
      daySky: new Color('#decba8'),
      sunsetSky: new Color('#d98245'),
      nightSky: new Color('#2a2636'),
      dayBeam: new Color('#ffe2b5'),
      sunsetBeam: new Color('#ffb866'),
      nightBeam: new Color('#e3c99e'),
      workKey: new Color(),
      workSky: new Color(),
      workBeam: new Color(),
    };

    this.currentDay = 1;
    this.currentSunset = 0;
    this.currentNight = 0;
    this.initialized = false;
  }

  update(dt, timeProfile) {
    const lambda = this.initialized ? 1.8 : 100.0;
    this.initialized = true;

    this.currentDay = damp(this.currentDay, timeProfile.dayWeight, lambda, dt);
    this.currentSunset = damp(this.currentSunset, timeProfile.sunsetWeight, lambda, dt);
    this.currentNight = damp(this.currentNight, timeProfile.nightWeight, lambda, dt);

    const { colors } = this;
    const dW = this.currentDay;
    const sW = this.currentSunset;
    const nW = this.currentNight;

    colors.workKey.setRGB(
      colors.dayKey.r * dW + colors.sunsetKey.r * sW + colors.nightKey.r * nW,
      colors.dayKey.g * dW + colors.sunsetKey.g * sW + colors.nightKey.g * nW,
      colors.dayKey.b * dW + colors.sunsetKey.b * sW + colors.nightKey.b * nW
    );

    colors.workSky.setRGB(
      colors.daySky.r * dW + colors.sunsetSky.r * sW + colors.nightSky.r * nW,
      colors.daySky.g * dW + colors.sunsetSky.g * sW + colors.nightSky.g * nW,
      colors.daySky.b * dW + colors.sunsetSky.b * sW + colors.nightSky.b * nW
    );

    colors.workBeam.setRGB(
      colors.dayBeam.r * dW + colors.sunsetBeam.r * sW + colors.nightBeam.r * nW,
      colors.dayBeam.g * dW + colors.sunsetBeam.g * sW + colors.nightBeam.g * nW,
      colors.dayBeam.b * dW + colors.sunsetBeam.b * sW + colors.nightBeam.b * nW
    );

    this.keyLight.color.copy(colors.workKey);
    this.keyLight.intensity = dW * 2.45 + sW * 2.15 + nW * 1.45;

    this.rimLight.color.copy(colors.workKey);
    this.rimLight.intensity = dW * 1.05 + sW * 1.15 + nW * 0.95;

    this.heroSpot.color.copy(colors.workKey);
    this.heroSpot.intensity = dW * 0.95 + sW * 1.0 + nW * 0.85;

    this.roomBounceLight.intensity = dW * 1.25 + sW * 1.45 + nW * 1.45;
    this.hemiLight.intensity = dW * 0.62 + sW * 0.54 + nW * 0.42;

    this.windowEntity.exteriorSkyMat.color.copy(colors.workSky);
    this.windowEntity.exteriorSkyMat.emissive.copy(colors.workSky);
    this.windowEntity.exteriorSkyMat.emissiveIntensity = dW * 0.58 + sW * 0.52 + nW * 0.36;

    const beamStrength = dW * 0.9 + sW * 1.05 + nW * 0.8;
    this.windowEntity.beamMaterial.uniforms.uColor.value.copy(colors.workBeam);
    this.windowEntity.beamMaterial.uniforms.uOpacity.value = 0.15 * beamStrength;

    if (this.painterlyPass?.uniforms) {
      if (this.painterlyPass.uniforms.uWarmth) {
        this.painterlyPass.uniforms.uWarmth.value = dW * 0.24 + sW * 0.40 + nW * 0.22;
      }
      if (this.painterlyPass.uniforms.uNightMix) {
        this.painterlyPass.uniforms.uNightMix.value = nW;
      }
      if (this.painterlyPass.uniforms.uContrast) {
        this.painterlyPass.uniforms.uContrast.value = 1.11 + sW * 0.03 + nW * 0.03;
      }
    }

    return {
      beamColor: colors.workBeam,
      beamStrength,
      nightWeight: nW,
    };
  }
}