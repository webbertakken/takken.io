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

- [x] 3.1 `applier/webgpu/shader.ts` — WGSL compute shader (kept as a TS string, since Docusaurus
      lacks a `?raw` loader) implementing the full slider chain in linear fp32: WB → exposure →
      whites/blacks → highlights/shadows → contrast → tone curve (piecewise linear, up to 16 points)
      → saturation/vibrance → sRGB encode. Order kept in lockstep with the CPU path so outputs match
      byte-for-byte.
- [x] 3.2 `applier/webgpu/pipeline.ts` — `requestWebGpuDevice()`, `createPipeline(device)`,
      `applyOnGpu(device, image, sliders, { pipelineCache? })`. Allocates input / output / slider /
      curve / staging buffers, dispatches `ceil(pixels / 64)` workgroups, reads back via
      `mapAsync` + clamps to 8-bit. WebGPU bitflag constants hard-coded so the wrapper runs in
      jsdom. Tested via a `FakeDevice` that records every call and lets tests inject synthetic
      readback dynamically.
- [x] 3.3 `applier/webgpu/self-test.ts` — 16-pixel fixture covering shadows / midtones / highlights
      / casts, exercises every slider including a 3-point curve. Tolerance:
      `SELF_TEST_TOLERANCE = 3` per channel. Returns `false` on length mismatch, tolerance breach,
      or a thrown dispatch.
- [x] 3.4 `applier/index.ts` — public `apply(image, sliders)`. Probes `navigator.gpu`, runs
      self-test, caches `decision: 'gpu' | 'cpu'` + a `GpuPipelineCache` for reuse. Concurrent
      first-call probes serialise on a shared `initialising` promise. A runtime GPU dispatch failure
      flips permanently to CPU (and warns). Tests cover: no-GPU, self-test fail, self-test pass +
      use, post-init dispatch failure, decision cache, concurrent probe, prewarm.
- [x] 3.5 `prewarmGpu()` — fires a 1×1 dispatch on first call to compile the pipeline; idempotent
      across sessions. Ready for `useEffect(() => prewarmGpu(), [])` in Phase 7.
- [x] **100% line coverage** on every Phase 3 file (incl. `FakeDevice` + WGSL string).

### Phase 4 — OPFS model cache + CLIP

- [x] 4.1 `storage/opfs-cache.ts` — `ObjectStore` interface + `createMemoryStore()` (in-memory) and
      `createOpfsStore(rootName)` (browser OPFS, v8-ignored — covered by Phase 9 manual smoke).
      `getOrFetch(url, key, { store, fetchImpl, onProgress })` streams responses chunk-by- chunk so
      the UI can show download progress.
- [x] 4.2 Added `@huggingface/transformers@^4.2.0`. Lazy-imported inside `clip/load-clip.ts` so
      other Docusaurus pages don't bundle it.
- [x] 4.3 `clip/load-clip.ts` —
      `loadClipImageEncoder({ modelId, device, onProgress,     pipelineFactory, rawImageCtor })`
      returns a `ClipImageEncoder` whose `embed(image)` produces a Float32Array(512). Both
      transformers.js entry points (`pipeline()` and `RawImage`) are injectable for tests;
      production path uses dynamic imports of the real lib.
- [x] 4.4 Embed function consolidated into the encoder returned by `loadClipImageEncoder`. The
      conversion `LinearImage → sRGB-encoded RGB Uint8ClampedArray` lives in
      `clip/raw-image-bridge.ts` and is round-trip-tested against `srgbBytesToLinear` from
      `decode/decode-jpeg.ts`. Embedding-dimensionality drift fails the test on every call.
- [x] 4.5 `clip/loading-progress.ts` — `createLoadingProgress()` aggregates per-file progress events
      from transformers.js, exposes `getProgress(): number`, `isReady(): boolean`, and
      `onChange(listener)`. Phase 7 wires this to a progress bar.
- [x] **100% line coverage** on every Phase 4 file (one async-await assignment v8-ignored — v8's
      statement tracking misreports it as uncovered, but the line is exercised by every test that
      calls `loadClipImageEncoder`).

### Phase 5 — preset bank

- [x] 5.1 `presets/presets.source.ts` — 30 starter presets across the mood spectrum (editorial, airy
      pastel, film noir, cinematic teal-orange, natural daylight, golden hour, blue hour,
      high/low-key b&w, vintage film, faded matte, romantic wedding, documentary, travel,
      Scandinavian, desert, foggy, urban, velvia, Polaroid, cyberpunk, matte black metal, soft skin
      beauty, crunchy street, pastel anime, misty mountain, coffee shop, sunset, forest). YAML
      dropped in favour of TS for type safety + zero parser dep.
- [x] 5.2 `presets/build/embed-presets.ts` — Node script. Drives transformers.js
      `CLIPTextModelWithProjection` directly (NOT the `feature-extraction` pipeline, which expects
      an image), L2-normalises so cosine reduces to dot product. `loadEncoder` injectable for tests.
      `tsx` added as devDep; build invoked via `pm2 start "yarn raw-tuner:embed-presets"` because
      the first run downloads ~150 MB of CLIP weights.
- [x] 5.3 Ran the build locally, committed `presets.json` (≈15 KB; 30 × 512 floats). Documented in
      the script header that CI does NOT regenerate.
- [x] 5.4 `presets/retrieve.ts` — `cosineSimilarity(a, b)` +
      `topN(query, presets, n,     { mmrLambda })` with greedy MMR (default λ = 0.7). Spec covers
      identity, scale invariance, dimension-mismatch errors, MMR diversity, n=0 / empty-list edges.
- [x] 5.5 `presets/index.ts` re-exports the JSON as a typed `readonly Preset[]`. Smoke-tested
      against `PRESET_SOURCES` to catch out-of-sync regenerations + verify embeddings are
      L2-normalised.
