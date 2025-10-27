#include <stdint.h>
#include <stdlib.h>
#include <math.h>

// ---- sRGB <-> linear helpers ----
static inline float srgb_to_linear(float srgb) {
  if (srgb <= 0.04045f) return srgb / 12.92f;
  return powf((srgb + 0.055f) / 1.055f, 2.4f);
}

static inline float clamp01(float v) {
  if (v < 0.0f) return 0.0f;
  if (v > 1.0f) return 1.0f;
  return v;
}

// ---- Bayer matrix generation ----
// Level n => size = 2^(n+1)
static void bayer_generate(int level, int *out, int size) {
  // base 2x2
  // [0 2]
  // [3 1]
  out[0] = 0; out[1] = 2; out[2] = 3; out[3] = 1;
  int curSize = 2;
  int add;
  for (int l = 0; l < level; ++l) {
    add = curSize * curSize;
    for (int y = curSize - 1; y >= 0; --y) {
      for (int x = curSize - 1; x >= 0; --x) {
        int v = out[y * curSize + x];
        int nx = x * 2;
        int ny = y * 2;
        out[ny * (curSize * 2) + nx] = 4 * v + 0;
        out[ny * (curSize * 2) + (nx + 1)] = 4 * v + 2;
        out[(ny + 1) * (curSize * 2) + nx] = 4 * v + 3;
        out[(ny + 1) * (curSize * 2) + (nx + 1)] = 4 * v + 1;
      }
    }
    curSize *= 2;
  }
  // Normalize in-place to 0..1 into integer scale (we'll divide later)
  // nothing to do here; we'll divide by (size*size) later when sampling
}

static inline float bayer_threshold_at(const int *bm, int size, int x, int y) {
  int xx = x % size;
  int yy = y % size;
  int v = bm[yy * size + xx];
  float denom = (float)(size * size);
  return (v + 0.5f) / denom; // +0.5 to center thresholds
}

// ---- Dither: Bayer ordered ----
// src: RGBA8888 input; out: RGBA8888 output
// level: 0 => 2x2, 1 => 4x4, ...; invert: 0 normal, 1 inverted threshold usage
void dither_bayer(uint8_t *src, int width, int height, int level, int invert, uint8_t *out) {
  if (level < 0) level = 0;
  if (level > 5) level = 5; // up to 64x64
  int size = 1 << (level + 1);
  int *bm = (int *)malloc(sizeof(int) * size * size);
  bayer_generate(level, bm, size);

  int n = width * height;
  for (int i = 0; i < n; ++i) {
    int x = i % width;
    int y = i / width;
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    // convert to linear luminance 0..1
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    float lum = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);

    float th = bayer_threshold_at(bm, size, x, y);
    if (invert) th = 1.0f - th;

    int on = lum > th ? 255 : 0;
    out[i * 4 + 0] = on;
    out[i * 4 + 1] = on;
    out[i * 4 + 2] = on;
    out[i * 4 + 3] = 255;
  }
  free(bm);
}

// Future: stubs for other algorithms to keep ABI stable
static inline uint32_t wang_hash(uint32_t x) {
  x = (x ^ 61u) ^ (x >> 16);
  x = x + (x << 3);
  x = x ^ (x >> 4);
  x = x * 0x27d4eb2dU;
  x = x ^ (x >> 15);
  return x;
}

void dither_floyd_steinberg(uint8_t *src, int width, int height, uint8_t *out) {
  int n = width * height;
  float *buf = (float *)malloc(sizeof(float) * n);
  if (!buf) return;
  // Prepare luminance buffer (linear)
  for (int i = 0; i < n; ++i) {
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    buf[i] = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
  }

  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      int idx = y * width + x;
      float old = buf[idx];
      int on = old > 0.5f ? 1 : 0;
      float newv = (float)on;
      float err = old - newv;
      // Write output now
      uint8_t v = on ? 255 : 0;
      out[idx * 4 + 0] = v;
      out[idx * 4 + 1] = v;
      out[idx * 4 + 2] = v;
      out[idx * 4 + 3] = 255;
      // Distribute error (Floyd-Steinberg)
      // x+1, y    : 7/16
      // x-1, y+1  : 3/16
      // x,   y+1  : 5/16
      // x+1, y+1  : 1/16
      if (x + 1 < width) buf[idx + 1] = clamp01(buf[idx + 1] + err * (7.0f / 16.0f));
      if (y + 1 < height) {
        int ny = y + 1;
        int base = ny * width;
        if (x > 0) buf[base + (x - 1)] = clamp01(buf[base + (x - 1)] + err * (3.0f / 16.0f));
        buf[base + x] = clamp01(buf[base + x] + err * (5.0f / 16.0f));
        if (x + 1 < width) buf[base + (x + 1)] = clamp01(buf[base + (x + 1)] + err * (1.0f / 16.0f));
      }
    }
  }
  free(buf);
}

