"use client";
import HeaderBanner from "./HeaderBanner";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";

export default function HeaderRegion() {
  const { isConnected } = useAccount();
  return (
    <div style={{ width: "100%" }}>
      <HeaderBanner />
      {isConnected && (
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", margin: 0, padding: "6px 12px" }}>
          <Wallet />
        </div>
      )}
    </div>
  );
}
