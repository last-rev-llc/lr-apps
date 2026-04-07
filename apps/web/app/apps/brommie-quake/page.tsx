"use client";

import { useEffect, useRef, useCallback } from "react";

// --- Static data ---

const STATS = [
  { emoji: "🧒", number: "1", label: "Kid Started It" },
  { emoji: "🌊", number: "360°", label: "Full Stadium Wave" },
  { emoji: "🔊", number: "MAX", label: "Crowd Volume" },
  { emoji: "⚡", number: "∞", label: "Hype Level" },
];

const QUOTES = [
  {
    text: "I've been coming to Quakes games for 15 years. Never seen one kid get the entire stadium on their feet like that. Absolute legend.",
    author: "— Section 109, Season Ticket Holder",
  },
  {
    text: 'My son turned to me and said "Dad, I want to be THAT kid." Same, buddy. Same.',
    author: "— Row F, Lower Bowl",
  },
  {
    text: "The wave went around THREE times. I lost my voice and my nachos. Worth it.",
    author: "— Upper Deck, Behind the Goal",
  },
  {
    text: "That kid has more leadership in one arm wave than most people have in their entire body. Future captain energy.",
    author: "— The 1906 Ultras Section",
  },
  {
    text: "I was filming the game and completely switched to filming this kid. Best content of the night, no contest.",
    author: "— Press Box Adjacent",
  },
  {
    text: "Even the away fans stood up. You can't fight that kind of energy. You just join in.",
    author: "— Visiting Supporter",
  },
];

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

