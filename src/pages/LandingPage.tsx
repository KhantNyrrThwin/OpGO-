import { useEffect, useRef } from "react";
import "./LandingPage.css";

interface LandingPageProps {
  onSelectSoftware: () => void;
}

/* ---- floating particle data ---- */
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const colors = ["cyan", "emerald", "violet"] as const;
  return {
    id: i,
    color: colors[i % 3],
    size: 4 + Math.random() * 10,
    left: Math.random() * 100,
    duration: 12 + Math.random() * 18,
    delay: Math.random() * 15,
  };
});

/* ---------- SVG icons ---------- */
const CpuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </svg>
);

const RaspberryPiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="7.5" cy="12" r="1.25" />
    <circle cx="12" cy="12" r="1.25" />
    <circle cx="16.5" cy="12" r="1.25" />
    <path d="M7 2v3M12 2v3M17 2v3" />
    <path d="M6 19v2M18 19v2" />
    <path d="M10 19v3M14 19v3" />
  </svg>
);

export default function LandingPage({ onSelectSoftware }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  /* Parallax-shift the glow orb on mouse movement */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleMove = (e: MouseEvent) => {
      const glow = root.querySelector<HTMLDivElement>(".landing-glow");
      if (!glow) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      {/* Animated grid background */}
      <div className="landing-grid" />

      {/* Central glow orb */}
      <div className="landing-glow" />

      {/* Floating particles */}
      <div className="landing-particles">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className={`particle particle--${p.color}`}
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="landing-content">
        {/* Brand */}
        <div className="landing-brand">
          <div className="landing-logo">OpGo!!</div>
          <div className="landing-subtitle">Processor Simulator</div>
        </div>

        {/* Question */}
        <p className="landing-question">
          How would you like to experience <span>OpGO-</span> ?
        </p>

        {/* Two selection cards */}
        <div className="landing-cards">
          {/* --- Software Card --- */}
          <div
            className="landing-card landing-card--software"
            onClick={onSelectSoftware}
          >
            <div className="card-icon card-icon--software">
              <CpuIcon />
            </div>
            <div className="card-title">Software Simulation</div>
            <p className="card-desc">
              Run the full OpGO- processor simulator directly in your browser —
              no hardware required.
            </p>
            <div className="card-chips">
              <span className="chip chip--cyan">Browser-based</span>
              <span className="chip chip--cyan">Full ISA</span>
              <span className="chip chip--cyan">Instant</span>
            </div>
            <button className="card-cta card-cta--software">
              Launch Simulator →
            </button>
          </div>

          {/* --- Hardware Card --- */}
          <div className="landing-card landing-card--hardware">
            <div className="coming-soon-badge">Coming Soon</div>
            <div className="card-icon card-icon--hardware">
              <RaspberryPiIcon />
            </div>
            <div className="card-title">Hardware Mode</div>
            <p className="card-desc">
              Connect a Raspberry Pi and interact with a real hardware
              implementation of the OpGO- processor.
            </p>
            <div className="card-chips">
              <span className="chip chip--violet">Raspberry Pi</span>
              <span className="chip chip--violet">GPIO</span>
              <span className="chip chip--violet">Real-time</span>
            </div>
            <button className="card-cta card-cta--hardware">
              Under Development
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="landing-footer">
          Built with ♡ by the OpGO- team
        </p>
      </div>
    </div>
  );
}
