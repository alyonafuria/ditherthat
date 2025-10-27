"use client";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "@/components/ui/icons";

export type Algo = "bayer" | "blue" | "simple" | "floyd" | "jjn" | "atkinson" | "riemersma";

type Props = {
  algo: Algo;
  setAlgo: React.Dispatch<React.SetStateAction<Algo>>;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  invert: boolean;
  setInvert: React.Dispatch<React.SetStateAction<boolean>>;
  blueSize: number;
  setBlueSize: React.Dispatch<React.SetStateAction<number>>;
  rlength: number;
  setRLength: React.Dispatch<React.SetStateAction<number>>;
  rdecay: number;
  setRDecay: React.Dispatch<React.SetStateAction<number>>;
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  // Fixed label column and fixed help column to ensure perfect alignment across rows
  gridTemplateColumns: "120px 1fr 40px",
  alignItems: "center",
  gap: 8,
  width: "100%",
  maxWidth: 520,
  margin: "0 auto",
};

const labelStyle: React.CSSProperties = {
  width: 120,
  // Keep labels from wrapping oddly on small screens
  whiteSpace: "nowrap",
};

const inputStyle: React.CSSProperties = {
  height: 40,
  padding: "6px 10px",
  border: "2px solid #111",
  background: "#fff",
  color: "#111",
  fontSize: 14,
  width: "100%",
};

const rangeContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
};

const rangeStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  accentColor: "#fff",
};

const valueBadge: React.CSSProperties = {
  border: "2px solid #111",
  background: "#fff",
  color: "#111",
  height: 40,
  padding: "0 8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 56,
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
};

const smallBtn: React.CSSProperties = {
  fontSize: 12,
  padding: 0,
  lineHeight: 1,
  border: "2px solid #111",
  background: "#fff",
  color: "#111",
  boxSizing: "border-box",
  width: 40,
  height: 40,
  minWidth: 40,
  minHeight: 40,
  maxWidth: 40,
  maxHeight: 40,
  flex: "0 0 40px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ALGO_DESCRIPTIONS: Record<Algo, { title: string; desc: string }> = {
  bayer: {
    title: "Bayer (ordered)",
    desc: "Ordered dithering using a Bayer matrix. Produces a neat halftone pattern. ‘Level’ controls dot granularity (higher = finer).",
  },
  blue: {
    title: "Blue noise (ordered)",
    desc: "Uses a blue‑noise threshold map for an organic grain with fewer patterns. Bigger ‘Map size’ reduces visible tiling.",
  },
  simple: {
    title: "Simple 2D diffusion",
    desc: "Fast, basic error diffusion. Pushes error to nearby pixels for a rough stippled look.",
  },
  floyd: {
    title: "Floyd–Steinberg",
    desc: "Classic error diffusion with balanced, natural noise.",
  },
  jjn: {
    title: "Jarvis–Judice–Ninke (JJN)",
    desc: "Spreads error wider for smoother gradients and a slightly softer look.",
  },
  atkinson: {
    title: "Atkinson",
    desc: "Mac-classic diffusion. Lighter, airier patterns with a touch less contrast.",
  },
  riemersma: {
    title: "Riemersma (Hilbert)",
    desc: "Diffuses along a Hilbert path using past pixels with decay for smooth, coherent texture.",
  },
};

