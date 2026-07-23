# Suunto to SSI dive log helper

## Background

A user (Simo Kostiainen) reported that the existing Garmin to SSI dive log helper
(`/tools/garmin-to-ssi-dive-log-helper`) also worked with the Suunto app, because Suunto can export
`.fit` files too. He asked for the description to mention Suunto so more people find the tool. Newer
Suunto `.fit` files however now produce a QR code the SSI app no longer understands. Webber decided
to ship a dedicated Suunto tool, reusing the Garmin logic where identical.

### Root cause analysis (already verified against Simo's real file)

Simo's file (Suunto Ocean, scuba dive, 2026-07-13) decodes cleanly with `@garmin-fit/sdk` (isFIT ✓,
integrity ✓, 0 errors), but its message set diverges from Garmin's:

| Message type        | Garmin | Suunto Ocean                                                                                                                                 |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `fileIdMesgs`       | ✓      | ✓ (`manufacturer: 'suunto'`, `productName: 'Suunto Ocean'`)                                                                                  |
| `sportMesgs`        | ✓      | ✗ absent                                                                                                                                     |
| `diveSummaryMesgs`  | ✓      | ✗ absent                                                                                                                                     |
| `sessionMesgs`      | ✓      | ✓ but richer: has `avgDepth`, `maxDepth`, `diveNumber`, `surfaceInterval`; has `avgTemperature`/`maxTemperature` but **no `minTemperature`** |
| `diveSettingsMesgs` | ✓ full | ✓ minimal (`gfLow`, `gfHigh` only)                                                                                                           |
| `diveGasMesgs`      | ✓      | ✓ (`oxygenContent: 21`, `heliumContent: 0`)                                                                                                  |
| `recordMesgs`       | ✓      | ✓ 1s interval; `depth` sampled every ~10s; `temperature` on nearly all records; **no GPS position fields**                                   |

`GarminDive` reads `diveTime` (from `diveSummaryMesgs[].bottomTime`), `maxDepth` (from
`diveSummaryMesgs[].maxDepth`) and `minTemperature` (from `sessionMesgs[0].minTemperature`). All
three are `undefined` for Suunto files. `SsiDive.toQR` then serialises them literally as
`divetime:undefined;depth_m:undefined;watertemp_c:undefined`, which the SSI app rejects. Two root
causes therefore:

1. `SsiDive.toQR` must never emit `undefined` values (defensive fix, benefits both vendors).
2. Suunto files need their own field mapping (feature).

### Suunto field mapping (decided, treat as settled)

| SSI field         | Suunto source                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `divetime`        | `sessionMesgs[0].totalTimerTime` seconds → `Math.round(x / 60)` minutes. Suunto FIT has no bottom-time; the app's "dive time" (50'24.6 vs totalTimerTime 3085.5s here) is not present in the file. Minute-level rounding is acceptable for SSI. |
| `datetime`        | `sessionMesgs[0].startTime` (same as Garmin)                                                                                                                                                                                                    |
| `depth_m`         | `sessionMesgs[0].maxDepth`, rounded to 1 decimal (11.92 → 11.9)                                                                                                                                                                                 |
| `dive_type`       | `sessionMesgs[0].sport` (`'diving'` → Scuba) via existing `diveTypeFromSport`                                                                                                                                                                   |
| `watertemp_c`     | minimum of `recordMesgs[].temperature` (defined values only); fallback `sessionMesgs[0].avgTemperature`                                                                                                                                         |
| `watertemp_max_c` | `sessionMesgs[0].maxTemperature`                                                                                                                                                                                                                |
| names             | empty strings, like Garmin                                                                                                                                                                                                                      |

### Inputs available to the implementer

- Suunto fixture .fit file (Simo's real dive, verified free of PII: no GPS fields, no user profile,
  no names):
  `/home/webber/.local/share/assistant-dashboard/attachments/2026-07-23/44079ae8-a9c3-4603-8b12-b6d57f632c60.fit`
- Suunto app screenshot (shows ⋮ menu → "Download FIT file", 1280x2772 png):
  `/home/webber/.local/share/assistant-dashboard/attachments/2026-07-23/d594f616-cb48-436c-ae04-8dbcea712024.png`
- Existing implementation: `src/domain/diving/**`,
  `src/components/tools/GarminToSsiDiveLogHelper/**`,
  `src/pages/tools/garmin-to-ssi-dive-log-helper/`, tools index `src/pages/tools/index.tsx`.

### Ground rules

