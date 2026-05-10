# RAW tuner tool (`/tools/raw-tuner`)

In-browser RAW photo editor that auto-tunes exposure, curves, black/white levels, white balance and
HSL using a deterministic heuristics baseline plus a CLIP-based preset retrieval bank. Runs entirely
on the user's GPU, no API calls, no server-side compute. Slots into the existing takken.io tools
index.

## Locked design decisions

- **Intelligence**: heuristics baseline always runs. CLIP preset retrieval over a curated text-only
  preset bank as the "Suggest looks" mode. No hosted VLM, no Worker proxy.
- **Formats**: full `libraw-wasm` (~600 formats supported under the hood). UI markets the big five
  (CR2/CR3, NEF, ARW, RAF, DNG) but accepts whatever libraw can decode. Also accepts JPEG/PNG so
  phone shooters aren't excluded.
- **Output**: JPEG + Lightroom-compatible `.xmp` sidecar. No 16-bit TIFF in v1.
- **Hosting**: lives inside Docusaurus at `/tools/raw-tuner`. Lazy `import()` for libraw-wasm + CLIP
  so other pages stay lean. OPFS for model caching across visits.
- **No images in the repo**: presets are text-only YAML. CLIP text embeddings precomputed at build
  time on Webber's machine into `presets.json`. Reference photos (if used during preset tuning) live
  outside the repo.

## Architecture (domain-driven, all under `src/components/tools/RawTuner/`)

```
RawTuner/
├── index.tsx                    composition root
├── domain/
│   ├── slider-stack.ts          { exposure, contrast, highlights, shadows, whites,
│   │                              blacks, temp, tint, vibrance, saturation,
│   │                              curve_points[], hsl[8] }
│   ├── linear-image.ts          immutable wrapper { width, height, fp16: GPUBuffer | Float16Array }
│   └── histogram.ts             percentile + clip-detection primitives
├── decode/
│   ├── decode-raw.ts            libraw-wasm wrapper, lazy-loaded
│   ├── decode-jpeg.ts           browser-native ImageDecoder
│   └── decode.ts                dispatcher by mime/sniff
├── applier/
│   ├── webgpu/
│   │   ├── pipeline.ts          single compute shader: linear → sliders → display
│   │   ├── shader.wgsl          curves + HSL + WB + tone-map + black/white points
│   │   └── self-test.ts         known-input → known-output checksum at boot
│   └── cpu-fallback.ts          same maths in plain TS, used when WebGPU absent
├── heuristics/
│   ├── analyse.ts               percentiles, clip mask, grey-world WB, face-aware exposure
│   └── auto-tune.ts             analysis → SliderStack baseline
├── presets/
│   ├── presets.source.yaml      hand-edited source of truth
│   ├── presets.json             generated: { name, description, sliders, embedding[512] }[]
│   ├── retrieve.ts              cosine sim, MMR diversity, top-N
│   └── build/
│       └── embed-presets.ts     build-time Node script (run locally, output committed)
├── clip/
│   ├── load-clip.ts             transformers.js image encoder, OPFS-cached
│   └── embed-image.ts           image → Float32Array(512)
├── export/
│   ├── encode-jpeg.ts           OffscreenCanvas → JPEG blob
│   └── write-xmp.ts             slider stack → Lightroom-compatible XMP string
├── storage/
│   └── opfs-cache.ts            generic "fetch once, store, reuse" for model weights
└── ui/
    ├── DropZone.tsx
    ├── SliderStack.tsx
    ├── PresetGrid.tsx
    ├── HistogramView.tsx
    ├── ExportPanel.tsx
    └── ToolBody.tsx             stitches it all together
```

## Phases

Each phase ends with: vitest green for that phase, `oxlint` clean, `tsgo --noEmit` clean, `oxfmt`
clean. Lint and typecheck are gates, not afterthoughts.

### Phase 0 — slot-in scaffolding

- [x] 0.1 Add a tools-index row in `src/pages/tools/index.tsx`: name "RAW tuner", slug `raw-tuner`,
      description, `FaCamera` icon (or similar from `react-icons/fa6`).
- [x] 0.2 Create `src/pages/tools/raw-tuner/index.tsx` re-exporting from
      `src/components/tools/RawTuner`.
- [x] 0.3 Create `src/components/tools/RawTuner/index.tsx` with a `<ToolPage title="RAW tuner">`
      shell + placeholder body. Page renders, links from tools index work.