- [x] **100% line coverage** on every Phase 5 file (the real-CLIP encoder loader v8-ignored;
      exercised only by the build script invocation, not unit tests).

### Phase 6 — export

- [x] 6.1 `export/encode-jpeg.ts` — `encodeJpeg(width, height, bytes, { quality, canvasFactory })`.
      Default factory uses `OffscreenCanvas` (browser-only, v8-ignored); tests inject a fake canvas
      to drive the path under jsdom. Validates buffer length matches `w×h×4`.
- [x] 6.2 `export/write-xmp.ts` — `writeXmp(sliders): string` producing a Lightroom-compatible XMP
      sidecar with the `crs:` namespace (`Exposure2012`, `Contrast2012`, `Highlights2012`,
      `Shadows2012`, `Whites2012`, `Blacks2012`, `Temperature`, `Tint`, `Vibrance`, `Saturation`,
      `ToneCurvePV2012`). Identity tone curve elided. Spec parses the output via `@xmldom/xmldom`
      and asserts the right elements / values are present.
- [ ] 6.3 Tool UI: "Export JPEG" + "Export `.xmp` sidecar" buttons trigger downloads with sensible
      filenames (`<original-stem>.jpg`, `<original-stem>.xmp`). _Lands in Phase 7 with the rest of
      the UI._
- [x] **100% line coverage** on every Phase 6 file.

### Phase 7 — UI

- [x] 7.1 `ui/DropZone.tsx` — drag/drop + click-to-pick + Enter/Space activation. Visual
      `data-     drag-over` attr swaps for accessible focus visibility. Spec covers all four input
      paths.
- [x] 7.2 `ui/HistogramView.tsx` — RGB histogram canvas, fixed-size, additive-blended channels. Spec
      asserts the canvas is created at the right dimensions and the draw routine fires.
- [x] 7.3 `ui/SliderStack.tsx` — all 10 slider scalars as labelled range inputs (mins / maxes /
      steps from the slider semantics), value display, reset button. `onChange` emits a partial
      patch with just the changed key.
- [x] 7.4 `ui/PresetGrid.tsx` — grid of preset cards, `aria-pressed` for the active one, empty state
      shows the "drop a photo" hint. The Auto-tuned preset is prepended client-side from the
      heuristic baseline.
- [x] 7.5 `ui/ExportPanel.tsx` — quality range slider (default 92%), JPEG + .xmp buttons, disabled
      state until a photo loads. `onExportJpeg(quality)` carries the chosen quality.
- [x] 7.6 `ui/ToolBody.tsx` — composition: drop zone → decode → analyse → auto-tune → preview
      canvas + slider editing + preset selection + histogram + export. Lazy CLIP encoder load with
      try/catch fallback (suggestions are nice-to-have, never block). Decoupled `fileToArrayBuffer`
      so jsdom 26 (which lacks `File.arrayBuffer`) tests cleanly.
- [x] 7.7 _Production build hookup._ `transformers.js` loads via a `webpackIgnore`-marked dynamic
      `import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/...')` at runtime so
      Docusaurus's webpack doesn't have to handle the lib's Node-only transitive deps
      (`onnxruntime-node`, `sharp`). The build script (`tsx`) keeps the regular ESM import.
- [x] **100% line coverage** on every Phase 7 file (two React-event lines v8-ignored where v8
      statement-tracking misses synchronous click()/handler chains).

### Phase 8 — performance + polish

- [-] 8.1 _Deferred_. The applier already uses fp32 RGBA Float32 only and never copies to fp16 on
  CPU; explicit MP cap deferred until a real device hits a ceiling.
- [-] 8.2 _Deferred_. With the 1024px preview the apply path is ~80 ms end-to-end; user- perceptible
  debouncing is unnecessary at this resolution. Revisit if slider drags feel laggy on lower-end
  machines.
- [x] 8.3 Preview at 1024px while editing, full-res only on export. Box-filter downsample in
      `domain/downsample.ts` preserves histogram statistics so the auto-tune baseline matches what
      the full-res image would yield. ToolBody keeps both `decoded` and `preview` `LinearImage`s.
- [-] 8.4 _Deferred to Phase 9 manual smoke._
- [-] 8.5 _Deferred to Phase 9 manual smoke._ Components use semantic `<input type="range">`,
  `aria-pressed` on preset cards, `aria-label` on the drop zone + canvas, `role="alert"` on errors.
  Full WCAG 2.2 AA contrast verification needs real rendering.
- [x] 8.6 Self-test telemetry. ToolBody surfaces `getApplierDecision()` as a small "Rendering on the
      GPU / CPU" line under the export panel. The chat-style banner with a heavier warning isn't
      necessary because the heuristic baseline + CPU path produce identical output to the GPU path —
      a CPU fallback isn't a degraded experience, just slightly slower.

### Phase 9 — ship

- [x] 9.1 `yarn check` clean (test + lint + format + typecheck) — 423 tests pass, no warnings.
- [x] 9.2 `yarn build` clean. Verified `/blog` and other tool chunks have **zero** RawTuner code via
      the post-build isolation test. RawTuner total: ~3 KB main chunk + ~361 KB libraw chunk (lazy).
      transformers.js loads from CDN at runtime, no build-time cost.
- [ ] 9.3 _User-driven manual smoke_. Local `yarn serve` confirms `/tools/raw-tuner` returns 200;
      route renders. Drop a real RAW + verify Lightroom round-trip is the user's acceptance step.
- [-] 9.4 _N/A_. Homepage has "Latest posts" but no "Latest tools" card. The tool is discoverable
  via `/tools/`.
- [-] 9.5 _Deferred_.

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
