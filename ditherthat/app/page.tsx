"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
// import { useQuickAuth } from "@coinbase/onchainkit/minikit";
import styles from "./page.module.css";
import {
  ditherBayer,
  ditherFloydSteinberg,
  ditherBlueNoise,
  ditherSimple2D,
  ditherJJN,
  ditherAtkinson,
  ditherRiemersma,
} from "@/lib/wasm/ditherLoader";

export default function Home() {
  // If you need to verify the user's identity, you can use the useQuickAuth hook.
  // This hook will verify the user's signature and return the user's FID. You can update
  // this to meet your needs. See the /app/api/auth/route.ts file for more details.
  // Note: If you don't need to verify the user's identity, you can get their FID and other user data
  // via `useMiniKit().context?.user`.
  // const { data, isLoading, error } = useQuickAuth<{
  //   userFid: string;
  // }>("/api/auth");

  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const { isConnected } = useAccount();
  // Hooks must not be conditional: declare all up-front
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Algorithm choices: Bayer and Blue as separate ordered options; diffusion variants; Riemersma optional
  type Algo = "bayer" | "blue" | "simple" | "floyd" | "jjn" | "atkinson" | "riemersma";
  const [algo, setAlgo] = useState<Algo>("bayer");
  const [level, setLevel] = useState<number>(1);
  const [invert, setInvert] = useState<boolean>(false);
  const [blueSize, setBlueSize] = useState<number>(64);
  const [rlength, setRLength] = useState<number>(32);
  const [rdecay, setRDecay] = useState<number>(0.1667);
  const [srcImage, setSrcImage] = useState<ImageData | null>(null);

  const doDither = useCallback(async (src: ImageData) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    // ensure canvas matches the source dimensions before drawing
    if (canvas.width !== src.width || canvas.height !== src.height) {
      canvas.width = src.width;
      canvas.height = src.height;
    }
  let out: ImageData = src;
    if (algo === "bayer") {
      out = await ditherBayer(src, { level: Math.max(0, Math.min(5, level|0)), invert });
    } else if (algo === "blue") {
      out = await ditherBlueNoise(src, blueSize);
    } else if (algo === "floyd") {
      out = await ditherFloydSteinberg(src);
    } else if (algo === "simple") {
      out = await ditherSimple2D(src);
    } else if (algo === "jjn") {
      out = await ditherJJN(src);
    } else if (algo === "atkinson") {
      out = await ditherAtkinson(src);
    } else if (algo === "riemersma") {
      out = await ditherRiemersma(src, Math.max(8, Math.min(256, rlength|0)), Math.max(0.05, Math.min(0.9, rdecay)));
    }
    ctx.putImageData(out, 0, 0);
  }, [algo, invert, level, blueSize, rlength, rdecay]);
  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);
  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const bmp = await createImageBitmap(file);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");
      // Fit within viewport width with simple scale
      const maxW = Math.min(800, Math.max(320, window.innerWidth - 32));
      const scale = Math.min(1, maxW / bmp.width);
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
      const src = ctx.getImageData(0, 0, w, h);
      setSrcImage(src);
      await doDither(src);
    } catch (err: unknown) {
      console.error(err);
      setError("Dithering failed. Did you build the WASM? Run npm run wasm:build.");
    } finally {
      e.currentTarget.value = "";
    }
  }, [doDither]);

  // Recompute when algorithm settings change and we have a source image
  useEffect(() => {
    if (!srcImage) return;
    (async () => {
      try {
        await doDither(srcImage);
      } catch (err) {
        console.error(err);
        setError("Recompute failed. Try another image or rebuild WASM.");
      }
    })();
  }, [algo, level, invert, blueSize, rlength, rdecay, srcImage, doDither]);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  // If not connected, show only a centered Connect Wallet button (Coinbase Smart Wallet only via provider config)
  if (!isConnected) {
    return (
      <main className={styles.container}>
        <div className={styles.content}>
          <Wallet />
        </div>
      </main>
    );
  }

  // Connected: keep Wallet visible and center a single "Take Photo" button
  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Wallet />
      </header>

      <div className={styles.content}>
        <form onSubmit={(e) => e.preventDefault()} className="stack" style={{ textAlign: "center" }}>
          <label>
            Algorithm:
            <select value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
              <option value="bayer">Bayer (ordered)</option>
              <option value="blue">Blue noise (ordered)</option>
              <option value="simple">Simple 2D diffusion</option>
              <option value="floyd">Floyd–Steinberg</option>
              <option value="jjn">Jarvis–Judice–Ninke (JJN)</option>
              <option value="atkinson">Atkinson</option>
              <option value="riemersma">Riemersma (Hilbert)</option>
            </select>
          </label>
          {algo === "bayer" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "center" }}>
              <label>
                Level (0–5):
                <input type="number" min={0} max={5} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
              </label>
              <label>
                <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
                Invert
              </label>
            </div>
          )}
          {algo === "blue" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "center" }}>
              <label>
                Map size:
                <select value={blueSize} onChange={(e) => setBlueSize(Number(e.target.value))}>
                  <option value={32}>32×32</option>
                  <option value={64}>64×64</option>
                  <option value={128}>128×128</option>
                </select>
              </label>
            </div>
          )}
          {algo === "riemersma" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "center" }}>
              <label>
                List length:
                <input type="number" min={8} max={256} value={rlength} onChange={(e) => setRLength(Number(e.target.value))} />
              </label>
              <label>
                r (decay):
                <input type="number" min={0.05} max={0.9} step={0.01} value={rdecay} onChange={(e) => setRDecay(Number(e.target.value))} />
              </label>
            </div>
          )}
        </form>
        <button type="button" onClick={onPick}>Take Photo</button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          style={{ display: "none" }}
        />
        {error && <p role="alert">{error}</p>}
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
