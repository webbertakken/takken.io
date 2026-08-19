import { Decoder, Stream } from '@garmin-fit/sdk'
import { sha256 } from '@site/src/core/utils/sha256'
import type { Dive } from '@site/src/domain/diving/Dive'
import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'
import type { Unzipped } from 'fflate'
import { unzipSync } from 'fflate'

/** Builds a vendor-specific {@link Dive} from a decoded FIT message set. */
export type DiveFactory<D extends Dive> = (messages: FitMessages) => D

/**
 * One queued file: either a dive, or the reason it could not be read. Modelled
 * as a union so consumers have to handle the failure before reaching the dive.
 */
export type FitFileResult<D extends Dive> =
  /** `name` is for display, taken from the upload or the archive entry. */
  { name: string; dive: D; error?: undefined } | { name: string; dive?: undefined; error: Error }

/** What a call to {@link FitFiles.add} did with the files it was handed. */
export interface AddSummary {
  /** Files queued for conversion. */
  added: number
  /** Files skipped because their bytes were already uploaded. */
  duplicates: number
  /** Names of files that are neither `.fit` nor `.zip`. */
  unsupported: string[]
  /** Archives that held no `.fit` files. */
  emptyArchives: string[]
  /** Archives that could not be opened. */
  unreadableArchives: string[]
}

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

/** Entry name without its archive folders. */
const baseName = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

/** macOS adds `__MACOSX/._name` resource forks that are not dive files. */
const isResourceFork = (path: string): boolean =>
  path.startsWith('__MACOSX/') || baseName(path).startsWith('._')

const isFitEntry = (path: string): boolean =>
  path.toLowerCase().endsWith('.fit') && !isResourceFork(path)

/**
 * Collects `.fit` files (directly or from `.zip` archives), decodes them with
 * the Garmin FIT SDK, verifies their integrity, and yields one result per file
 * via the injected {@link DiveFactory}. This is the vendor-neutral core;
 * `GarminFiles` and `SuuntoFiles` supply the factory that maps the messages.
 *
 * A file that cannot be decoded yields an error result rather than throwing, so
 * one unreadable dive never costs the diver the rest of the batch.
 *
 * Files are deduplicated by SHA-256 of their bytes, so uploading the same dive
 * twice (directly and inside an archive, say) does not add a second entry.
 * Names are only for display: two dives may legitimately share one.
 */
export class FitFiles<D extends Dive> {
  private queued = new Map<string, { name: string; bytes: Uint8Array }>()
  private checksums: Set<string> = new Set<string>()

  constructor(private readonly createDive: DiveFactory<D>) {}

  *[Symbol.iterator](): Generator<FitFileResult<D>> {
    for (const { name, bytes } of this.queued.values()) {
      let result: FitFileResult<D>

      try {
        result = { name, dive: this.decode(bytes) }
      } catch (error) {
        result = { name, error: asError(error) }
      }

      yield result
    }
  }

  async add(fileList: FileList | File[]): Promise<AddSummary> {
    const summary: AddSummary = {
      added: 0,
      duplicates: 0,
      unsupported: [],
      emptyArchives: [],
      unreadableArchives: [],
    }

    for (const fileHandle of Array.from(fileList)) {
      await this.addFile(fileHandle, summary)
    }

    return summary
  }

  /** Clears the queued files while keeping the deduplication checksums. */
  reset(): void {
    this.queued.clear()
  }

  private decode(bytes: Uint8Array): D {
    const decoder = new Decoder(Stream.fromByteArray(bytes))

    if (!decoder.isFIT(bytes)) throw new Error('Unable to parse FIT file')
    if (!decoder.checkIntegrity()) throw new Error('Integrity check failed')

    const { messages, errors } = decoder.read({
      includeUnknownData: false,
      mergeHeartRates: true,
    })

    if (errors.length >= 1) throw new Error(errors.join(','))

    return this.createDive(messages)
  }

  private async addFile(fileHandle: File, summary: AddSummary): Promise<void> {
    const name = fileHandle.name
    const lowerCaseName = name.toLowerCase()

    if (!lowerCaseName.endsWith('.fit') && !lowerCaseName.endsWith('.zip')) {
      summary.unsupported.push(name)

      return
    }

    const bytes = new Uint8Array(await fileHandle.arrayBuffer())
    const checksum = await sha256(bytes)

    if (this.checksums.has(checksum)) {
      summary.duplicates += 1

      return
    }
    this.checksums.add(checksum)

    if (lowerCaseName.endsWith('.zip')) {
      await this.addArchive(name, bytes, summary)

      return
    }

    // Keyed by checksum: dives exported as `ACTIVITY.fit` must not overwrite
    // each other just because they share a name.
    this.queued.set(checksum, { name, bytes })
    summary.added += 1
  }

  private async addArchive(name: string, bytes: Uint8Array, summary: AddSummary): Promise<void> {
    let extracted: File[]

    try {
      extracted = this.extract(bytes)
    } catch {
      summary.unreadableArchives.push(name)

      return
    }

    if (extracted.length === 0) {
      summary.emptyArchives.push(name)

      return
    }

    for (const file of extracted) await this.addFile(file, summary)
  }

  private extract(bytes: Uint8Array): File[] {
    const decompressedFiles: Unzipped = unzipSync(bytes, {
      filter: (file) => isFitEntry(file.name) && file.originalSize <= 10_000_000,
    })

    return Object.entries(decompressedFiles).map(
      // fflate's `unzipSync` always allocates a regular ArrayBuffer (never
      // SharedArrayBuffer), so narrowing the buffer type is safe and required
      // by the stricter DOM `BlobPart` typings.
      ([path, entry]) => new File([entry as Uint8Array<ArrayBuffer>], baseName(path)),
    )
  }
}