- TDD per task: red → green → commit → refactor → commit.
- Commit after every ticked task; commit titles ≤ 52 chars; no co-authoring.
- Preserve Garmin behaviour exactly (`UNDERSTAND BEFORE REPLACING`): the Garmin QR payload for a
  given input must be byte-identical before and after the refactor, except for dropping
  `key:undefined` entries.
- Run `yarn check` (tests, lint, format, typecheck) plus `npx prettier --write` on changed files
  before each commit.
- Never push or create a PR without explicit operator permission (ask at the end).
- British English, sentence case, no "AI" phrasing, follow repo AGENTS.md.

---

## Phase 0 - setup

- [x] Create a feature branch `suunto-ssi-dive-log-helper` (< 40 chars) off latest `main`
      (`git fetch` first). Use a worktree if the main checkout is busy. This plan file is currently
      untracked; commit it as the first commit on the branch.
- [x] Copy the Suunto fixture into the repo as
      `src/domain/diving/suunto/__fixtures__/suunto-ocean-scuba.fit` (from the attachments path
      above). Re-verify before committing that decoding it exposes no PII (no position/lat/long
      fields, no user names).
- [x] Add a fixture-loading test helper (Node `fs` read inside vitest) and a smoke test that the
      fixture decodes with `@garmin-fit/sdk` with `isFIT` true, integrity true, zero errors. Keep
      the whole test file < 200ms.

## Phase 1 - root-cause fix and vendor-neutral core

- [x] TDD: add unit tests for `SsiDive.toQR` covering: normal key/value pairs, `null` values
      (rendered as bare key, e.g. `dive;noid`), and `undefined` values (must be **omitted
      entirely**, never `key:undefined`). Then fix `toQR` to skip `undefined` values.
- [x] TDD: add unit tests for `GarminDive` using typed in-memory `GarminMessages` fixtures (plain
      objects, no .fit file needed) locking current behaviour: `diveTime` (bottomTime seconds →
      rounded minutes), `startTime`, `maxDepth` (1 decimal), `sport`, `minTemperature`,
      `maxTemperature`, and the undefined cases when `diveSummaryMesgs` / `sessionMesgs` are
      missing.
- [x] TDD: add unit tests for `SsiDive.fromGarmin` locking the exact QR payload produced for a
      complete Garmin-shaped message set (guards the refactor).
- [x] Extract the vendor-neutral parts of `GarminFiles` (zip extraction, .fit collection, SDK
      decode, integrity checks) into a shared module, e.g. `src/domain/diving/fit/FitFiles.ts`.
      Introduce a common `Dive` interface (e.g. `src/domain/diving/Dive.ts`) with `diveTime`,
      `startTime`, `maxDepth`, `sport`, `minTemperature`, `maxTemperature`, `firstName`, `lastName`.
      `GarminDive` implements it. Existing tests must stay green; keep `GarminFiles`' public surface
      working or migrate its call sites in the same commit.
- [x] Add vendor detection from `fileIdMesgs[0].manufacturer` (`'garmin'` | `'suunto'` | unknown)
      with unit tests, so each tool can warn when it receives the other vendor's file (exact UX
      decided in Phase 3).

## Phase 2 - Suunto domain

- [x] TDD: create `src/domain/diving/suunto/SuuntoMessages.ts` typing the observed Suunto message
      shapes (fileId with `manufacturer`/`productName`, session incl. `avgDepth`, `maxDepth`,
      `diveNumber`, `surfaceInterval`, `avgTemperature`, `maxTemperature`, `totalTimerTime`,
      `startTime`, `sport`; records with optional `depth` and `temperature`; minimal diveSettings;
      diveGas).
- [x] TDD: create `SuuntoDive` implementing `Dive` with the mapping table above. Unit-test with
      in-memory message fixtures **and** with the real decoded fixture file, asserting concrete
      values: `diveTime` 51, `startTime` 2026-07-13T06:33:04Z, `maxDepth` 11.9, `sport` 'diving',
      `maxTemperature` 29, `minTemperature` 29.
- [ ] TDD: every non-happy path: missing `sessionMesgs` (throw or undefined fields, mirroring
      `GarminDive`'s conventions), no records with temperature (fallback to `avgTemperature`, then
      undefined), missing `maxDepth`, non-diving sport (error from `diveTypeFromSport` surfaces to
      the UI as a readable message).
- [ ] TDD: add `SsiDive.fromDive(dive: Dive)` (or equivalent) so Garmin and Suunto share the SSI
      mapping; `fromGarmin` becomes a thin alias or is replaced at both call sites. Assert the full
      QR string for the Suunto fixture contains no `undefined` and includes `dive_type:0`,
      `divetime:51`, `depth_m:11.9`, `watertemp_c:29`, `watertemp_max_c:29`, and a `datetime:`
      matching the dive start (note: `formatDate` uses local timezone; assert accordingly or make
      the test timezone-safe).

