// Simple loader for the Emscripten-built module placed under /wasm/dither.js
// Exposes a set of functions that accept ImageData and return new ImageData

interface DitherModule {
  _malloc(n: number): number;
  _free(p: number): void;
  HEAPU8: Uint8Array;
  _dither_bayer(srcPtr: number, w: number, h: number, level: number, invert: number, dstPtr: number): void;
  _dither_floyd_steinberg(srcPtr: number, w: number, h: number, dstPtr: number): void;
  _dither_blue_noise(srcPtr: number, w: number, h: number, dstPtr: number): void;
  _dither_blue_noise_sz?(srcPtr: number, w: number, h: number, size: number, dstPtr: number): void;
  _dither_simple2d(srcPtr: number, w: number, h: number, dstPtr: number): void;
  _dither_jjn(srcPtr: number, w: number, h: number, dstPtr: number): void;
  _dither_atkinson(srcPtr: number, w: number, h: number, dstPtr: number): void;
  _dither_riemersma(srcPtr: number, w: number, h: number, listLen: number, r: number, dstPtr: number): void;
}

type DitherFactory = (opts: { locateFile: (path: string) => string }) => Promise<DitherModule>;

let initPromise: Promise<DitherModule> | null = null;

export type DitherOptions = { level: number; invert?: boolean };

export async function initDither(): Promise<DitherModule> {
  if (!initPromise) {
    // Load from /public at runtime; avoid bundler resolution
    const base = (typeof location !== "undefined" && location.origin) ? location.origin : "";
    const url = `${base}/wasm/dither.js`;
    initPromise = import(/* webpackIgnore: true */ url).then((mod: unknown) => {
      const maybe = mod as { default?: unknown };
      const factory = (maybe?.default ?? mod) as DitherFactory;
      // Ensure the wasm sidecar is found
      return factory({
        locateFile: (path: string) => `/wasm/${path}`,
      });
    });
  }
  return initPromise;
}

export async function ditherBayer(imageData: ImageData, opts: DitherOptions): Promise<ImageData> {
  const Module = await initDither();
  const { width, height, data } = imageData;

  const srcSize = data.length;
  const dstSize = width * height * 4;

  const srcPtr = Module._malloc(srcSize);
  const dstPtr = Module._malloc(dstSize);
  try {
    Module.HEAPU8.set(data, srcPtr);
    Module._dither_bayer(srcPtr, width, height, opts.level|0, opts.invert ? 1 : 0, dstPtr);
    const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
    return new ImageData(out, width, height);
  } finally {
    Module._free(srcPtr);
    Module._free(dstPtr);
  }
}

export async function ditherFloydSteinberg(imageData: ImageData): Promise<ImageData> {
  const Module = await initDither();
  const { width, height, data } = imageData;
  const srcSize = data.length;
  const dstSize = width * height * 4;
  const srcPtr = Module._malloc(srcSize);
  const dstPtr = Module._malloc(dstSize);
  try {
    Module.HEAPU8.set(data, srcPtr);
    Module._dither_floyd_steinberg(srcPtr, width, height, dstPtr);
    const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
    return new ImageData(out, width, height);
  } finally {
    Module._free(srcPtr);
    Module._free(dstPtr);
  }
}

  export async function ditherBlueNoise(imageData: ImageData, size: number = 64): Promise<ImageData> {
    const Module = await initDither();
    const { width, height, data } = imageData;
    const srcSize = data.length;
    const dstSize = width * height * 4;
    const srcPtr = Module._malloc(srcSize);
    const dstPtr = Module._malloc(dstSize);
    try {
      Module.HEAPU8.set(data, srcPtr);
      if (typeof Module._dither_blue_noise_sz === 'function') {
        Module._dither_blue_noise_sz(srcPtr, width, height, size|0, dstPtr);
      } else {
        Module._dither_blue_noise(srcPtr, width, height, dstPtr);
      }
      const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
      return new ImageData(out, width, height);
    } finally {
      Module._free(srcPtr);
      Module._free(dstPtr);
    }
  }

  export async function ditherSimple2D(imageData: ImageData): Promise<ImageData> {
    const Module = await initDither();
    const { width, height, data } = imageData;
    const srcSize = data.length;
    const dstSize = width * height * 4;
    const srcPtr = Module._malloc(srcSize);
    const dstPtr = Module._malloc(dstSize);
    try {
      Module.HEAPU8.set(data, srcPtr);
      Module._dither_simple2d(srcPtr, width, height, dstPtr);
      const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
      return new ImageData(out, width, height);
    } finally {
      Module._free(srcPtr);
      Module._free(dstPtr);
    }
  }

  export async function ditherJJN(imageData: ImageData): Promise<ImageData> {
    const Module = await initDither();
    const { width, height, data } = imageData;
    const srcSize = data.length;
    const dstSize = width * height * 4;
    const srcPtr = Module._malloc(srcSize);
    const dstPtr = Module._malloc(dstSize);
    try {
      Module.HEAPU8.set(data, srcPtr);
      Module._dither_jjn(srcPtr, width, height, dstPtr);
      const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
      return new ImageData(out, width, height);
    } finally {
      Module._free(srcPtr);
      Module._free(dstPtr);
    }
  }

  export async function ditherAtkinson(imageData: ImageData): Promise<ImageData> {
    const Module = await initDither();
    const { width, height, data } = imageData;
    const srcSize = data.length;
    const dstSize = width * height * 4;
    const srcPtr = Module._malloc(srcSize);
    const dstPtr = Module._malloc(dstSize);
    try {
      Module.HEAPU8.set(data, srcPtr);
      Module._dither_atkinson(srcPtr, width, height, dstPtr);
      const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
      return new ImageData(out, width, height);
    } finally {
      Module._free(srcPtr);
      Module._free(dstPtr);
    }
  }
  export async function ditherRiemersma(imageData: ImageData, listLen = 32, r = 0.125): Promise<ImageData> {
    const Module = await initDither();
    const { width, height, data } = imageData;
    const srcSize = data.length;
    const dstSize = width * height * 4;
    const srcPtr = Module._malloc(srcSize);
    const dstPtr = Module._malloc(dstSize);
    try {
      Module.HEAPU8.set(data, srcPtr);
      Module._dither_riemersma(srcPtr, width, height, listLen, r, dstPtr);
      const out = new Uint8ClampedArray(Module.HEAPU8.subarray(dstPtr, dstPtr + dstSize));
      return new ImageData(out, width, height);
    } finally {
      Module._free(srcPtr);
      Module._free(dstPtr);
    }
  }
 
