import { useEffect, useState } from 'react';
import { clamp, smoothstep } from '../utils/easing.js';

/**
 * Menghitung profil pencahayaan alami berdasarkan waktu lokal perangkat pengguna
 * melalui JavaScript Date API (tanpa percepatan waktu palsu).
 */
export function computeTimeLightingState(date = new Date()) {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // Bobot Siang (08:00 - 16:30), Sore/Senja (16:00 - 19:30), Malam (19:30 - 06:00)
  const morningRise = smoothstep(5.5, 8.2, hours);
  const eveningFall = 1 - smoothstep(16.2, 19.2, hours);
  const dayWeight = clamp(morningRise * eveningFall, 0, 1);

  const dawnPeak = smoothstep(5.0, 6.6, hours) * (1 - smoothstep(6.6, 8.4, hours));
  const duskPeak = smoothstep(15.8, 17.6, hours) * (1 - smoothstep(17.6, 19.6, hours));
  const sunsetWeight = clamp(Math.max(dawnPeak * 0.7, duskPeak), 0, 1);

  const nightWeight = clamp(1 - dayWeight - sunsetWeight * 0.82, 0, 1);

  let phaseLabel = 'Siang — Cahaya Matahari Atelier';
  if (nightWeight >= 0.55) {
    phaseLabel = 'Malam — Cahaya Bulan & Lilin Kerajaan';
  } else if (sunsetWeight >= 0.36) {
    phaseLabel = 'Sore — Senja Emas & Amber';
  }

  const formattedClock = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return {
    hours,
    dayWeight,
    sunsetWeight,
    nightWeight,
    phaseLabel,
    formattedClock,
  };
}

export function useLocalTime() {
  const [timeState, setTimeState] = useState(() => computeTimeLightingState(new Date()));

  useEffect(() => {
    const syncTime = () => {
      setTimeState(computeTimeLightingState(new Date()));
    };

    const intervalId = window.setInterval(syncTime, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTime();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return timeState;
}