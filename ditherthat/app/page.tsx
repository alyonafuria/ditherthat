"use client";
import { useEffect, useRef, useCallback } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
// import { useQuickAuth } from "@coinbase/onchainkit/minikit";
import styles from "./page.module.css";

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);
  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: wire into dithering flow
    e.currentTarget.value = "";
  }, []);

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
      </div>
    </div>
  );
}