// --- Simple 2D error diffusion (0.5 right, 0.5 down)
void dither_simple2d(uint8_t *src, int width, int height, uint8_t *out) {
  int n = width * height;
  float *buf = (float *)malloc(sizeof(float) * n);
  if (!buf) return;
  for (int i = 0; i < n; ++i) {
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    buf[i] = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
  }
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      int idx = y * width + x;
      float old = buf[idx];
      int on = old > 0.5f ? 1 : 0;
      float newv = (float)on;
      float err = old - newv;
      uint8_t v = on ? 255 : 0;
      out[idx * 4 + 0] = v;
      out[idx * 4 + 1] = v;
      out[idx * 4 + 2] = v;
      out[idx * 4 + 3] = 255;
      if (x + 1 < width) buf[idx + 1] = clamp01(buf[idx + 1] + err * 0.5f);
      if (y + 1 < height) buf[idx + width] = clamp01(buf[idx + width] + err * 0.5f);
    }
  }
  free(buf);
}

// --- Jarvis-Judice-Ninke (JJN) error diffusion
void dither_jjn(uint8_t *src, int width, int height, uint8_t *out) {
  int n = width * height;
  float *buf = (float *)malloc(sizeof(float) * n);
  if (!buf) return;
  for (int i = 0; i < n; ++i) {
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    buf[i] = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
  }
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      int idx = y * width + x;
      float old = buf[idx];
      int on = old > 0.5f ? 1 : 0;
      float newv = (float)on;
      float err = old - newv;
      uint8_t v = on ? 255 : 0;
      out[idx * 4 + 0] = v;
      out[idx * 4 + 1] = v;
      out[idx * 4 + 2] = v;
      out[idx * 4 + 3] = 255;
      // distribute (1/48)
      if (x + 1 < width) buf[idx + 1] = clamp01(buf[idx + 1] + err * (7.0f/48.0f));
      if (x + 2 < width) buf[idx + 2] = clamp01(buf[idx + 2] + err * (5.0f/48.0f));
      if (y + 1 < height) {
        int base = (y + 1) * width;
        if (x - 2 >= 0) buf[base + (x - 2)] = clamp01(buf[base + (x - 2)] + err * (3.0f/48.0f));
        if (x - 1 >= 0) buf[base + (x - 1)] = clamp01(buf[base + (x - 1)] + err * (5.0f/48.0f));
        buf[base + x] = clamp01(buf[base + x] + err * (7.0f/48.0f));
        if (x + 1 < width) buf[base + (x + 1)] = clamp01(buf[base + (x + 1)] + err * (5.0f/48.0f));
        if (x + 2 < width) buf[base + (x + 2)] = clamp01(buf[base + (x + 2)] + err * (3.0f/48.0f));
      }
      if (y + 2 < height) {
        int base = (y + 2) * width;
        if (x - 2 >= 0) buf[base + (x - 2)] = clamp01(buf[base + (x - 2)] + err * (1.0f/48.0f));
        if (x - 1 >= 0) buf[base + (x - 1)] = clamp01(buf[base + (x - 1)] + err * (3.0f/48.0f));
        buf[base + x] = clamp01(buf[base + x] + err * (5.0f/48.0f));
        if (x + 1 < width) buf[base + (x + 1)] = clamp01(buf[base + (x + 1)] + err * (3.0f/48.0f));
        if (x + 2 < width) buf[base + (x + 2)] = clamp01(buf[base + (x + 2)] + err * (1.0f/48.0f));
      }
    }
  }
  free(buf);
}

// --- Atkinson error diffusion (Apple)
void dither_atkinson(uint8_t *src, int width, int height, uint8_t *out) {
  int n = width * height;
  float *buf = (float *)malloc(sizeof(float) * n);
  if (!buf) return;
  for (int i = 0; i < n; ++i) {
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    buf[i] = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
  }
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      int idx = y * width + x;
      float old = buf[idx];
      int on = old > 0.5f ? 1 : 0;
      float newv = (float)on;
      float err = old - newv;
      uint8_t v = on ? 255 : 0;
      out[idx * 4 + 0] = v;
      out[idx * 4 + 1] = v;
      out[idx * 4 + 2] = v;
      out[idx * 4 + 3] = 255;
      float f = err / 8.0f; // 1/8 per neighbor, 6 neighbors used
      if (x + 1 < width) buf[idx + 1] = clamp01(buf[idx + 1] + f);
      if (x + 2 < width) buf[idx + 2] = clamp01(buf[idx + 2] + f);
      if (y + 1 < height) {
        int base = (y + 1) * width;
        if (x - 1 >= 0) buf[base + (x - 1)] = clamp01(buf[base + (x - 1)] + f);
        buf[base + x] = clamp01(buf[base + x] + f);
        if (x + 1 < width) buf[base + (x + 1)] = clamp01(buf[base + (x + 1)] + f);
      }
      if (y + 2 < height) {
        int base = (y + 2) * width;
        buf[base + x] = clamp01(buf[base + x] + f);
      }
    }
  }
  free(buf);
}