- [x] 0.4 Verify the `/blog` and `/tools/text-analyser` routes do **not** include any RAW-tuner code
      in their bundles. Run `yarn build`, inspect `build/assets/js/`, fail loudly if RawTuner chunks
      leak. Implemented as `tests/post-build/raw-tuner.isolation.test.ts`, runs as part of the
      post-build security-check.
- [x] 0.5 _Pre-existing infra fix._ `jsdom@29` (Dec 2025) and `whatwg-url@16` migrated to
      `@exodus/bytes` which is ESM-only, breaking vitest. Pinned `jsdom` to `^26` and renamed
      `vitest.config.ts` → `vitest.config.mts` to load via ESM.

### Phase 1 — domain types + heuristics (pure TS, no browser APIs)

TDD-first. Every function gets a `.spec.ts` next to it.

- [x] 1.1 `domain/slider-stack.ts` — `SliderStack` interface, `defaultSliderStack()`,
      `mergeSliderStacks(base, patch)`. Spec covers neutral defaults, patch composition,
      immutability.
- [x] 1.2 `domain/histogram.ts` + `domain/linear-image.ts` — `histogram(image, channel)`,
      `percentile(hist, p)`, `clipFractions(image)`, `meanLuma(image)`, `createLinearImage`. Spec
      uses synthetic constant + ramp images.
- [x] 1.3 `heuristics/analyse.ts` — pure analysis: returns
      `{ blackPoint, whitePoint, midGrey, wbTemp, wbTint, clippedHighlightsPct, clippedShadowsPct }`.
      Spec uses fixtures: underexposed, overexposed, neutral, colour-cast.
- [x] 1.4 `heuristics/auto-tune.ts` — `analysis → SliderStack`. Encodes the rules
      (`exposure = log2(0.18 / midGrey)` clamped to ±3 EV, highlight-clip backoff, blacks/whites
      stretch toward sensor extremes, grey-world WB delta). Spec asserts plausible slider ranges.
- [x] 1.5 `applier/cpu-fallback.ts` — `applyOnCpu(image, sliders): Uint8ClampedArray` for sRGB
      output, plus `applyLinear` (Float32 linear-light intermediate) and `encodeSrgb`. Pure TS, no
      GPU. Spec covers identity, exposure scaling, white-balance, blacks crush, whites lift,
      contrast spread, tone curve, saturation, alpha pass-through, sRGB clamp.
- [x] 1.6 Round-trip spec: synthetic ramp → analyse → auto-tune → apply produces histogram with no
      clipping and midpoint near 0.18; warm cast is reduced; auto-tune is near-idempotent.
- [x] **100% line coverage** on every Phase 1 file (verified via `coverage/lcov.info`).

### Phase 2 — RAW decode

- [x] 2.1 Add `libraw-wasm` to deps. Lazy `await import('libraw-wasm')` only inside
      `decode/decode-raw.ts`. Verified via build inspection that it doesn't appear in the main chunk
      (currently not in any chunk — nothing references `decode/` from the UI yet; Phase 7 hookup
      will surface it as its own chunk and the isolation post-build test will catch leaks).
- [x] 2.2 `decode/decode-raw.ts` — accepts `ArrayBuffer`, returns
      `{ image: LinearImage, metadata: { cameraMake, cameraModel, iso, shutter, aperture, raw } }`.
      libraw set to `outputColor: 1` (sRGB primaries), `outputBps: 16`, `gamm: [1, 1]` (linear
      gamma), `useCameraWb: true`. Spec uses a `vi.mock`'d `libraw-wasm` to drive the conversion +
      validation paths in jsdom; real-format smoke is reserved for Phase 9.
- [x] 2.3 `decode/decode-jpeg.ts` — `decodeJpeg(buffer, { bytesDecoder })` injects the browser-side
      bytes decoder (default = `ImageDecoder` with an `<img>` + `OffscreenCanvas` fallback) so the
      conversion logic is unit-testable in jsdom. `decodeSrgbByte` + LUT-backed `srgbBytesToLinear`
      exposed for direct testing; round-trip with `encodeSrgb` covered.
- [x] 2.4 `decode/decode.ts` — `sniffFormat(name, buffer)` checks extension first then magic bytes
      (JPEG / PNG / WebP / TIFF-LE / TIFF-BE / ISOBMFF ftyp). `decode({ name, buffer })` dispatches.
      Unknown formats throw with the file name in the message.
- [x] **100% line coverage** on every Phase 2 file.

### Phase 3 — WebGPU applier

