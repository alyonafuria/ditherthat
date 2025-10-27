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
import { PictureSettings } from "../components/PictureSettings";

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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const onDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !srcImage) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "dither.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [srcImage]);

  const doDither = useCallback(async (src: ImageData) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    if (canvas.width !== src.width || canvas.height !== src.height) {
      canvas.width = src.width;
      canvas.height = src.height;
    }
    let out: ImageData = src;
    if (algo === "bayer") {
      out = await ditherBayer(src, { level: Math.max(0, Math.min(5, level | 0)), invert });
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
      out = await ditherRiemersma(
        src,
        Math.max(8, Math.min(256, (rlength as number) | 0)),
        Math.max(0.05, Math.min(0.9, rdecay as number))
      );
    }
    ctx.putImageData(out, 0, 0);
  }, [algo, invert, level, blueSize, rlength, rdecay]);
  const onTakePhoto = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);
  const onUploadPicture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const bmp = await createImageBitmap(file);
      // Use an offscreen canvas to prepare ImageData before the visible canvas mounts
  const tmp = document.createElement("canvas");
  const maxW = Math.min(800, Math.max(320, window.innerWidth - 32));
      const scale = Math.min(1, maxW / bmp.width);
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      if (!tctx) throw new Error("Canvas not supported");
      tctx.clearRect(0, 0, w, h);
      tctx.drawImage(bmp, 0, 0, w, h);
      const src = tctx.getImageData(0, 0, w, h);
      setSrcImage(src);
      // doDither will run from useEffect after canvas is mounted
    } catch (err: unknown) {
      console.error(err);
      setError("Dithering failed. Did you build the WASM? Run npm run wasm:build.");
    } finally {
      // Reset the input even if the element unmounts later
      inputEl.value = "";
    }
  }, [/* doDither not needed here; effect handles it */]);

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

  // Connected UI
  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Wallet />
      </header>

      <div className={styles.content}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 520, margin: "0 auto 1rem" }}>
          <button type="button" onClick={onTakePhoto} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Take Photo</button>
          <button type="button" onClick={onUploadPicture} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Upload a Picture</button>
        </div>

        {srcImage && (
          <>
            <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block", maxWidth: "100%" }} />
            <PictureSettings
              algo={algo}
              setAlgo={setAlgo}
              level={level}
              setLevel={setLevel}
              invert={invert}
              setInvert={setInvert}
              blueSize={blueSize}
              setBlueSize={setBlueSize}
              rlength={rlength}
              setRLength={setRLength}
              rdecay={rdecay}
              setRDecay={setRDecay}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 520, margin: "1rem auto 0" }}>
              <button type="button" onClick={onDownload} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Download as PNG</button>
              <button type="button" disabled style={{ width: "100%", padding: "0.5rem", fontSize: 14, opacity: 0.5, pointerEvents: "none" }}>Mint (TBA)</button>
            </div>
          </>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          style={{ display: "none" }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ display: "none" }}
        />
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
