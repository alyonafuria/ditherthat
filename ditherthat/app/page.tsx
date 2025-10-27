"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
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

function ConnectedApp() {
  // If you need to verify the user's identity, you can use the useQuickAuth hook.
  // This hook will verify the user's signature and return the user's FID. You can update
  // this to meet your needs. See the /app/api/auth/route.ts file for more details.
  // Note: If you don't need to verify the user's identity, you can get their FID and other user data
  // via `useMiniKit().context?.user`.
  // const { data, isLoading, error } = useQuickAuth<{
  //   userFid: string;
  // }>("/api/auth");

  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
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
  const [resolutionMax, setResolutionMax] = useState<number>(1920);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [origBitmap, setOrigBitmap] = useState<ImageBitmap | null>(null);

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

  // Live recompute of srcImage when resolution changes, using the original bitmap
  useEffect(() => {
    if (!origBitmap) return;
    (async () => {
      try {
        const bmp = origBitmap;
        const tmp = document.createElement("canvas");
        const longest = Math.max(bmp.width, bmp.height);
        const scale = Math.min(1, (resolutionMax as number) / longest);
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
      } catch (err) {
        console.error(err);
        setError("Rescale failed. Try another image.");
      }
    })();
  }, [resolutionMax, origBitmap]);
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
      setOrigBitmap(bmp);
      // Use an offscreen canvas to prepare ImageData before the visible canvas mounts
  const tmp = document.createElement("canvas");
  // Scale by longest side, capped at user-selected resolutionMax, independent of device width
      const longest = Math.max(bmp.width, bmp.height);
      const scale = Math.min(1, (resolutionMax as number) / longest);
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
  }, [resolutionMax /* doDither not needed here; effect handles it */]);

  // Set a sensible default resolution based on device width (client-only)
  useEffect(() => {
    const w = window.innerWidth;
    let def = 1920;
    if (w < 400) def = 800;
    else if (w < 800) def = 1280;
    else if (w < 1400) def = 1920;
    else def = 2560;
    setResolutionMax(def);
    // Decide if we should show the camera button (mobile/tablet or coarse pointer)
    const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const smallScreen = w < 900;
    setShowCamera(isCoarse || smallScreen);
    const onResize = () => {
      const ww = window.innerWidth;
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      setShowCamera(coarse || ww < 900);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {!srcImage ? (
          // Center the two action buttons in the middle of the screen until an image is chosen
          <div className="centerScreen">
            <div style={{ display: "grid", gridTemplateColumns: showCamera ? "1fr 1fr" : "1fr", gap: 8, width: "100%", maxWidth: 360 }}>
              {showCamera && (
                <button type="button" onClick={onTakePhoto} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Take Photo</button>
              )}
              <button type="button" onClick={onUploadPicture} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Upload a Picture</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: showCamera ? "1fr 1fr" : "1fr", gap: 8, width: "100%", maxWidth: 520, margin: "0 auto 1rem" }}>
            {showCamera && (
              <button type="button" onClick={onTakePhoto} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Take Photo</button>
            )}
            <button type="button" onClick={onUploadPicture} style={{ width: "100%", padding: "0.5rem", fontSize: 14 }}>Upload a Picture</button>
          </div>
        )}

        {srcImage && (
          <>
            <div className="mediaWrap">
              <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
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
              resolutionMax={resolutionMax}
              setResolutionMax={setResolutionMax}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 520, margin: "1rem auto 0", paddingBottom: "6vh" }}>
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

export default function Home() {
  return <ConnectedApp />;
}
