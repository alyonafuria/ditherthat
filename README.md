# DitherThat

A tiny, fast web app to turn photos into beautiful black‑and‑white dithered art. Runs fully in your browser using WebAssembly — nothing is uploaded or stored on our servers.

## What it does
- **Upload or take a photo** and instantly see a dithered version.
- **Multiple algorithms** (Bayer, Blue Noise, Floyd–Steinberg, Atkinson, JJN, Simple 2D, Riemersma) with tweakable settings.
- **Responsive by default**: full‑width display on small screens, centered on large screens.
- **Resolution control**: choose processing resolution (480–2560 px longest side). Changes re‑compute live.
- **Optional wallet** (header, non‑blocking) via Coinbase OnchainKit; the app works with or without connecting.

## Privacy
- **We do not store your data.**
- Processing happens **entirely client‑side** in your browser using WebAssembly. Images never leave your device.

## How photos are processed (WASM)
- The app decodes your image and builds an offscreen canvas.
- We scale by the selected resolution (longest side) and convert to `ImageData`.
- A set of **WebAssembly** routines perform the dithering.
- The processed pixels are drawn to a visible `<canvas>` for preview and can be saved as PNG.

## Roadmap
- **Base Mini app**: ship as a Farcaster/Frames‑compatible Base mini app.
- **Minting**: export and mint your dithered artwork directly from the app.
- **NFT remixing on Base**: browse/ingest NFTs on Base and mint dithered variants — aiming to become basically "Photoshop for NFTs".

## Tech stack
- **Next.js (App Router)**, TypeScript, CSS modules.
- **WebAssembly** dithering core (loaded from `lib/wasm`).
- **Coinbase OnchainKit** for wallet (non‑blocking, optional).

## Local development
```bash
# from repo root
cd ditherthat
npm i
npm run dev
# visit http://localhost:3000 (or the port printed by Next)
```

## Production build
```bash
npm run build
npm run start
```

## Environment variables
Create `.env` in `ditherthat/`:
```ini
# Used for canonical URLs, OG tags, sitemap/robots, etc.
NEXT_PUBLIC_SITE_URL=https://your-domain.example

# Optional: OnchainKit (for wallet/minikit features). The app works without it.
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here
```

## SEO
- `app/layout.tsx` defines enhanced **Open Graph**, **Twitter**, **robots**, and canonical metadata.
- Set `NEXT_PUBLIC_SITE_URL` for correct absolute URLs.

## Usage tips
- On mobile (or coarse pointers), you’ll see both **Take Photo** and **Upload**.
- On desktop, you’ll see **Upload** by default.
- Use the **Resolution** control to balance quality and speed.
- Use **Download as PNG** to save your result.

---
Made with love for pixels. 
