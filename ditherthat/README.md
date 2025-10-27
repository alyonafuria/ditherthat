# ditherthat

Minimal on-chain miniapp skeleton with a brutalist look and WASM-powered dithering.

## WebAssembly dithering (C → WASM)

We implement ordered dithering starting with Bayer matrices in C and compile to WebAssembly with Emscripten.

### Build prerequisites

- Emscripten SDK (emcc) installed and activated
	- https://emscripten.org/docs/getting_started/downloads.html
	- After installing: `emcc -v` should work in your terminal

### Build the module

```sh
npm run wasm:build
```

This produces a single self-contained file: `public/wasm/dither.js` (the WebAssembly binary is embedded via SINGLE_FILE).

### How it’s used

- The page loads the module via `lib/wasm/ditherLoader.ts` and calls `_dither_bayer` on picked images.
- Start the dev server and test:

```sh
npm run dev
```

### Algorithm support

- Ordered dithering using threshold maps:
	- Bayer matrices (levels 0..5) with optional inversion
	- Blue-noise threshold map (tiled, toroidal farthest-point sampling)
- Error diffusion:
	- Simple 2D
	- Floyd–Steinberg
	- Jarvis–Judice–Ninke (JJN)
	- Atkinson
	- Riemersma (Hilbert traversal, finite error list)

## UI behavior

- Not connected: single centered Coinbase Smart Wallet connect button (Smart Wallet only).
- Connected: Wallet remains in header; page shows a single centered “Take Photo” button. After taking/choosing a photo, the result is dithered and rendered on a canvas.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).


## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


## Learn More

To learn more about OnchainKit, see our [documentation](https://docs.base.org/onchainkit).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).
