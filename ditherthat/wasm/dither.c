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
void dither_white_noise(uint8_t *src, int width, int height, uint32_t seed, uint8_t *out) {
  // TODO
}
void dither_blue_noise(uint8_t *src, int width, int height, uint8_t *out) {
  // TODO
}
void dither_floyd_steinberg(uint8_t *src, int width, int height, uint8_t *out) {
  // TODO
}
