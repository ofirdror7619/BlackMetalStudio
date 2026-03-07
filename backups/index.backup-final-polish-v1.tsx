import { useMemo, useRef, useState } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";

const bodyFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });
const titleFont = Cormorant_Garamond({ subsets: ["latin"], weight: ["600", "700"] });
const romanLayers: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
};
const grimoireLines = [
  "in nocte invocamus",
  "ignis sub luna",
  "umbrae aeternum",
  "rex caprarum",
  "sigillum tenebris",
  "sanguis et cineres",
  "mors super montes",
  "nox arcana",
  "in nomine abyssi",
  "vox de profundis",
  "fera in silentio",
  "ritus antiqui",
  "ordo nocturnus",
  "maleficium vetus",
  "per aspera ad umbras",
  "liber obscurus",
  "daemonium scriptum",
  "terra nigra sacra",
  "umbra in aeternum",
  "ordo malleus noctis",
  "ferrum et ossa",
  "ritus sanguinis",
  "voces vetustae",
  "sepulcrum silentii",
  "noctis testamentum",
  "lumen ex cinere",
  "templum sub terra",
  "infernus apertus",
];

const seeded = (seed: number) => {
  const value = Math.sin(seed * 9173.731) * 10000;
  return value - Math.floor(value);
};

export default function Home() {
  const [text, setText] = useState("");
  const [preset, setPreset] = useState("Darkthrone");
  const [layers, setLayers] = useState(2);
  const [ritualStatus, setRitualStatus] = useState<"Idle" | "Summoning" | "Forging Track" | "Complete">("Idle");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const resetStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grimoireGlyphs = useMemo(
    () => {
      const glyphCount = 60;
      const glyphs = [];
      let attempt = 0;

      while (glyphs.length < glyphCount && attempt < 500) {
        const topValue = 4 + seeded(attempt + 1) * 92;
        const leftValue = 1 + seeded(attempt + 101) * 98;

        const dx = (leftValue - 50) / 34;
        const dy = (topValue - 74) / 24;
        const insideSigilZone = dx * dx + dy * dy < 1;
        if (insideSigilZone) {
          attempt += 1;
          continue;
        }

        const line = grimoireLines[Math.floor(seeded(attempt + 801) * grimoireLines.length)];
        glyphs.push({
          line,
          top: `${topValue}%`,
          left: `${leftValue}%`,
          rotate: "0deg",
          size: `${0.7 + seeded(attempt + 301) * 0.62}rem`,
          alpha: 0.18 + seeded(attempt + 401) * 0.2,
          driftX: `${-2 + seeded(attempt + 501) * 4}px`,
          driftY: `${-2 + seeded(attempt + 601) * 4}px`,
          flickerDuration: `${3.6 + seeded(attempt + 701) * 4.8}s`,
          fadeDuration: `${8 + seeded(attempt + 901) * 8}s`,
          driftDuration: `${11 + seeded(attempt + 1001) * 11}s`,
          delayA: `${seeded(attempt + 1101) * 4}s`,
          delayB: `${seeded(attempt + 1201) * 5.5}s`,
          delayC: `${seeded(attempt + 1301) * 6.5}s`,
        });

        attempt += 1;
      }

      return glyphs;
    },
    []
  );

  const generate = async () => {
    if (resetStatusTimer.current) {
      clearTimeout(resetStatusTimer.current);
      resetStatusTimer.current = null;
    }

    try {
      setRitualStatus("Summoning");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, preset, layers }),
      });

      setRitualStatus("Forging Track");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();

      setRitualStatus("Complete");
      resetStatusTimer.current = setTimeout(() => {
        setRitualStatus("Idle");
      }, 2800);
    } catch {
      setRitualStatus("Idle");
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    setCursorPos({ x: event.clientX, y: event.clientY });
    setCursorVisible(true);
  };

  const handlePointerLeave = () => {
    setCursorVisible(false);
  };

  return (
    <>
      <main className={`page ${bodyFont.className}`} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <div className="mist" />
        <div
          className={`cursorGlow ${cursorVisible ? "active" : ""}`}
          style={{ left: cursorPos.x - 200, top: cursorPos.y - 200 }}
          aria-hidden="true"
        >
          <div className="cursorGlowInner" />
        </div>
        <div className="grimoire" aria-hidden="true">
          {grimoireGlyphs.map(glyph => (
            <span
              key={`${glyph.line}-${glyph.top}-${glyph.left}`}
              className="glyph"
              style={{
                top: glyph.top,
                left: glyph.left,
                transform: `translate(-50%, -50%) rotate(${glyph.rotate})`,
                fontSize: glyph.size,
                opacity: glyph.alpha,
                animationName: "runeFlicker, runeFade, runeDrift",
                animationDuration: `${glyph.flickerDuration}, ${glyph.fadeDuration}, ${glyph.driftDuration}`,
                animationDelay: `${glyph.delayA}, ${glyph.delayB}, ${glyph.delayC}`,
                animationTimingFunction: "ease-in-out, ease-in-out, ease-in-out",
                animationIterationCount: "infinite, infinite, infinite",
                transformOrigin: "center",
                ["--base-rotate" as string]: glyph.rotate,
                ["--drift-x" as string]: glyph.driftX,
                ["--drift-y" as string]: glyph.driftY,
              }}
            >
              {glyph.line}
            </span>
          ))}
        </div>
        <div className="hellfire" />
        <div className="grain" />
        <svg
          className="sigil"
          viewBox="0 0 1000 1000"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform="rotate(180 500 500)">
            <circle cx="500" cy="500" r="360" className="ring" />
            <circle cx="500" cy="500" r="325" className="ring faint" />
            <polygon
              points="500,145 590,430 885,430 645,605 735,885 500,715 265,885 355,605 115,430 410,430"
              className="star"
            />
            <path d="M500 190 L500 810 M190 500 L810 500" className="faint" />
          </g>
          <path
            d="M500 345
              C420 340 360 370 335 430
              C320 465 333 513 372 540
              C405 563 426 590 430 630
              C434 680 406 728 346 765
              M500 345
              C580 340 640 370 665 430
              C680 465 667 513 628 540
              C595 563 574 590 570 630
              C566 680 594 728 654 765"
            className="horns"
          />
          <path
            d="M500 390
              C460 390 430 418 422 455
              C416 482 422 518 444 540
              C466 562 484 584 492 615
              C496 630 504 630 508 615
              C516 584 534 562 556 540
              C578 518 584 482 578 455
              C570 418 540 390 500 390Z"
            className="head"
          />
          <path d="M458 462 C448 462 440 470 440 482 C440 492 448 500 458 500 C468 500 476 492 476 482 C476 470 468 462 458 462Z" className="detail" />
          <path d="M542 462 C532 462 524 470 524 482 C524 492 532 500 542 500 C552 500 560 492 560 482 C560 470 552 462 542 462Z" className="detail" />
          <path d="M500 500 L488 535 L500 550 L512 535 Z" className="detail" />
          <path d="M458 566 C478 582 522 582 542 566" className="detail" />
          <path d="M476 612 C490 640 490 700 462 742" className="beard" />
          <path d="M524 612 C510 640 510 700 538 742" className="beard" />
          <path d="M500 292 L486 334 L500 346 L514 334 Z" className="faint" />
          <path d="M430 676 C455 700 480 712 500 718 C520 712 545 700 570 676" className="faint" />
        </svg>
        <svg
          className="embers"
          viewBox="0 0 1200 500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M80 500 C150 460 170 380 210 330 C250 280 300 300 305 355 C310 410 280 460 250 500" className="flame" />
          <path d="M280 500 C355 445 368 360 408 300 C445 242 505 260 512 325 C520 397 476 455 430 500" className="flame" />
          <path d="M520 500 C592 452 610 385 656 330 C700 278 760 300 762 360 C764 420 726 472 688 500" className="flame" />
          <path d="M735 500 C802 458 830 404 864 356 C895 312 940 322 946 372 C952 420 922 468 882 500" className="flame" />
          <path d="M930 500 C996 468 1024 425 1060 384 C1090 350 1135 358 1136 400 C1138 445 1110 478 1080 500" className="flame" />
          <circle cx="180" cy="290" r="5" className="spark" />
          <circle cx="332" cy="260" r="4" className="spark" />
          <circle cx="470" cy="238" r="3" className="spark" />
          <circle cx="622" cy="252" r="4" className="spark" />
          <circle cx="768" cy="228" r="3" className="spark" />
          <circle cx="946" cy="264" r="4" className="spark" />
        </svg>

        <section className="panel">
          <h1 className={titleFont.className}>Black Metal Studio</h1>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type lyrics..."
            rows={5}
          />
          <div className="field">
            <label>Preset:</label>
            <select value={preset} onChange={e => setPreset(e.target.value)}>
              <option>Darkthrone</option>
              <option>Immortal</option>
              <option>Mayhem</option>
            </select>
          </div>
          <div className="field">
            <label>Layered Screams:</label>
            <div className="runeStepper" role="group" aria-label="Layered Screams">
              <button type="button" className="runeControl" onClick={() => setLayers(value => Math.max(1, value - 1))}>-</button>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  className={`runeValue ${layers === value ? "active" : ""}`}
                  onClick={() => setLayers(value)}
                >
                  {romanLayers[value]}
                </button>
              ))}
              <button type="button" className="runeControl" onClick={() => setLayers(value => Math.min(5, value + 1))}>+</button>
            </div>
          </div>
          <div className="ritualBar" aria-live="polite">
            <span className={`ritualStep ${ritualStatus === "Idle" ? "active" : ""}`}>Idle</span>
            <span className={`ritualStep ${ritualStatus === "Summoning" ? "active" : ""}`}>Summoning</span>
            <span className={`ritualStep ${ritualStatus === "Forging Track" ? "active" : ""}`}>Forging Track</span>
            <span className={`ritualStep ${ritualStatus === "Complete" ? "active" : ""}`}>Complete</span>
          </div>
          <button onClick={generate}>Generate Black Metal Song</button>
        </section>
      </main>

      <style jsx>{`
        :global(html, body, #__next) {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .page {
          position: relative;
          min-height: 100dvh;
          height: 100dvh;
          padding: 8px 20px 20px;
          background: radial-gradient(circle at 50% 10%, #262626 0%, #080808 45%, #000000 100%);
          color: #e4d9d0;
          overflow: hidden;
          display: grid;
          place-items: start center;
        }

        .cursorGlow {
          position: fixed;
          width: 400px;
          height: 400px;
          pointer-events: none;
          z-index: 2;
          opacity: 0;
          display: none;
        }

        .cursorGlow.active {
          opacity: 0.3;
        }

        .cursorGlowInner {
          width: 400px;
          height: 400px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.2);
          filter: blur(64px);
        }

        @media (min-width: 768px) {
          .cursorGlow {
            display: block;
          }
        }

        .mist {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(128, 0, 0, 0.12), transparent 42%),
            radial-gradient(circle at 80% 30%, rgba(90, 90, 90, 0.14), transparent 38%),
            radial-gradient(circle at 50% 85%, rgba(120, 0, 0, 0.09), transparent 45%);
          filter: blur(18px);
          opacity: 0.8;
          pointer-events: none;
        }

        .grimoire {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          filter: blur(0.15px);
        }

        .glyph {
          position: absolute;
          color: #d5b39a;
          font-family: "Cormorant Garamond", Georgia, serif;
          letter-spacing: 0.14em;
          text-transform: lowercase;
          text-shadow: 0 0 10px rgba(124, 46, 22, 0.44);
          mix-blend-mode: screen;
          white-space: nowrap;
          will-change: opacity, filter, transform;
        }

        @keyframes runeFlicker {
          0%,
          100% {
            filter: drop-shadow(0 0 0 rgba(255, 120, 44, 0.15));
          }
          22% {
            filter: drop-shadow(0 0 5px rgba(255, 120, 44, 0.5));
          }
          48% {
            filter: drop-shadow(0 0 2px rgba(255, 90, 26, 0.3));
          }
          73% {
            filter: drop-shadow(0 0 8px rgba(255, 140, 62, 0.68));
          }
        }

        @keyframes runeFade {
          0%,
          100% {
            opacity: 0.16;
          }
          18% {
            opacity: 0.34;
          }
          41% {
            opacity: 0.1;
          }
          66% {
            opacity: 0.38;
          }
          83% {
            opacity: 0.14;
          }
        }

        @keyframes runeDrift {
          0%,
          100% {
            transform: translate(-50%, -50%) rotate(var(--base-rotate));
          }
          50% {
            transform: translate(calc(-50% + var(--drift-x)), calc(-50% + var(--drift-y))) rotate(var(--base-rotate));
          }
        }

        .hellfire {
          position: absolute;
          left: -6%;
          right: -6%;
          bottom: -2%;
          height: 42%;
          background:
            radial-gradient(ellipse at 10% 100%, rgba(210, 60, 8, 0.26), transparent 56%),
            radial-gradient(ellipse at 28% 100%, rgba(245, 90, 16, 0.22), transparent 52%),
            radial-gradient(ellipse at 48% 100%, rgba(188, 35, 7, 0.24), transparent 58%),
            radial-gradient(ellipse at 68% 100%, rgba(238, 72, 11, 0.21), transparent 54%),
            radial-gradient(ellipse at 88% 100%, rgba(165, 20, 7, 0.24), transparent 56%);
          filter: blur(14px);
          opacity: 0.72;
          pointer-events: none;
          z-index: 0;
        }

        .grain {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 3px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.016) 0 1px, transparent 1px 4px);
          mix-blend-mode: soft-light;
          opacity: 0.34;
          pointer-events: none;
        }

        .sigil {
          position: absolute;
          left: 50%;
          top: 74%;
          width: min(90vw, 900px);
          height: min(90vw, 900px);
          transform: translate(-50%, -50%);
          opacity: 0.42;
          filter: drop-shadow(0 0 24px rgba(135, 0, 0, 0.45)) blur(0.3px);
          pointer-events: none;
        }

        .embers {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 34vh;
          min-height: 180px;
          opacity: 0.45;
          filter: blur(0.1px) drop-shadow(0 0 10px rgba(255, 82, 24, 0.35));
          pointer-events: none;
          z-index: 0;
        }

        .flame {
          fill: none;
          stroke: rgba(255, 102, 26, 0.56);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .spark {
          fill: rgba(255, 150, 78, 0.8);
        }

        .ring,
        .star,
        .horns,
        .head,
        .detail,
        .beard,
        .faint {
          fill: none;
          stroke: #a53232;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: url(#glow);
        }

        .ring {
          stroke-width: 6;
        }

        .star {
          stroke-width: 9;
          stroke: #bd3b3b;
        }

        .horns,
        .head {
          stroke-width: 4;
        }

        .detail,
        .beard {
          stroke-width: 3.5;
        }

        .faint {
          stroke-width: 2.2;
          opacity: 0.55;
        }

        .panel {
          position: relative;
          z-index: 1;
          width: min(760px, 92vw);
          display: grid;
          gap: 12px;
          background:
            linear-gradient(180deg, rgba(12, 12, 12, 0.72), rgba(5, 5, 5, 0.8)),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.012) 0 2px, transparent 2px 4px);
          border: 1px solid rgba(145, 32, 32, 0.52);
          padding: 22px;
          box-shadow:
            0 16px 42px rgba(0, 0, 0, 0.55),
            inset 0 0 0 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(2.5px);
        }

        h1 {
          margin: 0;
          font-size: clamp(1.9rem, 3.4vw, 3rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f0e6dd;
          font-weight: 600;
          text-align: center;
          justify-self: center;
          text-shadow:
            0 0 8px rgba(255, 214, 186, 0.35),
            0 0 20px rgba(171, 30, 30, 0.72),
            0 1px 0 rgba(0, 0, 0, 0.75);
          animation: titlePulse 3.6s ease-in-out infinite;
        }

        @keyframes titlePulse {
          0%,
          100% {
            text-shadow:
              0 0 6px rgba(255, 214, 186, 0.28),
              0 0 16px rgba(171, 30, 30, 0.58),
              0 1px 0 rgba(0, 0, 0, 0.75);
          }
          50% {
            text-shadow:
              0 0 10px rgba(255, 224, 198, 0.42),
              0 0 28px rgba(188, 38, 38, 0.85),
              0 1px 0 rgba(0, 0, 0, 0.75);
          }
        }

        textarea,
        select {
          width: 100%;
          background: rgba(16, 16, 16, 0.9);
          color: #f0e6dd;
          border: 1px solid #5d1a1a;
          padding: 10px;
          font-size: 1rem;
          font-family: inherit;
          letter-spacing: 0.01em;
          transition: border-color 0.22s ease, box-shadow 0.22s ease;
        }

        textarea {
          resize: vertical;
        }

        textarea:hover,
        select:hover,
        textarea:focus,
        select:focus {
          border-color: #8f2626;
          box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.3), 0 0 14px rgba(130, 16, 16, 0.25);
          outline: none;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .runeStepper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .runeControl,
        .runeValue {
          border: 1px solid #5d1a1a;
          background: rgba(16, 16, 16, 0.9);
          color: #f0e6dd;
          min-width: 42px;
          height: 38px;
          padding: 0 12px;
          font-size: 0.96rem;
          cursor: pointer;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
        }

        .runeControl:hover,
        .runeValue:hover,
        .runeControl:focus,
        .runeValue:focus {
          border-color: #8f2626;
          box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.28), 0 0 12px rgba(130, 16, 16, 0.22);
          outline: none;
        }

        .runeValue.active {
          background: linear-gradient(180deg, rgba(88, 20, 20, 0.85), rgba(36, 7, 7, 0.95));
          border-color: #a23333;
          box-shadow: 0 0 10px rgba(166, 38, 38, 0.3);
        }

        .ritualBar {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ritualStep {
          padding: 6px 10px;
          font-size: 0.74rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid rgba(93, 26, 26, 0.9);
          color: #cfb9aa;
          background: rgba(14, 14, 14, 0.72);
        }

        .ritualStep.active {
          color: #f8e6d7;
          border-color: #ab3333;
          background: linear-gradient(180deg, rgba(94, 18, 18, 0.86), rgba(31, 8, 8, 0.9));
          box-shadow: 0 0 10px rgba(171, 37, 37, 0.35);
        }

        label {
          font-size: 0.95rem;
          letter-spacing: 0.05em;
          color: #d0bfb2;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(120, 18, 18, 0.35);
        }

        button {
          border: 1px solid #992a2a;
          background: linear-gradient(180deg, #340909 0%, #140404 100%);
          color: #f6ece2;
          padding: 12px 16px;
          font-size: 0.98rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
        }

        button:hover {
          background: linear-gradient(180deg, #4a0f0f 0%, #1c0707 100%);
        }
      `}</style>
    </>
  );
}