- [ ] 3.1 `applier/webgpu/shader.wgsl` — single compute shader implementing the full slider chain in
      linear fp16: WB → exposure → curve (parametric, 4 control points) →
      black/white/highlights/shadows → HSL → tone-map → 8-bit sRGB output. WGSL unit-testable via
      the WebGPU shader-test harness or by running it once with known inputs and asserting the
      output buffer.
- [ ] 3.2 `applier/webgpu/pipeline.ts` — wraps adapter request, pipeline creation, buffer
      allocation. Single entry: `applyOnGpu(linearImage, sliders): Promise<Uint8ClampedArray>`. Spec
      is a happy-path render of a 16×16 image.
- [ ] 3.3 `applier/webgpu/self-test.ts` — runs the full pipeline on a 4×4 known input at boot,
      compares output to a hardcoded expected buffer. If checksum fails, log and switch to CPU
      fallback (the shader works on most GPUs but Intel iGPUs occasionally produce wrong output
      silently — see `~/Repositories/wiki/docs/webgpu/`).
- [ ] 3.4 `applier/index.ts` — public `apply(image, sliders)` that picks GPU or CPU based on probe +
      self-test result. Spec asserts: same inputs produce visually equivalent outputs across paths
      (PSNR > 45 dB).
- [ ] 3.5 Pre-warm: dispatch a 1×1 dummy compute on first mount so the user's first real apply isn't
      a 200–2000ms shader compile. Spec asserts the pre-warm runs exactly once per session.

### Phase 4 — OPFS model cache + CLIP

- [ ] 4.1 `storage/opfs-cache.ts` — `getOrFetch(url, key): Promise<ArrayBuffer>`. Reads from
      `OPFS://raw-tuner/<key>`, falls back to `fetch(url)`, writes back. Spec uses
      `navigator.storage` mocks.
- [ ] 4.2 Add `@huggingface/transformers` to deps (lazy-imported inside `clip/`).
- [ ] 4.3 `clip/load-clip.ts` — loads CLIP ViT-B/32 image encoder via transformers.js, weights
      routed through OPFS cache. Returns a singleton encoder. Spec mocks the model load, asserts
      second call hits cache.
- [ ] 4.4 `clip/embed-image.ts` — `embed(imageData): Float32Array(512)`. Spec uses a fixed test
      image + a known-good golden vector (committed) to detect drift.
- [ ] 4.5 First-load UX: progress bar tied to OPFS cache fetch. Spec asserts the progress events
      reach 100% and the panel transitions to "ready".

### Phase 5 — preset bank

- [ ] 5.1 `presets/presets.source.yaml` — define ~30 starter presets across diverse moods (editorial
      portrait, airy pastel, moody film, cinematic teal-orange, natural daylight, high-key b&w,
      vintage, golden-hour landscape, etc.). Each entry: `name`, `description` (rich,
      CLIP-friendly), `sliders`. No images.
- [ ] 5.2 `presets/build/embed-presets.ts` — Node script: reads YAML, runs CLIP text encoder via
      transformers.js, writes `presets.json` with `{ ...preset, embedding: number[512] }`. Add
      `yarn build:presets` script. Spec covers YAML parse + a tiny mock encoder.
- [ ] 5.3 Run the build locally, commit `presets.json`. Document in tool README that `presets.json`
      is generated; CI doesn't regenerate.
- [ ] 5.4 `presets/retrieve.ts` — `topN(imageEmbedding, presets, n=5)` with cosine similarity + MMR
      diversity penalty. Spec covers: identical-image returns identical-mood preset first; diversity
      penalty surfaces visually different picks.

### Phase 6 — export

- [ ] 6.1 `export/encode-jpeg.ts` — `Uint8ClampedArray + dimensions → Blob` via
      `OffscreenCanvas.convertToBlob({ type: 'image/jpeg', quality })`. Spec asserts non-zero blob,
      correct mime, decodable round-trip.
- [ ] 6.2 `export/write-xmp.ts` — `SliderStack → string` producing Lightroom-compatible XMP.
      Reference: Adobe's XMP namespace for `crs:Exposure2012`, `crs:Contrast2012`,
      `crs:ToneCurvePV2012`, etc. Spec includes a golden XMP fixture and a round-trip parse to
      assert valid XML.
- [ ] 6.3 Tool UI: "Export JPEG" + "Export `.xmp` sidecar" buttons trigger downloads with sensible
      filenames (`<original-stem>.jpg`, `<original-stem>.xmp`).

### Phase 7 — UI

- [ ] 7.1 `ui/DropZone.tsx` — drag/drop + click-to-pick. Spec uses `@testing-library/react` for both
      interactions, asserts `onFile` callback with the right MIME.
