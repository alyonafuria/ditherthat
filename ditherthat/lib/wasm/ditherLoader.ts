// Simple loader for the Emscripten-built module placed under /wasm/dither.js
// Exposes a ditherBayer function that accepts ImageData and returns new ImageData

let initPromise: Promise<any> | null = null;

export type DitherOptions = {
  level: number; // 0..5
  invert?: boolean;
};

export async function initDither(): Promise<any> {
  if (!initPromise) {
    // Load from /public at runtime; avoid bundler resolution
    const base = (typeof location !== "undefined" && location.origin) ? location.origin : "";
    const url = `${base}/wasm/dither.js`;
    initPromise = import(/* webpackIgnore: true */ url).then((mod: any) => {
      const factory = mod?.default ?? mod;
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
