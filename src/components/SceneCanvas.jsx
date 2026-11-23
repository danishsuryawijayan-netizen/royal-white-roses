import { useEffect, useRef } from 'react';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Vector2,
  Raycaster,
  FogExp2,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PMREMGenerator,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { createWhiteRose } from '../objects/WhiteRose.jsx';
import { createGlassVase } from '../objects/GlassVase.jsx';
import { createRoyalDesk } from '../objects/RoyalDesk.jsx';
import { createAntiqueBooks } from '../objects/AntiqueBooks.jsx';
import { createFeatherQuillAndInkPot } from '../objects/FeatherQuill.jsx';
import { createParchments } from '../objects/Parchment.jsx';
import { createRoyalCrown } from '../objects/RoyalCrown.jsx';
import { createRoyalChair } from '../objects/RoyalChair.jsx';
import { createRoyalWindow } from '../objects/RoyalWindow.jsx';
import { createRoyalAtelierRoom } from '../objects/RoyalFurniture.jsx';

import { FlowerAnimation } from '../animations/FlowerAnimation.js';
import { PetalAnimation } from '../animations/PetalAnimation.js';
import { BookFallAnimation } from '../animations/BookFallAnimation.js';
import { SquirrelAnimation } from '../animations/SquirrelAnimation.js';
import { CandleAnimation } from '../animations/CandleAnimation.js';
import { DustParticleSystem } from '../animations/DustParticleSystem.js';
import { LightingController } from '../animations/LightingController.js';
import { EnvironmentTimeline } from '../animations/EnvironmentTimeline.js';

import { PainterlyGradeShader } from '../shaders/painterly.glsl.js';
import { disposeObject3D } from '../utils/cleanup.js';
import { usePointerCamera } from '../hooks/usePointerCamera.js';

