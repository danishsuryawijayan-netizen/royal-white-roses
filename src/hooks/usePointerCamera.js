import { useEffect, useRef } from 'react';
import { clamp } from '../utils/easing.js';

/**
 * Mengelola input pointer desktop & sentuh Android secara halus
 * tanpa memblokir scroll vertikal browser, plus progres gulir untuk transisi bunga.
 */
export function usePointerCamera({ containerRef, reducedMotion }) {
  const stateRef = useRef({
    targetX: 0,
    targetY: 0,
    scrollProgress: 0,
    isPointerDown: false,
    lastTouchX: 0,
    lastTouchY: 0,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    let cachedRect = node.getBoundingClientRect();
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        cachedRect = containerRef.current.getBoundingClientRect();
      }
    });
    resizeObserver.observe(node);

    const updateScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      stateRef.current.scrollProgress = clamp(window.scrollY / maxScroll, 0, 1);
    };
    updateScroll();

    const onPointerMove = (event) => {
      if (reducedMotion) return;
      if (event.pointerType === 'mouse') {
        const w = Math.max(1, cachedRect.width);
        const h = Math.max(1, cachedRect.height);
        const nx = ((event.clientX - cachedRect.left) / w) * 2 - 1;
        const ny = ((event.clientY - cachedRect.top) / h) * 2 - 1;
        stateRef.current.targetX = clamp(nx, -1, 1);
        stateRef.current.targetY = clamp(ny, -1, 1);
      } else if (stateRef.current.isPointerDown) {
        const dx = (event.clientX - stateRef.current.lastTouchX) / Math.max(180, cachedRect.width * 0.45);
        const dy = (event.clientY - stateRef.current.lastTouchY) / Math.max(180, cachedRect.height * 0.45);
        stateRef.current.lastTouchX = event.clientX;
        stateRef.current.lastTouchY = event.clientY;
        stateRef.current.targetX = clamp(stateRef.current.targetX + dx, -1, 1);
        stateRef.current.targetY = clamp(stateRef.current.targetY + dy, -1, 1);
      }
    };

    const onPointerDown = (event) => {
      if (event.pointerType !== 'mouse') {
        stateRef.current.isPointerDown = true;
        stateRef.current.lastTouchX = event.clientX;
        stateRef.current.lastTouchY = event.clientY;
      }
    };

    const onPointerUp = () => {
      stateRef.current.isPointerDown = false;
    };

    const onPointerLeave = (event) => {
      stateRef.current.isPointerDown = false;
      if (event.pointerType === 'mouse') {
        stateRef.current.targetX = 0;
        stateRef.current.targetY = 0;
      }
    };

    node.addEventListener('pointermove', onPointerMove, { signal, passive: true });
    node.addEventListener('pointerdown', onPointerDown, { signal, passive: true });
    window.addEventListener('pointerup', onPointerUp, { signal, passive: true });
    window.addEventListener('pointercancel', onPointerUp, { signal, passive: true });
    node.addEventListener('pointerleave', onPointerLeave, { signal, passive: true });
    window.addEventListener('scroll', updateScroll, { signal, passive: true });

    return () => {
      controller.abort();
      resizeObserver.disconnect();
    };
  }, [containerRef, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      stateRef.current.targetX = 0;
      stateRef.current.targetY = 0;
    }
  }, [reducedMotion]);

  return stateRef;
}