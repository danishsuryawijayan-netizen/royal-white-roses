import { useCallback, useState } from 'react';
import SceneCanvas from '../components/SceneCanvas.jsx';
import { useLocalTime } from '../hooks/useLocalTime.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

export default function App() {
  const timeProfile = useLocalTime();
  const reducedMotion = useReducedMotion();
  const [announcement, setAnnouncement] = useState('');

  const handleCanvasPetalRelease = useCallback(() => {
    setAnnouncement('Kelopak mawar putih dilepaskan.');
  }, []);

  return (
    <main className="rwr-scroll-stage">
      <section className="rwr-viewport" aria-label="© Dennis 26">
        <SceneCanvas
          timeProfile={timeProfile}
          reducedMotion={reducedMotion}
          releaseTriggerCount={0}
          onPetalReleased={handleCanvasPetalRelease}
        />

        <div className="rwr-hud">
          <header className="rwr-header">
            <h1 className="rwr-title">© Dennis 26</h1>
          </header>
        </div>

        <p className="rwr-sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </section>
    </main>
  );
}