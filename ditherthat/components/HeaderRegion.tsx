"use client";
import HeaderBanner from "./HeaderBanner";
import { Wallet } from "@coinbase/onchainkit/wallet";

export default function HeaderRegion() {
  return (
    <div style={{ width: "100%" }}>
      <HeaderBanner />
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", margin: 0, padding: "6px 12px" }}>
        <Wallet />
      </div>
    </div>
  );
}