// Confetti colors
const CONFETTI_COLORS = ["#0067B1", "#CE0F2D", "#D4A843", "#003DA5", "#fff"];

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
      {/* Injected global styles for this page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&family=Bebas+Neue&family=Inter:wght@400;700;900&display=swap');

        :root {
          --quake-blue: #0067B1;
          --quake-dark-blue: #003DA5;
          --quake-black: #000000;
          --quake-white: #FFFFFF;
          --quake-red: #CE0F2D;
          --quake-gold: #D4A843;
          --glow-blue: rgba(0, 103, 177, 0.6);
        }

        @keyframes bqScreenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-0.5deg); }
          20% { transform: translate(3px, 2px) rotate(0.5deg); }
          30% { transform: translate(-2px, 3px) rotate(-0.3deg); }
          40% { transform: translate(2px, -3px) rotate(0.3deg); }
          50% { transform: translate(-3px, 1px) rotate(-0.5deg); }
          60% { transform: translate(3px, -1px) rotate(0.5deg); }
          70% { transform: translate(-1px, 3px) rotate(-0.2deg); }
          80% { transform: translate(1px, -2px) rotate(0.2deg); }
          90% { transform: translate(-2px, 2px) rotate(-0.4deg); }
        }

        @keyframes bqDrawSeismo {
          to { stroke-dashoffset: 0; }
        }

        @keyframes bqParticleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-80px) scale(1.5); opacity: 1; }
        }

        @keyframes bqFadeSlideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bqTitleSlam {
          0% { transform: scale(3) translateY(-50px); opacity: 0; filter: blur(10px); }
          60% { transform: scale(0.95); }
          80% { transform: scale(1.02); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }

        @keyframes bqWordTremor {
          0%, 45% { transform: translate(0,0); }
          47% { transform: translate(-2px, 1px); }
          48% { transform: translate(3px, -1px); }
          49% { transform: translate(-1px, 2px); }
          50% { transform: translate(2px, -2px); }
          51% { transform: translate(-3px, 1px); }
          52% { transform: translate(1px, -1px); }
          53% { transform: translate(-2px, 2px); }
          54% { transform: translate(0, 0); }
          55%, 100% { transform: translate(0,0); }
        }

        @keyframes bqLetterCrumble {
          0%, 54% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
            filter: brightness(1);
          }
          55% { transform: translateY(-4px) translateX(3px) rotate(1deg) scale(1); filter: brightness(1.5); }
          56% { transform: translateY(3px) translateX(-4px) rotate(-2deg) scale(1); }
          57% { transform: translateY(-5px) translateX(2px) rotate(2deg) scale(1.02); filter: brightness(2); }
          58% { transform: translateY(2px) translateX(-3px) rotate(-1deg) scale(1); }
          60% {
            transform: translateY(-25px) translateX(0) rotate(0deg) scale(1.1);
            opacity: 1;
            filter: brightness(2.5);
            text-shadow: 0 0 60px #fff, 0 0 120px rgba(206,15,45,1);
          }
          65% {
            transform: translateY(40px) translateX(var(--fall-x)) rotate(calc(var(--fall-rot) * 0.5)) scale(0.9);
            opacity: 0.9;
            filter: brightness(1);
          }
          72% {
            transform: translateY(180px) translateX(calc(var(--fall-x) * 2)) rotate(var(--fall-rot)) scale(0.6);
            opacity: 0.5;
          }
          78% {
            transform: translateY(350px) translateX(calc(var(--fall-x) * 3)) rotate(calc(var(--fall-rot) * 2)) scale(0.3);
            opacity: 0.1;
          }
          82% {
            transform: translateY(500px) translateX(calc(var(--fall-x) * 4)) rotate(calc(var(--fall-rot) * 3)) scale(0);
            opacity: 0;
          }
          83%, 92% { transform: translateY(500px) scale(0); opacity: 0; }
          93% {
            transform: translateY(-60px) scale(1.3);
            opacity: 1;
            filter: brightness(3);
            text-shadow: 0 0 80px #fff, 0 0 160px rgba(206,15,45,1);
          }
          96% {
            transform: translateY(5px) scale(0.98);
            opacity: 1;
            filter: brightness(1.5);
          }
          98% { transform: translateY(-2px) scale(1.01); filter: brightness(1.2); }
          100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1); }
        }

        @keyframes bqCrackFlash {
          0%, 56% { opacity: 0; }
          58% { opacity: 1; }
          60% { opacity: 0; }
        }

        @keyframes bqHeroFlash {
          0%, 92% { opacity: 0; }
          93% { opacity: 0.4; }
          95% { opacity: 0; }
        }

        @keyframes bqWaveUp {
          0%, 40%, 100% { transform: translateY(0); background: var(--quake-blue); }
          20% { transform: translateY(-50px); background: var(--quake-gold); box-shadow: 0 0 25px rgba(212, 168, 67, 0.8); }
        }

        @keyframes bqHandsUp {
          0%, 40%, 100% { transform: translateX(-50%) scale(0); }
          15%, 25% { transform: translateX(-50%) scale(1); }
        }

        @keyframes bqBorderPulse {
          0%, 100% { border-color: var(--quake-blue); box-shadow: 0 0 40px var(--glow-blue); }
          50% { border-color: var(--quake-gold); box-shadow: 0 0 60px rgba(212, 168, 67, 0.4); }
        }

        @keyframes bqPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes bqBannerShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes bqRoarPulse {
          from { transform: scale(1); text-shadow: 0 0 20px rgba(255,255,255,0.3); }
          to { transform: scale(1.03); text-shadow: 0 0 60px rgba(255,255,255,0.8); }
        }

        @keyframes bqEmojiWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes bqConfettiFly {
          0% { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)); opacity: 0; }
        }

        /* Scroll reveal */
        .bq-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .bq-reveal.bq-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Hero */
        .bq-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          background:
            radial-gradient(ellipse at 50% 0%, var(--quake-blue) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, var(--quake-dark-blue) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 80%, rgba(206, 15, 45, 0.3) 0%, transparent 40%),
            var(--quake-black);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(0, 103, 177, 0.05) 40px,
            rgba(0, 103, 177, 0.05) 41px
          );
          pointer-events: none;
        }

        .bq-seismo-line {
          position: absolute;
          top: 50%;
          left: 0;
          width: 200%;
          height: 3px;
          opacity: 0.15;
          pointer-events: none;
        }
        .bq-seismo-line svg {
          width: 100%;
          height: 60px;
          transform: translateY(-50%);
        }
        .bq-seismo-line svg path {
          stroke: var(--quake-blue);
          stroke-width: 2;
          fill: none;
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: bqDrawSeismo 4s linear infinite;
        }

        .bq-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .bq-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: bqParticleFloat 3s ease-in-out infinite;
          box-shadow: 0 0 10px var(--glow-blue);
        }

        .bq-hero-pre {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1.2rem, 3vw, 2rem);
          color: var(--quake-gold);
          letter-spacing: 0.4em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          animation: bqFadeSlideDown 1s ease-out 0.2s both;
          text-shadow: 0 0 20px rgba(212, 168, 67, 0.5);
          position: relative;
          z-index: 2;
        }

        .bq-hero-title {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(3rem, 10vw, 8rem);
          line-height: 0.95;
          text-transform: uppercase;
          margin-bottom: 1rem;
          animation: bqTitleSlam 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both;
          text-shadow:
            0 0 40px var(--glow-blue),
            0 0 80px rgba(0, 103, 177, 0.3),
            4px 4px 0 var(--quake-dark-blue);
          position: relative;
          z-index: 2;
        }

        .bq-quake-word {
          display: inline-block;
          font-size: 2.2em;
          color: var(--quake-red);
          text-shadow: 0 0 80px rgba(206, 15, 45, 0.9), 0 0 150px rgba(206, 15, 45, 0.4), 8px 8px 0 #8B0000;
          position: relative;
          filter: brightness(1.2);
          animation: bqWordTremor 5s ease-in-out infinite;
        }

        .bq-quake-letter {
          display: inline-block;
          animation: bqLetterCrumble 5s ease-in-out infinite;
          transform-origin: bottom center;
          position: relative;
        }
        .bq-quake-letter::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,100,50,0.6) 45%, transparent 50%);
          opacity: 0;
          animation: bqCrackFlash 5s ease-in-out infinite;
          pointer-events: none;
        }

        .bq-hero-flash {
          position: fixed;
          inset: 0;
          background: white;
          pointer-events: none;
          z-index: 100;
          opacity: 0;
          animation: bqHeroFlash 5s ease-in-out infinite;
        }

        .bq-hero-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(1rem, 2.5vw, 1.8rem);
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.3em;
          animation: bqFadeSlideDown 1s ease-out 1s both;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .bq-quake-btn {
          display: inline-block;
          padding: 1rem 3rem;
          font-family: 'Russo One', sans-serif;
          font-size: 1.3rem;
          text-transform: uppercase;
          background: linear-gradient(135deg, var(--quake-blue), var(--quake-dark-blue));
          color: white;
          border: 2px solid var(--quake-gold);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px var(--glow-blue);
          animation: bqFadeSlideDown 1s ease-out 1.5s both;
          position: relative;
          z-index: 2;
        }
        .bq-quake-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 50px var(--glow-blue), 0 0 100px rgba(0, 103, 177, 0.3);
          background: linear-gradient(135deg, var(--quake-dark-blue), var(--quake-blue));
        }
        .bq-quake-btn:active {
          animation: bqScreenShake 0.5s ease-in-out;
        }

        /* Wave section */
        .bq-wave-section {
          position: relative;
          padding: 4rem 2rem;
          background: linear-gradient(180deg, var(--quake-black) 0%, #001428 50%, var(--quake-black) 100%);
          overflow: hidden;
          text-align: center;
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-wave-section h2 {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(2rem, 5vw, 4rem);
          margin-bottom: 1rem;
          text-shadow: 0 0 30px var(--glow-blue);
        }
        .bq-wave-section p {
          font-size: clamp(1rem, 2vw, 1.3rem);
          color: rgba(255,255,255,0.6);
          max-width: 600px;
          margin: 0 auto 3rem;
        }

        .bq-stadium-wave {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 4px;
          height: 150px;
          margin: 2rem auto;
          max-width: 900px;
          flex-wrap: wrap;
        }
        .bq-wave-person {
          width: 16px;
          height: 40px;
          border-radius: 8px 8px 4px 4px;
          animation: bqWaveUp 2s ease-in-out infinite;
          position: relative;
          box-shadow: 0 0 10px var(--glow-blue);
        }
        .bq-wave-person::before {
          content: '';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: inherit;
          border-radius: 50%;
        }
        .bq-wave-person::after {
          content: '🙌';
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          font-size: 14px;
          animation: bqHandsUp 2s ease-in-out infinite;
        }

        /* Video section */
        .bq-video-section {
          padding: 4rem 2rem;
          text-align: center;
          background:
            radial-gradient(ellipse at center, rgba(0, 103, 177, 0.15) 0%, transparent 70%),
            var(--quake-black);
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-video-section h2 {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(1.5rem, 4vw, 3rem);
          margin-bottom: 2rem;
          text-shadow: 0 0 30px var(--glow-blue);
        }
        .bq-video-container {
          max-width: 900px;
          margin: 0 auto;
          aspect-ratio: 16/9;
          background: linear-gradient(135deg, #001428 0%, #002952 100%);
          border: 3px solid var(--quake-blue);
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 0 40px var(--glow-blue),
            0 0 80px rgba(0, 103, 177, 0.2),
            inset 0 0 60px rgba(0, 103, 177, 0.1);
          animation: bqBorderPulse 3s ease-in-out infinite;
        }
        .bq-video-container iframe {
          width: 100%;
          height: 100%;
          border-radius: 13px;
          display: block;
          border: none;
        }

        /* Stats section */
        .bq-stats-section {
          padding: 4rem 2rem;
          display: flex;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
          background: linear-gradient(180deg, var(--quake-black) 0%, #0a0a0a 100%);
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-stat-card {
          text-align: center;
          padding: 2rem;
          background: rgba(0, 103, 177, 0.1);
          border: 1px solid rgba(0, 103, 177, 0.3);
          border-radius: 16px;
          min-width: 180px;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: default;
        }
        .bq-stat-card:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 10px 40px var(--glow-blue);
          border-color: var(--quake-blue);
        }
        .bq-stat-emoji { font-size: 3rem; margin-bottom: 0.5rem; }
        .bq-stat-number {
          font-family: 'Russo One', sans-serif;
          font-size: 2.5rem;
          color: var(--quake-gold);
          text-shadow: 0 0 20px rgba(212, 168, 67, 0.5);
        }
        .bq-stat-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.6);
          margin-top: 0.3rem;
        }

        /* Quotes section */
        .bq-quotes-section {
          padding: 4rem 2rem;
          background: linear-gradient(180deg, #0a0a0a 0%, #001428 50%, var(--quake-black) 100%);
          text-align: center;
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-quotes-section h2 {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(1.5rem, 4vw, 3rem);
          margin-bottom: 3rem;
          text-shadow: 0 0 30px var(--glow-blue);
        }
        .bq-quotes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .bq-quote-card {
          background: rgba(0, 103, 177, 0.08);
          border: 1px solid rgba(0, 103, 177, 0.2);
          border-radius: 16px;
          padding: 2rem;
          text-align: left;
          position: relative;
          transition: transform 0.3s, border-color 0.3s;
        }
        .bq-quote-card:hover {
          transform: translateY(-4px);
          border-color: var(--quake-gold);
        }
        .bq-quote-card::before {
          content: '"';
          font-family: 'Russo One', sans-serif;
          font-size: 4rem;
          color: var(--quake-blue);
          opacity: 0.3;
          position: absolute;
          top: 8px;
          left: 16px;
          line-height: 1;
        }
        .bq-quote-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
          margin-bottom: 1rem;
          padding-top: 1rem;
        }
        .bq-quote-author {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.95rem;
          letter-spacing: 0.15em;
          color: var(--quake-gold);
        }

        /* Roar banner */
        .bq-roar-banner {
          padding: 3rem 2rem;
          text-align: center;
          background: linear-gradient(90deg, var(--quake-red), var(--quake-blue), var(--quake-red));
          background-size: 200% 100%;
          animation: bqBannerShift 4s ease-in-out infinite;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          color: var(--quake-white);
        }
        .bq-roar-banner h2 {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(2rem, 6vw, 5rem);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          animation: bqRoarPulse 1s ease-in-out infinite alternate;
        }
        .bq-roar-emojis {
          font-size: 2rem;
          margin-top: 1rem;
          animation: bqEmojiWave 1.5s ease-in-out infinite;
        }

        /* Footer */
        .bq-footer {
          padding: 2rem;
          text-align: center;
          background: var(--quake-black);
          border-top: 2px solid rgba(0, 103, 177, 0.2);
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.3em;
          color: rgba(255,255,255,0.3);
          font-size: 0.9rem;
        }

        /* Page reset for this page */
        .bq-root {
          background: var(--quake-black);
          color: var(--quake-white);
          overflow-x: hidden;
          min-height: 100vh;
        }
      `}</style>

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

          <button className="bq-quake-btn" onClick={triggerQuake}>
            🫨 Start the Quake
          </button>
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
            <div key={stat.label} className="bq-stat-card">
              <div className="bq-stat-emoji">{stat.emoji}</div>
              <div className="bq-stat-number">{stat.number}</div>
              <div className="bq-stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* === SPECTATOR QUOTES === */}
        <section className="bq-quotes-section bq-reveal">
          <h2>🗣️ FROM THE STANDS</h2>
          <div className="bq-quotes-grid">
            {QUOTES.map((q, i) => (
              <div key={i} className="bq-quote-card">
                <p className="bq-quote-text">{q.text}</p>
                <p className="bq-quote-author">{q.author}</p>
              </div>
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