// --- Blue noise threshold map via void-and-cluster on torus (separable Gaussian) ---
static int bn_ready = 0;
static int bn_N = 0;
static float *bn_map = 0; // threshold in [0,1]

static void gaussian_kernel_1d(float *k, int radius, float sigma) {
  int size = 2 * radius + 1;
  float sum = 0.0f;
  for (int i = -radius; i <= radius; ++i) {
    float v = expf(-(i * i) / (2.0f * sigma * sigma));
    k[i + radius] = v;
    sum += v;
  }
  for (int i = 0; i < size; ++i) k[i] /= sum;
}

static void convolve_separable_wrap(const float *in, float *tmp, float *out, int N, const float *k, int radius) {
  int size = 2 * radius + 1;
  // horizontal
  for (int y = 0; y < N; ++y) {
    for (int x = 0; x < N; ++x) {
      float acc = 0.0f;
      for (int t = -radius; t <= radius; ++t) {
        int xx = (x + t + N) % N;
        acc += in[y * N + xx] * k[t + radius];
      }
      tmp[y * N + x] = acc;
    }
  }
  // vertical
  for (int y = 0; y < N; ++y) {
    for (int x = 0; x < N; ++x) {
      float acc = 0.0f;
      for (int t = -radius; t <= radius; ++t) {
        int yy = (y + t + N) % N;
        acc += tmp[yy * N + x] * k[t + radius];
      }
      out[y * N + x] = acc;
    }
  }
}

static void bn_generate_if_needed(int size) {
  if (size <= 0) size = 64;
  if (bn_ready && bn_N == size && bn_map) return;
  if (bn_map) { free(bn_map); bn_map = 0; }
  bn_N = size;
  int N = bn_N;
  int total = N * N;
  float *P = (float *)malloc(sizeof(float) * total);
  float *tmp = (float *)malloc(sizeof(float) * total);
  float *B = (float *)malloc(sizeof(float) * total);
  bn_map = (float *)malloc(sizeof(float) * total);
  if (!P || !tmp || !B || !bn_map) {
    // fallback thresholds
    for (int i = 0; i < total; ++i) bn_map[i] = (float)i / (float)total;
    if (P) free(P); if (tmp) free(tmp); if (B) free(B);
    bn_ready = 1; return;
  }
  // init random half-filled pattern
  for (int i = 0; i < total; ++i) {
    uint32_t h = wang_hash(1234567u + (uint32_t)i);
    P[i] = (h & 1u) ? 1.0f : 0.0f;
  }
  // separable Gaussian
  int radius = 3; // kernel size 7
  float G[7];
  gaussian_kernel_1d(G, radius, 1.5f);

  // Cluster removal phase: remove ON pixels one-by-one, ranking from highest values
  int ones = 0; for (int i = 0; i < total; ++i) if (P[i] > 0.5f) ones++;
  int k = total - 1;
  while (ones > 0) {
    convolve_separable_wrap(P, tmp, B, N, G, radius);
    // find ON with max blur
    int best = -1; float bestv = -1e9f;
    for (int i = 0; i < total; ++i) {
      if (P[i] > 0.5f) {
        float v = B[i];
        // tie-breaker by hash for stability
        if (v > bestv || (v == bestv && (wang_hash((uint32_t)i) & 1u))) { bestv = v; best = i; }
      }
    }
    if (best < 0) break;
    bn_map[best] = (float)k / (float)total;
    P[best] = 0.0f;
    ones--;
    --k;
  }

  // Void addition phase: add OFF pixels one-by-one, filling remaining ranks
  while (k >= 0) {
    convolve_separable_wrap(P, tmp, B, N, G, radius);
    // find OFF with min blur
    int best = -1; float bestv = 1e9f;
    for (int i = 0; i < total; ++i) {
      if (P[i] < 0.5f) {
        float v = B[i];
        if (v < bestv || (v == bestv && (wang_hash((uint32_t)i) & 1u))) { bestv = v; best = i; }
      }
    }
    if (best < 0) break;
    bn_map[best] = (float)k / (float)total;
    P[best] = 1.0f;
    --k;
  }

  free(P); free(tmp); free(B);
  bn_ready = 1;
}

