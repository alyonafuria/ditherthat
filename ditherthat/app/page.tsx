"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
// import { useQuickAuth } from "@coinbase/onchainkit/minikit";
import styles from "./page.module.css";
import { ditherBayer } from "@/lib/wasm/ditherLoader";

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
      const out = await ditherBayer(src, { level: 1, invert: false }); // start with Bayer Level 1
      ctx.putImageData(out, 0, 0);
    } catch (err: any) {
      console.error(err);
      setError("Dithering failed. Did you build the WASM? Run npm run wasm:build.");
    } finally {
      e.currentTarget.value = "";
    }
  }, []);

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
