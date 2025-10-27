"use client";
import * as React from "react";

const ASCII_ART = `░▒▓███████▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓███████▓▒░       ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░▒▓████████▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓████████▓▒░▒▓██████▓▒░ ░▒▓███████▓▒░          ░▒▓█▓▒░   ░▒▓████████▓▒░▒▓████████▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     
░▒▓███████▓▒░░▒▓█▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░     `;

const SEP = "  ";

export function HeaderBanner() {
  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--bg)",
        width: "100%",

        // Small top padding so marquee doesn't hug the very edge
        paddingTop: 6,
      }}
    >
      <div className="headerMarquee" aria-hidden={false}>
        <div
          className="headerMarqueeInner"
          style={{
            color: "#a855f7",
            fontSize: "clamp(8px, 2.2vw, 12px)",
            lineHeight: 1.3,
            fontFamily: 'var(--font-ascii-mono), "Courier New", "Lucida Console", Menlo, Monaco, Consolas, monospace',
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre", display: "inline-block", fontFamily: 'inherit' }}>{ASCII_ART}</pre>
          <span aria-hidden style={{ fontFamily: 'inherit', display: 'inline-block', padding: '0 1ch' }}>{SEP}</span>
          <pre style={{ margin: 0, whiteSpace: "pre", display: "inline-block", fontFamily: 'inherit' }}>{ASCII_ART}</pre>
          <span aria-hidden style={{ fontFamily: 'inherit', display: 'inline-block', padding: '0 1ch' }}>{SEP}</span>
          <pre style={{ margin: 0, whiteSpace: "pre", display: "inline-block", fontFamily: 'inherit' }}>{ASCII_ART}</pre>
          <span aria-hidden style={{ fontFamily: 'inherit', display: 'inline-block', padding: '0 1ch' }}>{SEP}</span>
          <pre style={{ margin: 0, whiteSpace: "pre", display: "inline-block", fontFamily: 'inherit' }}>{ASCII_ART}</pre>
        </div>
      </div>
    </header>
  );
}

export default HeaderBanner;