void dither_blue_noise_sz(uint8_t *src, int width, int height, int size, uint8_t *out) {
  bn_generate_if_needed(size);
  int N = bn_N;
  int n = width * height;
  for (int i = 0; i < n; ++i) {
    int x = i % width;
    int y = i / width;
    uint8_t r = src[i * 4 + 0];
    uint8_t g = src[i * 4 + 1];
    uint8_t b = src[i * 4 + 2];
    float fr = srgb_to_linear((float)r / 255.0f);
    float fg = srgb_to_linear((float)g / 255.0f);
    float fb = srgb_to_linear((float)b / 255.0f);
    float lum = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
    float th = bn_map[(y % N) * N + (x % N)];
    int on = lum > th ? 255 : 0;
    out[i * 4 + 0] = on;
    out[i * 4 + 1] = on;
    out[i * 4 + 2] = on;
    out[i * 4 + 3] = 255;
  }
}

void dither_blue_noise(uint8_t *src, int width, int height, uint8_t *out) {
  dither_blue_noise_sz(src, width, height, 64, out);
}

// --- Riemersma dither (Hilbert traversal, finite error list) ---
static inline int next_pow2(int v) { int p = 1; while (p < v) p <<= 1; return p; }

// Standard Hilbert d2xy (from Wikipedia): size n must be power of two
static void rot(int s, int *x, int *y, int rx, int ry) {
  if (ry == 0) {
    if (rx == 1) {
      *x = s - 1 - *x;
      *y = s - 1 - *y;
    }
    int t = *x; *x = *y; *y = t;
  }
}

static void hilbert_index_to_xy(int n, unsigned int d, int *x, int *y) {
  int rx, ry;
  int t = (int)d;
  *x = 0; *y = 0;
  for (int s = 1; s < n; s <<= 1) {
    rx = 1 & (t / 2);
    ry = 1 & (t ^ rx);
    rot(s, x, y, rx, ry);
    *x += s * rx;
    *y += s * ry;
    t /= 4;
  }
}

void dither_riemersma(uint8_t *src, int width, int height, int listLen, float r, uint8_t *out) {
  if (listLen < 8) listLen = 8;
  if (listLen > 256) listLen = 256;
  if (r <= 0.0f) r = 0.125f;
  if (r >= 1.0f) r = 0.99f;

  int npx = width * height;
  float *lum = (float *)malloc(sizeof(float) * npx);
  float *errors = (float *)calloc(listLen, sizeof(float));
  if (!lum || !errors) { if (lum) free(lum); if (errors) free(errors); return; }
  for (int i = 0; i < npx; ++i) {
    uint8_t rr = src[i * 4 + 0];
    uint8_t gg = src[i * 4 + 1];
    uint8_t bb = src[i * 4 + 2];
    float fr = srgb_to_linear((float)rr / 255.0f);
    float fg = srgb_to_linear((float)gg / 255.0f);
    float fb = srgb_to_linear((float)bb / 255.0f);
    lum[i] = clamp01(0.2126f * fr + 0.7152f * fg + 0.0722f * fb);
  }
  // precompute weights so w[0]=1 (newest), w[listLen-1]=r (oldest)
  float *w = (float *)malloc(sizeof(float) * listLen);
  for (int j = 0; j < listLen; ++j) {
    float t = (listLen == 1) ? 0.0f : ((float)j / (float)(listLen - 1));
    // weights from 1.0 (newest) to r (oldest), exponential falloff
    w[j] = powf(r, t);
  }

  int N = next_pow2(width > height ? width : height);
  unsigned int total = (unsigned int)N * (unsigned int)N;
  int head = -1; int count = 0;
  for (unsigned int idx = 0; idx < total; ++idx) {
    int x, y; hilbert_index_to_xy(N, idx, &x, &y);
    if (x >= width || y >= height) continue;
    int i = y * width + x;
    float v = lum[i];
    // apply past errors (normalized by current weight sum; do not clamp before quantization)
    if (count > 0) {
      float acc = 0.0f;
      float sumw = 0.0f;
      for (int j = 0; j < count; ++j) {
        int pos = head - j; if (pos < 0) pos += listLen;
        acc += errors[pos] * w[j];
        sumw += w[j];
      }
      if (sumw > 1e-8f) v += acc / sumw; else v += acc;
    }
    int on = v > 0.5f ? 1 : 0;
    float newv = (float)on;
    float err = v - newv;
    // push err
    head = (head + 1) % listLen;
    errors[head] = err;
    if (count < listLen) count++;
    uint8_t outv = on ? 255 : 0;
    out[i * 4 + 0] = outv;
    out[i * 4 + 1] = outv;
    out[i * 4 + 2] = outv;
    out[i * 4 + 3] = 255;
  }
  free(lum); free(errors); free(w);
}