export function PictureSettings({
  algo,
  setAlgo,
  level,
  setLevel,
  invert,
  setInvert,
  blueSize,
  setBlueSize,
  rlength,
  setRLength,
  rdecay,
  setRDecay,
}: Props) {
  const [showAlgoHelp, setShowAlgoHelp] = React.useState(false);
  const [showBayerHelp, setShowBayerHelp] = React.useState(false);
  const [showBlueHelp, setShowBlueHelp] = React.useState(false);
  const [showRiemersmaHelp, setShowRiemersmaHelp] = React.useState(false);
  const [showRDecayHelp, setShowRDecayHelp] = React.useState(false);

  // Auto-collapse all help panels when algorithm changes
  React.useEffect(() => {
    setShowAlgoHelp(false);
    setShowBayerHelp(false);
    setShowBlueHelp(false);
    setShowRiemersmaHelp(false);
    setShowRDecayHelp(false);
  }, [algo]);

  return (
  <div style={{ textAlign: "center", marginTop: "1rem", width: "100%" }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Algorithm:</label>
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value as Algo)}
          style={inputStyle}
        >
          <option value="bayer">Bayer (ordered)</option>
          <option value="blue">Blue noise (ordered)</option>
          <option value="simple">Simple 2D diffusion</option>
          <option value="floyd">Floyd–Steinberg</option>
          <option value="jjn">Jarvis–Judice–Ninke (JJN)</option>
          <option value="atkinson">Atkinson</option>
          <option value="riemersma">Riemersma (Hilbert)</option>
        </select>
        <button
          type="button"
          aria-label="What does this algorithm do?"
          onClick={() => setShowAlgoHelp((v) => !v)}
          style={smallBtn}
        >
          ?
        </button>
      </div>
      {showAlgoHelp && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Alert>
            <InfoIcon width={18} height={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div>
              <AlertTitle>{ALGO_DESCRIPTIONS[algo].title}</AlertTitle>
              <AlertDescription>{ALGO_DESCRIPTIONS[algo].desc}</AlertDescription>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowAlgoHelp(false)}
              style={{ ...smallBtn, marginLeft: "auto" }}
            >
              ×
            </button>
          </Alert>
        </div>
      )}

      {algo === "bayer" && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Level (0–5):</label>
            <div style={rangeContainer}>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="rangeSlim"
                style={rangeStyle}
                aria-label="Bayer level"
              />
              <div style={valueBadge}>{level}</div>
            </div>
            <button
              type="button"
              aria-label="What do these Bayer settings do?"
              onClick={() => setShowBayerHelp((v) => !v)}
              style={smallBtn}
            >
              ?
            </button>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Invert:</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 40 }}>
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                style={{ width: 32, height: 32, accentColor: "#fff" }}
              />
            </div>
            <div />
          </div>
        </>
      )}
      {algo === "bayer" && showBayerHelp && (
        <div style={{ maxWidth: 520, margin: "8px auto 0" }}>
          <Alert>
            <InfoIcon width={18} height={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div>
              <AlertTitle>Bayer settings</AlertTitle>
              <AlertDescription>
                Level controls dot granularity. Higher level = finer Bayer matrix (smaller, tighter dots). ‘Invert’ flips light/dark.
              </AlertDescription>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowBayerHelp(false)}
              style={{ ...smallBtn, marginLeft: "auto" }}
            >
              ×
            </button>
          </Alert>
        </div>
      )}

      {algo === "blue" && (
        <div style={rowStyle}>
          <label style={labelStyle}>Map size:</label>
          <select
            value={blueSize}
            onChange={(e) => setBlueSize(Number(e.target.value))}
            style={{ ...inputStyle, maxWidth: 160, justifySelf: "stretch" }}
          >
            <option value={32}>32×32</option>
            <option value={64}>64×64</option>
            <option value={128}>128×128</option>
          </select>
          <button
            type="button"
            aria-label="What does Blue noise map size do?"
            onClick={() => setShowBlueHelp((v) => !v)}
            style={smallBtn}
          >
            ?
          </button>
        </div>
      )}
      {algo === "blue" && showBlueHelp && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Alert>
            <InfoIcon width={18} height={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div>
              <AlertTitle>Blue noise map size</AlertTitle>
              <AlertDescription>
                Map size is the blue‑noise tile dimension. Bigger size reduces visible repetition and gives a more organic grain (slightly slower).
              </AlertDescription>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowBlueHelp(false)}
              style={{ ...smallBtn, marginLeft: "auto" }}
            >
              ×
            </button>
          </Alert>
        </div>
      )}

      {algo === "riemersma" && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>List length:</label>
            <div style={rangeContainer}>
              <input
                type="range"
                min={8}
                max={256}
                step={1}
                value={rlength}
                onChange={(e) => setRLength(Number(e.target.value))}
                className="rangeSlim"
                style={rangeStyle}
                aria-label="Riemersma list length"
              />
              <div style={valueBadge}>{rlength}</div>
            </div>
            <button
              type="button"
              aria-label="What do Riemersma settings do?"
              onClick={() => setShowRiemersmaHelp((v) => !v)}
              style={smallBtn}
            >
              ?
            </button>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>r (decay):</label>
            <div style={rangeContainer}>
              <input
                type="range"
                min={0.05}
                max={0.9}
                step={0.01}
                value={rdecay}
                onChange={(e) => setRDecay(Number(e.target.value))}
                className="rangeSlim"
                style={rangeStyle}
                aria-label="Riemersma decay r"
              />
              <div style={valueBadge}>{rdecay.toFixed(2)}</div>
            </div>
            <button
              type="button"
              aria-label="What does r (decay) do?"
              onClick={() => setShowRDecayHelp((v) => !v)}
              style={smallBtn}
            >
              ?
            </button>
          </div>
        </>
      )}
      {algo === "riemersma" && showRiemersmaHelp && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Alert>
            <InfoIcon width={18} height={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div>
              <AlertTitle>Riemersma settings</AlertTitle>
              <AlertDescription>
                Riemersma carries error along a Hilbert path.<br/>
                <strong>List length</strong>: how many past pixels contribute (more = smoother, softer). Use this to set the span of history considered.
              </AlertDescription>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowRiemersmaHelp(false)}
              style={{ ...smallBtn, marginLeft: "auto" }}
            >
              ×
            </button>
          </Alert>
        </div>
      )}
      {algo === "riemersma" && showRDecayHelp && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Alert>
            <InfoIcon width={18} height={18} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div>
              <AlertTitle>Decay r</AlertTitle>
              <AlertDescription>
                Controls how quickly older error fades. Each step k steps back is weighted by r^k (0 &lt; r &lt; 1). Higher r (e.g., 0.85) = slower fade and smoother, more persistent texture. Lower r (e.g., 0.55) = faster fade and a crisper, more contrasty but noisier look. Tips: try 0.70–0.85 for smooth gradients; 0.50–0.65 for sharper, grainier output.
              </AlertDescription>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowRDecayHelp(false)}
              style={{ ...smallBtn, marginLeft: "auto" }}
            >
              ×
            </button>
          </Alert>
        </div>
      )}
    </div>
  );
}
