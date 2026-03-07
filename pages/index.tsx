import { useEffect, useMemo, useRef, useState } from "react";
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
const lyricPlaceholders = [
  "Carve your verses into the frostbitten void...",
  "Whisper a hymn for the dying sun...",
  "Write the oath of wolves beneath a black moon...",
  "Summon your lament through ash and winter...",
  "Etch blasphemies in the ruins of the night...",
  "Forge a cold requiem for forgotten gods...",
  "Invoke the storm with iron-hearted lines...",
  "Spill your grief across the northern sky...",
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
  const [completionFlash, setCompletionFlash] = useState(false);
  const [inkSpread, setInkSpread] = useState(false);
  const [burningLyrics, setBurningLyrics] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const lyricPlaceholder = useMemo(
    () => lyricPlaceholders[Math.floor(Math.random() * lyricPlaceholders.length)],
    []
  );
  const resetStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inkSpreadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ritualLocked = ritualStatus === "Summoning" || ritualStatus === "Forging Track";
  const emberParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${4 + seeded(index + 1401) * 92}%`,
        size: `${2 + seeded(index + 1501) * 4}px`,
        duration: `${6 + seeded(index + 1601) * 8}s`,
        delay: `${seeded(index + 1701) * 6}s`,
        drift: `${-22 + seeded(index + 1801) * 44}px`,
      })),
    []
  );
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
          burstDuration: `${12 + seeded(attempt + 1901) * 10}s`,
          delayD: `${seeded(attempt + 2001) * 9}s`,
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

    if (completionFlashTimer.current) {
      clearTimeout(completionFlashTimer.current);
      completionFlashTimer.current = null;
    }

    setCompletionFlash(false);

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
      setCompletionFlash(true);
      completionFlashTimer.current = setTimeout(() => {
        setCompletionFlash(false);
      }, 520);

      resetStatusTimer.current = setTimeout(() => {
        setRitualStatus("Idle");
      }, 2800);
    } catch {
      setRitualStatus("Idle");
      setCompletionFlash(false);
    }
  };

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      index += 1;
      setTypedPlaceholder(lyricPlaceholder.slice(0, index));
      if (index >= lyricPlaceholder.length) {
        clearInterval(intervalId);
      }
    }, 52);

    return () => {
      clearInterval(intervalId);
    };
  }, [lyricPlaceholder]);

  const handleTextChange = (value: string) => {
    const wasEmpty = text.trim().length === 0;
    setText(value);

    if (wasEmpty && value.trim().length > 0) {
      setInkSpread(true);
      if (inkSpreadTimer.current) {
        clearTimeout(inkSpreadTimer.current);
      }
      inkSpreadTimer.current = setTimeout(() => {
        setInkSpread(false);
      }, 680);
    }
  };

  const burnAfterReading = () => {
    if (burnTimer.current) {
      clearTimeout(burnTimer.current);
      burnTimer.current = null;
    }

    setBurningLyrics(true);
    burnTimer.current = setTimeout(() => {
      setText("");
      setBurningLyrics(false);
    }, 920);
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
        <div className="moonBeam" />
        <div className="fog fogA" />
        <div className="fog fogB" />
        <div className="vignette" />
        <div className="blackoutBlink" />
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
                animationName: "runeFlicker, runeFade, runeDrift, runeBurst",
                animationDuration: `${glyph.flickerDuration}, ${glyph.fadeDuration}, ${glyph.driftDuration}, ${glyph.burstDuration}`,
                animationDelay: `${glyph.delayA}, ${glyph.delayB}, ${glyph.delayC}, ${glyph.delayD}`,
                animationTimingFunction: "ease-in-out, ease-in-out, ease-in-out, linear",
                animationIterationCount: "infinite, infinite, infinite, infinite",
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
        <div className="embersFloat" aria-hidden="true">
          {emberParticles.map((particle, index) => (
            <span
              key={`ember-${index}`}
              className="emberDot"
              style={{
                left: particle.left,
                width: particle.size,
                height: particle.size,
                animationDuration: particle.duration,
                animationDelay: particle.delay,
                ["--ember-drift" as string]: particle.drift,
              }}
            />
          ))}
        </div>
        <div className="hellfire" />
        <div className="grain" />
        <svg
          className="runeCircle"
          viewBox="0 0 1000 1000"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="runeOrbit" d="M500 180 A320 320 0 1 1 499.9 180" />
          </defs>
          <circle cx="500" cy="500" r="320" className="orbit" />
          <circle cx="500" cy="500" r="286" className="orbit faintOrbit" />
          <text className="orbitText">
            <textPath href="#runeOrbit" startOffset="0%">
              ᚨ ᛉ ᚲ ᚱ ᛟ ᚦ ᚾ ᛗ ᛚ ᛇ ᛞ ᚹ ᚨ ᛉ ᚲ ᚱ ᛟ ᚦ ᚾ ᛗ ᛚ ᛇ ᛞ ᚹ
            </textPath>
          </text>
        </svg>
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
            d="M500 332
              C402 320 334 352 304 422
              C286 466 300 518 342 552
              C378 582 404 612 406 654
              C408 706 382 748 326 788
              M500 332
              C598 320 666 352 696 422
              C714 466 700 518 658 552
              C622 582 596 612 594 654
              C592 706 618 748 674 788"
            className="horns"
          />
          <path
            d="M500 366
              C438 366 394 402 380 456
              C368 506 386 560 430 590
              C452 606 468 626 476 648
              C484 672 484 704 462 724
              C446 738 446 760 474 774
              C486 780 494 792 500 806
              C506 792 514 780 526 774
              C554 760 554 738 538 724
              C516 704 516 672 524 648
              C532 626 548 606 570 590
              C614 560 632 506 620 456
              C606 402 562 366 500 366Z"
            className="head"
          />
          <path d="M416 456 L456 442 L474 466 L440 500 L416 482 Z" className="detail" />
          <path d="M584 456 L544 442 L526 466 L560 500 L584 482 Z" className="detail" />
          <path d="M500 482 L484 530 L500 548 L516 530 Z" className="detail" />
          <path d="M500 596 C474 596 458 616 458 640 C458 676 476 712 500 736 C524 712 542 676 542 640 C542 616 526 596 500 596Z" className="detail screamMouth" />
          <path d="M480 626 L480 688 M500 620 L500 698 M520 626 L520 688" className="faint" />
          <path d="M500 378 L486 414 L502 446 L488 486" className="faint" />
          <path d="M452 398 L438 430 L450 468 L438 500" className="faint" />
          <path d="M548 398 L562 430 L550 468 L562 500" className="faint" />
          <path d="M430 536 L448 566 L436 596" className="faint" />
          <path d="M570 536 L552 566 L564 596" className="faint" />
          <path d="M500 304 L482 350 L500 366 L518 350 Z" className="faint" />
          <path d="M440 688 L470 726 L500 758 L530 726 L560 688" className="beard" />
          <path d="M470 726 L456 770 M530 726 L544 770" className="beard" />
          <path d="M500 758 L486 802 L500 824 L514 802 Z" className="faint" />
        </svg>
        <div className="sigilBreath" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
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

        <section className={`panel ${ritualLocked ? "locked" : ""}`}>
          <h1 className={titleFont.className}><span className="titleRune">᛭</span> Black Metal Studio <span className="titleRune">᛭</span></h1>
          <div className={`textAreaShell ${burningLyrics ? "burning" : ""}`}>
            <div className="burnRunes" aria-hidden="true">
              <span>ᚨ ᛉ ᚲ ᚱ ᛟ ᚦ ᚾ ᛗ ᛚ</span>
              <span>ᛁ ᚷ ᚢ ᛇ ᛒ ᛞ ᛜ ᚹ ᛏ</span>
            </div>
            <textarea
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              placeholder={typedPlaceholder || lyricPlaceholder}
              rows={5}
              disabled={ritualLocked}
              className={inkSpread ? "inkSpread" : ""}
            />
          </div>
          <button type="button" className="burnButton" onClick={burnAfterReading} disabled={ritualLocked || text.trim().length === 0}>Burn After Reading</button>
          <div className="field">
            <label>Preset:</label>
            <select value={preset} onChange={e => setPreset(e.target.value)} disabled={ritualLocked}>
              <option>Darkthrone</option>
              <option>Immortal</option>
              <option>Mayhem</option>
            </select>
          </div>
          <div className="field">
            <label>Layered Screams:</label>
            <div className="runeStepper" role="group" aria-label="Layered Screams">
              <button type="button" className="runeControl" onClick={() => setLayers(value => Math.max(1, value - 1))} disabled={ritualLocked}>-</button>
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  className={`runeValue ${layers === value ? "active" : ""}`}
                  onClick={() => setLayers(value)}
                  disabled={ritualLocked}
                >
                  {romanLayers[value]}
                </button>
              ))}
              <button type="button" className="runeControl" onClick={() => setLayers(value => Math.min(5, value + 1))} disabled={ritualLocked}>+</button>
            </div>
          </div>
          <div className={`ritualBar ${ritualStatus === "Idle" ? "idle" : ""}`} aria-live="polite">
            <span className={`ritualStep ${ritualStatus === "Idle" ? "active" : ""}`}><span className="shrineIcon" aria-hidden="true">✶</span>Idle</span>
            <span className={`ritualStep ${ritualStatus === "Summoning" ? "active" : ""}`}><span className="shrineIcon" aria-hidden="true">☩</span>Summoning</span>
            <span className={`ritualStep ${ritualStatus === "Forging Track" ? "active" : ""}`}><span className="shrineIcon" aria-hidden="true">⛧</span>Forging Track</span>
            <span className={`ritualStep ${ritualStatus === "Complete" ? "active" : ""}`}><span className="shrineIcon" aria-hidden="true">✹</span>Complete</span>
          </div>
          <button className="mainGenerate" onClick={generate} disabled={ritualLocked}>{ritualLocked ? "Forging Black Metal Song..." : "Generate Black Metal Song"}</button>
        </section>
        <div className={`completionFlash ${completionFlash ? "active" : ""}`} aria-hidden="true" />
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

        .moonBeam {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(160, 170, 210, 0.12) 0%, rgba(120, 130, 170, 0.06) 24%, transparent 52%);
          pointer-events: none;
          z-index: 0;
        }

        .fog {
          position: absolute;
          inset: -10% -8%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.28;
          filter: blur(24px);
        }

        .fogA {
          background:
            radial-gradient(circle at 18% 62%, rgba(156, 156, 156, 0.16), transparent 36%),
            radial-gradient(circle at 72% 52%, rgba(130, 130, 130, 0.14), transparent 34%);
          animation: fogDriftA 42s linear infinite;
        }

        .fogB {
          background:
            radial-gradient(circle at 70% 68%, rgba(105, 105, 105, 0.13), transparent 38%),
            radial-gradient(circle at 30% 48%, rgba(150, 150, 150, 0.1), transparent 34%);
          animation: fogDriftB 56s linear infinite;
        }

        .vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0) 56%, rgba(0, 0, 0, 0.4) 100%);
        }

        .blackoutBlink {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: rgba(0, 0, 0, 0.8);
          opacity: 0;
          animation: blackoutBlink 26s linear infinite;
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

        @keyframes runeBurst {
          0%,
          88%,
          100% {
            filter: brightness(1);
          }
          91% {
            filter: brightness(1.65);
          }
          94% {
            filter: brightness(1.2);
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
          animation: hellfirePulse 8.6s ease-in-out infinite;
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
          background-size: 280px 280px, 240px 240px;
          animation: grainDrift 24s linear infinite;
        }

        .runeCircle {
          position: absolute;
          left: 50%;
          top: 74%;
          width: min(90vw, 900px);
          height: min(90vw, 900px);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          opacity: 0.18;
          animation: runeCircleSpin 95s linear infinite;
        }

        .orbit {
          fill: none;
          stroke: rgba(175, 70, 70, 0.34);
          stroke-width: 2.4;
        }

        .faintOrbit {
          stroke: rgba(135, 56, 56, 0.24);
          stroke-width: 1.8;
        }

        .orbitText {
          fill: rgba(210, 138, 138, 0.42);
          font-size: 26px;
          letter-spacing: 10px;
          text-transform: uppercase;
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
          animation: sigilSway 28s ease-in-out infinite;
        }

        .sigilBreath {
          position: absolute;
          left: 50%;
          top: calc(74% + min(12vw, 110px));
          width: min(35vw, 280px);
          height: min(25vw, 180px);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
          opacity: 0.32;
        }

        .sigilBreath span {
          position: absolute;
          left: 50%;
          bottom: 10%;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(200, 210, 220, 0.22) 0%, rgba(120, 128, 140, 0.08) 50%, rgba(50, 55, 62, 0) 100%);
          animation: breathFog 6.2s ease-out infinite;
        }

        .sigilBreath span:nth-child(2) {
          animation-delay: 2.1s;
          width: 28px;
          height: 28px;
        }

        .sigilBreath span:nth-child(3) {
          animation-delay: 4.2s;
          width: 24px;
          height: 24px;
        }

        .embersFloat {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .emberDot {
          position: absolute;
          bottom: -8px;
          border-radius: 999px;
          background: rgba(255, 144, 78, 0.62);
          box-shadow: 0 0 8px rgba(255, 122, 60, 0.45);
          animation-name: emberRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
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

        .screamMouth {
          transform-origin: 500px 664px;
          animation: mouthPulse 3.8s ease-in-out infinite;
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
          padding: 6px 2px;
          background: transparent;
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          justify-items: center;
          text-align: center;
          animation: candleFlicker 7.4s ease-in-out infinite;
        }

        .panel.locked {
          filter: saturate(0.9);
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

        .titleRune {
          display: inline-block;
          margin: 0 10px;
          opacity: 0.9;
          transform: translateY(0) scale(1);
          color: #d9b89f;
          text-shadow: 0 0 10px rgba(190, 50, 50, 0.55);
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
          background: rgba(14, 14, 14, 0.86);
          color: #f0e6dd;
          border: 1px solid #5d1a1a;
          padding: 10px;
          font-size: 1rem;
          font-family: inherit;
          letter-spacing: 0.01em;
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.5),
            0 2px 0 rgba(0, 0, 0, 0.45),
            0 0 14px rgba(150, 30, 30, 0.24);
          transition: border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .textAreaShell {
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .textAreaShell::before,
        .textAreaShell::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
        }

        .textAreaShell::before {
          z-index: 2;
        }

        .textAreaShell::after {
          z-index: 3;
        }

        .textAreaShell textarea {
          position: relative;
          z-index: 1;
        }

        .burnRunes {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 6px;
          pointer-events: none;
          opacity: 0;
          font-size: clamp(0.74rem, 1.2vw, 1rem);
          letter-spacing: 0.22em;
          color: rgba(239, 170, 132, 0.78);
          text-shadow: 0 0 6px rgba(255, 108, 54, 0.38), 0 0 10px rgba(168, 40, 24, 0.3);
          mix-blend-mode: screen;
          white-space: nowrap;
        }

        .burnRunes span:nth-child(2) {
          opacity: 0.84;
        }

        .textAreaShell.burning::before {
          background:
            radial-gradient(ellipse at 16% 100%, rgba(226, 130, 86, 0.24), transparent 46%),
            radial-gradient(ellipse at 46% 100%, rgba(192, 74, 46, 0.28), transparent 44%),
            radial-gradient(ellipse at 76% 100%, rgba(238, 144, 98, 0.22), transparent 46%),
            radial-gradient(ellipse at 50% 96%, rgba(255, 210, 176, 0.18), rgba(255, 210, 176, 0) 55%);
          animation: ashRise 0.95s ease-out forwards;
        }

        .textAreaShell.burning::after {
          background:
            radial-gradient(ellipse at 28% 100%, rgba(56, 22, 18, 0.34), transparent 58%),
            radial-gradient(ellipse at 72% 100%, rgba(44, 18, 16, 0.28), transparent 56%),
            linear-gradient(180deg, rgba(30, 14, 12, 0) 0%, rgba(42, 18, 16, 0.44) 56%, rgba(18, 8, 8, 0.74) 100%);
          animation: ashWipe 0.95s ease-out forwards;
        }

        .textAreaShell.burning .burnRunes {
          animation: runeIgnition 0.95s ease-out forwards;
        }

        .textAreaShell.burning textarea {
          animation: ashTextDissolve 0.95s ease-out forwards;
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

        textarea:disabled,
        select:disabled {
          opacity: 0.58;
          cursor: not-allowed;
        }

        .inkSpread {
          animation: inkSpreadReveal 0.65s ease-out;
        }

        .burnButton {
          justify-self: center;
          padding: 7px 10px;
          font-size: 0.72rem;
          letter-spacing: 0.11em;
          background: linear-gradient(180deg, rgba(56, 12, 12, 0.95), rgba(24, 6, 6, 0.95));
          border-color: rgba(130, 30, 30, 0.9);
        }

        .field {
          display: grid;
          gap: 8px;
          width: 100%;
        }

        .runeStepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .runeControl,
        .runeValue {
          border: 1px solid #5d1a1a;
          background: rgba(14, 14, 14, 0.86);
          color: #f0e6dd;
          min-width: 42px;
          height: 38px;
          padding: 0 12px;
          font-size: 0.96rem;
          cursor: pointer;
          box-shadow:
            0 8px 18px rgba(0, 0, 0, 0.42),
            0 1px 0 rgba(0, 0, 0, 0.45),
            0 0 10px rgba(128, 24, 24, 0.2);
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

        .runeControl:disabled,
        .runeValue:disabled {
          opacity: 0.52;
          cursor: not-allowed;
          box-shadow: none;
        }

        .ritualBar {
          display: flex;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          width: 100%;
        }

        .ritualStep {
          padding: 6px 10px;
          font-size: 0.74rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid rgba(93, 26, 26, 0.9);
          color: #cfb9aa;
          background: rgba(12, 12, 12, 0.78);
          box-shadow:
            0 7px 16px rgba(0, 0, 0, 0.38),
            0 0 10px rgba(120, 22, 22, 0.18);
        }

        .shrineIcon {
          display: inline-block;
          margin-right: 6px;
          opacity: 0.48;
          transform: translateY(-0.5px);
          text-shadow: none;
          transition: opacity 0.22s ease, text-shadow 0.22s ease;
        }

        .ritualBar.idle .ritualStep {
          animation: chipWhisper 3.6s ease-in-out infinite;
        }

        .ritualStep.active {
          color: #f8e6d7;
          border-color: #ab3333;
          background: linear-gradient(180deg, rgba(94, 18, 18, 0.86), rgba(31, 8, 8, 0.9));
          box-shadow: 0 0 10px rgba(171, 37, 37, 0.35);
          animation: ritualPulse 2.8s ease-in-out infinite;
        }

        .ritualStep.active .shrineIcon {
          opacity: 1;
          text-shadow: 0 0 8px rgba(234, 102, 102, 0.7), 0 0 14px rgba(177, 46, 46, 0.55);
        }

        label {
          font-size: 0.95rem;
          letter-spacing: 0.05em;
          color: #d0bfb2;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(120, 18, 18, 0.35);
          text-align: center;
        }

        button {
          border: 1px solid #992a2a;
          background: linear-gradient(180deg, rgba(52, 9, 9, 0.95) 0%, rgba(20, 4, 4, 0.95) 100%);
          color: #f6ece2;
          padding: 12px 16px;
          font-size: 0.98rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
          box-shadow:
            0 12px 24px rgba(0, 0, 0, 0.52),
            0 2px 0 rgba(0, 0, 0, 0.5),
            0 0 14px rgba(144, 26, 26, 0.26);
        }

        .mainGenerate {
          width: 100%;
        }

        button:hover {
          background: linear-gradient(180deg, #4a0f0f 0%, #1c0707 100%);
        }

        .mainGenerate:hover {
          text-shadow:
            -0.55px 0 rgba(255, 70, 70, 0.55),
            0.55px 0 rgba(110, 170, 255, 0.4);
          filter: saturate(1.06);
        }

        button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
          filter: saturate(0.8);
        }

        .completionFlash {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
          opacity: 0;
          background:
            radial-gradient(circle at center, rgba(255, 120, 120, 0.26) 0%, rgba(180, 22, 22, 0.08) 34%, transparent 64%),
            linear-gradient(180deg, rgba(255, 218, 218, 0.08), transparent 22%);
        }

        .completionFlash.active {
          animation: completionFlashPulse 0.55s ease-out;
        }

        @keyframes fogDriftA {
          0% {
            transform: translateX(-2.5%) translateY(0);
          }
          50% {
            transform: translateX(2.5%) translateY(-1.6%);
          }
          100% {
            transform: translateX(-2.5%) translateY(0);
          }
        }

        @keyframes fogDriftB {
          0% {
            transform: translateX(2.2%) translateY(0.8%);
          }
          50% {
            transform: translateX(-2.2%) translateY(-0.8%);
          }
          100% {
            transform: translateX(2.2%) translateY(0.8%);
          }
        }

        @keyframes emberRise {
          0% {
            transform: translate3d(0, 0, 0) scale(0.85);
            opacity: 0;
          }
          15% {
            opacity: 0.58;
          }
          100% {
            transform: translate3d(var(--ember-drift), -54vh, 0) scale(0.35);
            opacity: 0;
          }
        }

        @keyframes sigilSway {
          0%,
          100% {
            transform: translate(-50%, -50%) rotate(-0.28deg);
          }
          50% {
            transform: translate(-50%, -50%) rotate(0.28deg);
          }
        }

        @keyframes breathFog {
          0% {
            transform: translate(-50%, 0) scale(0.7);
            opacity: 0;
          }
          18% {
            opacity: 0.34;
          }
          100% {
            transform: translate(calc(-50% + 6px), -95px) scale(1.6);
            opacity: 0;
          }
        }

        @keyframes mouthPulse {
          0%,
          100% {
            transform: scaleY(1);
            opacity: 0.92;
          }
          50% {
            transform: scaleY(1.05);
            opacity: 0.72;
          }
        }

        @keyframes ritualPulse {
          0%,
          100% {
            box-shadow: 0 0 8px rgba(171, 37, 37, 0.3);
          }
          50% {
            box-shadow: 0 0 14px rgba(196, 50, 50, 0.48);
          }
        }

        @keyframes hellfirePulse {
          0%,
          100% {
            opacity: 0.66;
            filter: blur(14px) brightness(0.95);
          }
          50% {
            opacity: 0.78;
            filter: blur(14px) brightness(1.1);
          }
        }

        @keyframes grainDrift {
          0% {
            background-position: 0 0, 0 0;
          }
          50% {
            background-position: 16px -12px, -14px 10px;
          }
          100% {
            background-position: 0 0, 0 0;
          }
        }

        @keyframes blackoutBlink {
          0%,
          92%,
          100% {
            opacity: 0;
          }
          93.2% {
            opacity: 0.06;
          }
          93.8% {
            opacity: 0.02;
          }
          94.4% {
            opacity: 0.08;
          }
          95% {
            opacity: 0;
          }
        }

        @keyframes completionFlashPulse {
          0% {
            opacity: 0;
          }
          28% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes candleFlicker {
          0%,
          100% {
            filter: brightness(1);
          }
          18% {
            filter: brightness(0.97);
          }
          42% {
            filter: brightness(1.03);
          }
          67% {
            filter: brightness(0.985);
          }
        }

        @keyframes runeCircleSpin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes chipWhisper {
          0%,
          100% {
            opacity: 0.62;
          }
          50% {
            opacity: 0.9;
          }
        }

        @keyframes inkSpreadReveal {
          0% {
            box-shadow: 0 0 0 0 rgba(150, 30, 30, 0.5), inset 0 0 22px rgba(130, 24, 24, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(150, 30, 30, 0), inset 0 0 0 rgba(130, 24, 24, 0);
          }
        }

        @keyframes ashTextDissolve {
          0% {
            filter: none;
            opacity: 1;
            transform: translateY(0);
          }
          42% {
            filter: contrast(0.85) brightness(0.86);
            opacity: 0.64;
            transform: translateY(-2px);
          }
          75% {
            filter: contrast(0.72) brightness(0.72) blur(0.4px);
            opacity: 0.24;
            transform: translateY(-6px);
          }
          100% {
            filter: contrast(0.6) brightness(0.62) blur(0.7px);
            opacity: 0;
            transform: translateY(-12px);
          }
        }

        @keyframes ashWipe {
          0% {
            opacity: 0;
            transform: translateY(0);
            clip-path: polygon(0 100%, 8% 97%, 16% 100%, 24% 96%, 32% 100%, 40% 96%, 48% 100%, 56% 97%, 64% 100%, 72% 96%, 80% 100%, 88% 97%, 96% 100%, 100% 96%, 100% 100%, 0 100%);
          }
          34% {
            opacity: 0.84;
          }
          100% {
            opacity: 0;
            transform: translateY(-22px);
            clip-path: polygon(0 58%, 8% 52%, 16% 60%, 24% 48%, 32% 58%, 40% 50%, 48% 57%, 56% 49%, 64% 58%, 72% 51%, 80% 59%, 88% 53%, 96% 60%, 100% 54%, 100% 100%, 0 100%);
          }
        }

        @keyframes ashRise {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          28% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-26px) scale(1.08);
          }
        }

        @keyframes runeIgnition {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.94);
            filter: blur(1.2px) brightness(0.9);
          }
          22% {
            opacity: 0.96;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1.1);
          }
          68% {
            opacity: 0.62;
            transform: translateY(-6px) scale(1.02);
            filter: blur(0.35px) brightness(0.98);
          }
          100% {
            opacity: 0;
            transform: translateY(-14px) scale(0.98);
            filter: blur(1px) brightness(0.72);
          }
        }

      `}</style>
    </>
  );
}