- [ ] 7.2 `ui/HistogramView.tsx` — RGB histogram canvas, ~120px tall. Spec checks render at fixed
      canvas size matches a golden bytestring.
- [ ] 7.3 `ui/SliderStack.tsx` — every slider in `SliderStack` as a labelled range input. Two-way
      bound to controller state. Reset button. Spec covers value editing and reset.
- [ ] 7.4 `ui/PresetGrid.tsx` — 5 thumbnails from CLIP retrieval + "Auto" + "Original". Click swaps
      the active slider stack. Spec covers selection state, keyboard nav (arrow keys + Enter),
      accessible labels (WCAG 2.2 AA contrast verified).
- [ ] 7.5 `ui/ExportPanel.tsx` — quality slider, JPEG + XMP buttons, file-size estimate. Spec covers
      all controls.
- [ ] 7.6 `ui/ToolBody.tsx` — composition: drop zone → preview canvas + sliders + presets +
      histogram + export. Spec asserts the high-level happy path (drop file → see preview → click
      preset → preview updates).

### Phase 8 — performance + polish

- [ ] 8.1 Memory ceiling: on full-res apply, allocate fp16 GPU buffers only; never decode to fp32 on
      CPU. Add a runtime check that bails gracefully on >50 MP images on mobile (browser memory
      cap).
- [ ] 8.2 Debounce slider edits to GPU dispatch (max 60fps on the preview canvas). Spec uses fake
      timers.
- [ ] 8.3 Preview at 1024px while editing, full-res only on export. Two `LinearImage` instances;
      both apply the same `SliderStack`.
- [ ] 8.4 Cold-start measurement: log time-to-first-preview from drop event. Acceptance target:
      <1.5s on a warm OPFS cache, <30s on cold (CLIP download dominates).
- [ ] 8.5 Accessibility audit: keyboard-only walkthrough (drop is hidden behind a real
      `<input type="file">`), focus rings, semantic labels on every slider, contrast check on
      histogram + preset grid borders.
- [ ] 8.6 Self-test telemetry: if WebGPU self-test fails, surface a small banner ("Using CPU
      fallback — exports will be slower"). Don't silently degrade.

### Phase 9 — ship

- [ ] 9.1 `yarn check` clean (test + lint + format + typecheck).
- [ ] 9.2 `yarn build` clean. Verify `/blog` and other tool chunks have **zero** RawTuner code.
- [ ] 9.3 Manual smoke on Chrome + Safari (desktop) and Chrome (Android): drop a CR2, drop a NEF,
      drop an iPhone HEIC/JPEG. Verify auto-tune is plausible, two presets, JPEG export opens
      correctly, XMP imports into Lightroom and shows the same edits.
- [ ] 9.4 Add the tool to the homepage "Latest tools" surface if one exists (check
      `src/components/Home/index.tsx`).
- [ ] 9.5 Blog post optional: "How I built an in-browser RAW tuner with WebGPU + CLIP". Defer unless
      asked.

## Test rigour

- All tests use `.spec.ts(x)`, vitest, behaviour-focused names (`it('handles X')`).
- Fixture RAWs live in `src/components/tools/RawTuner/__fixtures__/` if license-clean, otherwise
  gitignored and documented.
- No tests >200ms — heavy decode/CLIP operations stay in manual smoke, not the unit suite.
- Golden vectors (CLIP embedding of a fixed test image, expected XMP output) committed; drift = test
  fail.

## Open questions to resolve before Phase 1

- [ ] Q1 Source of starter presets — adapt from a free-licensed pack, or hand-write 30? (Hand-write
      is faster + zero license risk.)
- [ ] Q2 Camera baseline / DCP profiles — libraw applies a default colour matrix; do we need DCP
      support in v1 for accurate "neutral starting point" across brands? (Defer; libraw's defaults
      are good enough for v1.)
- [ ] Q3 Include HEIC support? Modern iPhones default to HEIC, browsers don't decode it natively.
      (Defer; require user converts to JPEG, or add as a Phase 8 nice-to-have via a HEIC WASM
      decoder.)

## Decisions log (append as we go)

- 2026-05-10: full libraw-wasm shipped under the hood (~2MB extra over a stripped build, not worth
  the build-pipeline tax).
- 2026-05-10: text-only preset bank with build-time CLIP text embeddings; no preset images in the
  repo.
- 2026-05-10: lives inside Docusaurus with lazy imports; subdomain split deferred until/unless
  bundle leakage proves it necessary.
