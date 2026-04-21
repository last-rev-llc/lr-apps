"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button, Card, CardContent } from "@repo/ui";
import content from "./data/content.json";
import "./brommie-quake.css";

// --- Content (text from data/content.json; animation config stays inline) ---

const STATS = content.stats;
const QUOTES = content.quotes;

// Pre-compute wave people with deterministic colors
const WAVE_PEOPLE = Array.from({ length: 50 }, (_, i) => ({
  delay: `${i * 0.08}s`,
  color:
    i % 7 === 0
      ? "var(--quake-red)"
      : i % 5 === 0
        ? "var(--quake-gold)"
        : "var(--quake-blue)",
}));

// Pre-compute particles with seeded values (avoids hydration mismatch since "use client")
const PARTICLES = Array.from({ length: 30 }, (_, i) => {
  // Deterministic pseudo-random based on index
  const seed = (i * 2654435761) >>> 0;
  const r1 = ((seed ^ (seed >> 16)) * 0x45d9f3b) >>> 0;
  const r2 = ((r1 ^ (r1 >> 16)) * 0x45d9f3b) >>> 0;
  const r3 = ((r2 ^ (r2 >> 16)) * 0x45d9f3b) >>> 0;
  const r4 = ((r3 ^ (r3 >> 16)) * 0x45d9f3b) >>> 0;
  const r5 = ((r4 ^ (r4 >> 16)) * 0x45d9f3b) >>> 0;
  const frac = (n: number) => (n >>> 0) / 0xffffffff;

  const bg =
    frac(r5) > 0.9
      ? "var(--quake-red)"
      : frac(r4) > 0.7
        ? "var(--quake-gold)"
        : "var(--quake-blue)";

  return {
    left: `${frac(r1) * 100}%`,
    top: `${frac(r2) * 100}%`,
    delay: `${frac(r3) * 3}s`,
    duration: `${2 + frac(r4) * 3}s`,
    bg,
  };
});

const QUAKE_LETTERS = ["Q", "U", "A", "K", "E", "!", "!"];
const FALL_ROTATIONS = [15, -20, 25, -12, 18, -30, 22];
const FALL_X = [-30, 10, -15, 25, -20, 15, -10];

// Confetti colors — use CSS custom properties so tokens control brand colors
const CONFETTI_COLORS = [
  "var(--quake-blue)",
  "var(--quake-red)",
  "var(--quake-gold)",
  "var(--quake-blue)",
  "white",
];

