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