## Phase 3 - UI

- [ ] Extract the shared page UI from `GarminToSsiDiveLogHelper` into a reusable component (e.g.
      `src/components/tools/FitToSsiDiveLogHelper/`) parameterised by: tool title, vendor name,
      instruction copy, export-instructions image, and dive-adapter factory. Garmin page must render
      pixel-identically (aside from copy changes explicitly listed below).
- [ ] While extracting, fix the invalid file-input accept attribute (`*.fit,*.zip` → `.fit,.zip`).
- [ ] Prepare Suunto assets in `src/components/tools/SuuntoToSsiDiveLogHelper/assets/`: copy the
      provided screenshot as `exporting-fit-file-from-suunto-app.png` plus a `.webp` companion
      (match the existing Garmin assets' pattern; use `cwebp` or the repo image tooling). Give the
      `<Image>` explicit width/height (zero CLS rule).
- [ ] Create `SuuntoToSsiDiveLogHelper` component and page
      `src/pages/tools/suunto-to-ssi-dive-log-helper/index.tsx` (same thin re-export pattern as
      Garmin). Copy: upload your Suunto `.fit` or `.zip`, scan the QR in the SSI app, "this page
      does not store data", and a short line explaining where to find "Download FIT file" in the
      Suunto app (⋮ menu on a dive).
- [ ] Vendor mismatch UX: when the Suunto page receives a Garmin file or vice versa, still convert
      (both produce SSI QR codes) but show an informational notice linking to the other tool. Test
      this behaviour.
- [ ] Add the Suunto tool card to `src/pages/tools/index.tsx` (icon `FaPersonSwimming`, description
      mentioning Suunto `.fit` files and the SSI DiveLog app).
- [ ] Cross-link the two tool pages ("Using a Garmin? → Garmin to SSI dive log helper" and vice
      versa) and mention Suunto compatibility in the Garmin tool card description for
      discoverability (Simo's original request).
- [ ] Component tests (vitest + test-utils) for the new page: renders instructions, upload of the
      Suunto fixture produces a QR whose payload matches the expected string, error path renders the
      error, developer-data details render the message groups.

## Phase 4 - proof that it works

- [ ] Start the dev server via PM2 (`pm2 start "yarn dev" --name takken-io-dev`), tail the log until
      ready.
- [ ] With `playwright-cli` (dark mode, `prefers-color-scheme: dark`): open
      `/tools/suunto-to-ssi-dive-log-helper`, upload the Suunto fixture via the file input, assert
      the QR code appears, and read the developer-data QR payload text to assert it contains
      `divetime:51` and `depth_m:11.9` and no `undefined`. Screenshot for the PR.
- [ ] Same flow on `/tools/garmin-to-ssi-dive-log-helper` with the Suunto fixture to confirm the
      mismatch notice + QR both work there too.
- [ ] Verify `/tools` index shows both cards; check keyboard navigation and visible focus states on
      the new card and page controls (WCAG 2.2 AA); confirm no layout shift when the QR section
      appears (content is appended below, nothing moves above the fold).
- [ ] Check the browser console and dev-server log for errors/warnings introduced by the change; fix
      any.
- [ ] `pm2 delete takken-io-dev` when done.

## Phase 5 - quality gate and wrap-up

- [ ] Run `yarn check` (coverage-covered tests, oxlint, oxfmt check, tsgo typecheck) and
      `npx prettier --write` on changed files; fix everything, no suppressions.
- [ ] Run `yarn build` (includes the post-build security check) and confirm it passes.
- [ ] Re-read the diff end to end: no leftover debug logging (also remove/keep-consistent the
      pre-existing `console.log('reading', fileName)` if it moved), no dead code, JSDoc on new
      domain modules.
- [ ] Fold-back: names reflect the end state (no `common`/`shared2`-style placeholders), module
      headers say what each module IS, no comments referencing this plan.
- [ ] Update this plan: all boxes ticked; note any deviations at the bottom.
- [ ] ASK THE OPERATOR (do not decide yourself): permission to push the branch and open a PR.
      Provide a suggested PR title (≤ 52 chars) and a concise bullet description including the E2E
      screenshot. Only push after explicit approval.

## Out of scope

- Replying to Simo's email.
- Changing the SSI QR schema or adding new SSI fields (site, weather, entry, etc.).
- Handling Suunto freediving/other sports beyond what `diveTypeFromSport` already supports.
- Blog post announcing the tool (may be a follow-up).