export default function BrommieQuakePage() {
  const bodyShakeRef = useRef(false);
  const confettiContainerRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".bq-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("bq-visible");
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const triggerQuake = useCallback(() => {
    // Screen shake on body
    if (bodyShakeRef.current) return;
    bodyShakeRef.current = true;
    document.body.style.animation = "bqScreenShake 0.6s ease-in-out";
    setTimeout(() => {
      document.body.style.animation = "";
      bodyShakeRef.current = false;
    }, 600);

    // Confetti burst via DOM (avoids React re-render thrash for ephemeral elements)
    const container = confettiContainerRef.current;
    if (!container) return;
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div");
      const size = 6 + Math.random() * 8;
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const tx = (Math.random() - 0.5) * 800;
      const ty = -200 - Math.random() * 600;
      const r = Math.random() * 720;
      el.style.cssText = `
        position:fixed;
        top:50%;left:50%;
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
        pointer-events:none;
        z-index:9999;
        --tx:${tx}px;--ty:${ty}px;--r:${r}deg;
        animation:bqConfettiFly ${1 + Math.random()}s ease-out forwards;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2100);
    }
  }, []);

  return (
    <>
      {/* Confetti portal container */}
      <div ref={confettiContainerRef} aria-hidden="true" />

      <div className="bq-root">
        {/* Hero flash overlay */}
        <div className="bq-hero-flash" aria-hidden="true" />

        {/* === HERO === */}
        <section className="bq-hero">
          {/* Particles */}
          <div className="bq-particles" aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <div
                key={i}
                className="bq-particle"
                style={{
                  left: p.left,
                  top: p.top,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  background: p.bg,
                }}
              />
            ))}
          </div>

          {/* Seismograph line */}
          <div className="bq-seismo-line" aria-hidden="true">
            <svg viewBox="0 0 2000 60" preserveAspectRatio="none">
              <path d="M0,30 L200,30 L220,5 L240,55 L260,10 L280,50 L300,30 L500,30 L520,8 L540,52 L560,15 L580,45 L600,30 L800,30 L820,3 L840,57 L860,12 L880,48 L900,30 L1100,30 L1120,6 L1140,54 L1160,14 L1180,46 L1200,30 L1400,30 L1420,4 L1440,56 L1460,11 L1480,49 L1500,30 L1700,30 L1720,7 L1740,53 L1760,13 L1780,47 L1800,30 L2000,30" />
            </svg>
          </div>

          <p className="bq-hero-pre">⚡ San Jose Earthquakes Present ⚡</p>

          <h1 className="bq-hero-title">
            Marc &ldquo;My Days&rdquo; Bromwell
            <br />
            Starts the{" "}
            <span className="bq-quake-word">
              {QUAKE_LETTERS.map((letter, i) => (
                <span
                  key={i}
                  className="bq-quake-letter"
                  style={{
                    animationDelay: [
                      "0s",
                      "0.12s",
                      "0.22s",
                      "0.3s",
                      "0.4s",
                      "0.55s",
                      "0.65s",
                    ][i],
                    // @ts-expect-error CSS custom properties
                    "--fall-rot": `${FALL_ROTATIONS[i]}deg`,
                    "--fall-x": `${FALL_X[i]}px`,
                  }}
                >
                  {letter}
                </span>
              ))}
            </span>
          </h1>

          <p className="bq-hero-sub">
            One kid. One wave. 18,000 fans losing their minds.
          </p>

          <Button className="bq-quake-btn" onClick={triggerQuake}>
            🫨 Start the Quake
          </Button>
        </section>

        {/* === WAVE SECTION === */}
        <section className="bq-wave-section bq-reveal">
          <h2>🌊 THE WAVE BEGINS</h2>
          <p>
            It only takes one. Brommie stands up, throws the arms up, and the
            whole stadium follows.
          </p>
          <div className="bq-stadium-wave" aria-hidden="true">
            {WAVE_PEOPLE.map((person, i) => (
              <div
                key={i}
                className="bq-wave-person"
                style={{
                  animationDelay: person.delay,
                  background: person.color,
                }}
              />
            ))}
          </div>
        </section>

        {/* === VIDEO SECTION === */}
        <section className="bq-video-section bq-reveal">
          <h2>📹 THE MOMENT</h2>
          <div className="bq-video-container">
            <iframe
              src="https://www.youtube.com/embed/Jy5H6u4Nu_w?rel=0&modestbranding=1"
              title="Brommie Starts the Quake"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        {/* === STATS === */}
        <section className="bq-stats-section bq-reveal">
          {STATS.map((stat) => (
            <Card key={stat.label} className="bq-stat-card">
              <CardContent className="p-0">
                <div className="bq-stat-emoji">{stat.emoji}</div>
                <div className="bq-stat-number">{stat.number}</div>
                <div className="bq-stat-label">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* === SPECTATOR QUOTES === */}
        <section className="bq-quotes-section bq-reveal">
          <h2>🗣️ FROM THE STANDS</h2>
          <div className="bq-quotes-grid">
            {QUOTES.map((q, i) => (
              <Card key={i} className="bq-quote-card">
                <CardContent className="p-0">
                  <p className="bq-quote-text">{q.text}</p>
                  <p className="bq-quote-author">{q.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* === ROAR BANNER === */}
        <section className="bq-roar-banner bq-reveal">
          <h2>🔵⚫ THIS KID IS THE MAIN CHARACTER ⚫🔵</h2>
          <div className="bq-roar-emojis">⚽🏟️🌊👏🔥⚡👊🫨💥🗣️</div>
        </section>

        <footer className="bq-footer">⚡ Brommie × San Jose Earthquakes ⚡</footer>
      </div>
    </>
  );
}