export default function SceneCanvas({
  timeProfile,
  reducedMotion,
  releaseTriggerCount,
  onPetalReleased,
}) {
  const containerRef = useRef(null);
  const pointerStateRef = usePointerCamera({ containerRef, reducedMotion });

  const latestTimeRef = useRef(timeProfile);
  latestTimeRef.current = timeProfile;

  const latestReducedRef = useRef(reducedMotion);
  latestReducedRef.current = reducedMotion;

  const timelineRef = useRef(null);
  const petalAnimRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.setReducedMotion(reducedMotion);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (releaseTriggerCount > 0 && petalAnimRef.current) {
      petalAnimRef.current.spawnBurst();
    }
  }, [releaseTriggerCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.fog = new FogExp2('#120b08', 0.048);

    const pmremGenerator = new PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.30;

    const camera = new PerspectiveCamera(38, width / height, 0.1, 35);

    const sceneRoot = new Group();
    scene.add(sceneRoot);

    const atelier = createRoyalAtelierRoom(1680);
    sceneRoot.add(atelier.room);

    const royalWindow = createRoyalWindow();
    royalWindow.group.position.set(-2.35, 1.35, -4.22);
    royalWindow.group.rotation.y = 0.28;
    sceneRoot.add(royalWindow.group);

    const chair = createRoyalChair();
    chair.position.set(0.32, -0.36, -1.12);
    chair.rotation.y = -0.32;
    sceneRoot.add(chair);

    const deskPropGroup = new Group();
    sceneRoot.add(deskPropGroup);

    const desk = createRoyalDesk();
    deskPropGroup.add(desk);

    // Objek Utama (Hero): Vas Kaca Transparan & Mawar Putih di pusat komposisi
    const vaseEntity = createGlassVase(1712);
    vaseEntity.group.position.set(-0.08, 0.0, 0.02);
    deskPropGroup.add(vaseEntity.group);

    const roseEntity = createWhiteRose(1701);
    roseEntity.root.position.set(-0.08, 0.84, 0.02);
    deskPropGroup.add(roseEntity.root);

    // Properti meja kerajaan: Mahkota, Buku Abad ke-17, Pena Bulu, Wadah Tinta, Perkamen
    const crown = createRoyalCrown();
    crown.position.set(0.56, 0.0, -0.32);
    crown.rotation.y = -0.38;
    deskPropGroup.add(crown);

    const books = createAntiqueBooks();
    deskPropGroup.add(books.deskBooksGroup);
    sceneRoot.add(books.fallingBook);

    const quillAndInk = createFeatherQuillAndInkPot();
    deskPropGroup.add(quillAndInk);

    const parchments = createParchments();
    deskPropGroup.add(parchments);

    const squirrelAnim = new SquirrelAnimation({ reducedMotion: latestReducedRef.current });
    royalWindow.group.add(squirrelAnim.group);

    let composer = null;
    let painterlyPass = null;
    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(new Vector2(width, height), 0.14, 0.58, 0.90);
      composer.addPass(bloomPass);

      painterlyPass = new ShaderPass(PainterlyGradeShader);
      painterlyPass.uniforms.uResolution.value.set(width * dpr, height * dpr);
      composer.addPass(painterlyPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    } catch {
      composer = null;
      painterlyPass = null;
    }

    const lightingCtrl = new LightingController(scene, royalWindow, painterlyPass);
    const flowerAnim = new FlowerAnimation(roseEntity, { reducedMotion: latestReducedRef.current });
    const petalAnim = new PetalAnimation(scene, roseEntity);
    petalAnimRef.current = petalAnim;

    const bookFallAnim = new BookFallAnimation(books.fallingBook, {
      reducedMotion: latestReducedRef.current,
    });
    const candleAnim = new CandleAnimation(
      atelier.flameMeshes,
      atelier.flameMat,
      lightingCtrl.candleLight,
      { reducedMotion: latestReducedRef.current }
    );

    const isMobileViewport = width < 768;
    const dustSystem = new DustParticleSystem({
      count: isMobileViewport ? 140 : 240,
      seed: 1740,
      reducedMotion: latestReducedRef.current,
    });
    dustSystem.setPixelRatio(dpr);
    scene.add(dustSystem.points);

    const timeline = new EnvironmentTimeline({
      camera,
      sceneRoot,
      deskGroup: deskPropGroup,
      flowerAnim,
      petalAnim,
      bookFallAnim,
      squirrelAnim,
      candleAnim,
      dustSystem,
      lightingCtrl,
      vaseEntity,
      reducedMotion: latestReducedRef.current,
    });
    timeline.setBaseFraming(width / height < 0.92);
    timelineRef.current = timeline;

    const raycaster = new Raycaster();
    const pointerNdc = new Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e) => {
      const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moveDist > 12) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(roseEntity.root, true);
      if (hits.length > 0) {
        petalAnim.spawnBurst();
        if (onPetalReleased) onPetalReleased();
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
    renderer.domElement.addEventListener('pointerup', onPointerUp, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextW = Math.max(1, entry.contentRect.width);
      const nextH = Math.max(1, entry.contentRect.height);
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      timeline.setBaseFraming(nextW / nextH < 0.92);

      renderer.setPixelRatio(nextDpr);
      renderer.setSize(nextW, nextH);
      dustSystem.setPixelRatio(nextDpr);

      if (composer) {
        composer.setPixelRatio(nextDpr);
        composer.setSize(nextW, nextH);
      }
      if (painterlyPass?.uniforms?.uResolution) {
        painterlyPass.uniforms.uResolution.value.set(nextW * nextDpr, nextH * nextDpr);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const renderLoop = (now) => {
      rafId = window.requestAnimationFrame(renderLoop);
      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;

      timeline.update(rawDt, {
        pointerState: pointerStateRef.current,
        timeProfile: latestTimeRef.current,
      });

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    rafId = window.requestAnimationFrame(renderLoop);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);

      petalAnim.dispose();
      dustSystem.dispose();
      roseEntity.detachedGeometry.dispose();
      roseEntity.detachedMaterial.dispose();
      disposeObject3D(scene);

      envRT.dispose();
      pmremGenerator.dispose();
      if (composer) {
        composer.dispose();
      }
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      timelineRef.current = null;
      petalAnimRef.current = null;
    };
  }, [pointerStateRef, onPetalReleased]);

  return <div ref={containerRef} className="rwr-canvas-layer" aria-hidden="true" />;
}