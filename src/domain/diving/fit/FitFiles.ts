import { Decoder, Stream } from '@garmin-fit/sdk'
import type { Dive } from '@site/src/domain/diving/Dive'
import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'
import type { Unzipped } from 'fflate'
import { unzipSync } from 'fflate'

/** Builds a vendor-specific {@link Dive} from a decoded FIT message set. */
export type DiveFactory<D extends Dive> = (messages: FitMessages) => D

/**
 * Collects `.fit` files (directly or from `.zip` archives), decodes them with
 * the Garmin FIT SDK, verifies their integrity, and yields one {@link Dive} per
 * file via the injected {@link DiveFactory}. This is the vendor-neutral core;
 * `GarminFiles` and `SuuntoFiles` supply the factory that maps the messages.
 */
export class FitFiles<D extends Dive> {
  private files: Map<string, Uint8Array> = new Map<string, Uint8Array>()

  constructor(private readonly createDive: DiveFactory<D>) {}

  *[Symbol.iterator](): Generator<D> {
    for (const [, bytes] of this.files.entries()) {
      const decoder = new Decoder(Stream.fromByteArray(bytes))

      // Check integrity
      if (!decoder.isFIT(bytes)) throw new Error('Unable to parse FIT file')
      if (!decoder.checkIntegrity()) throw new Error('Integrity check failed')

      // Check for errors
      const { messages, errors } = decoder.read({
        includeUnknownData: false,
        mergeHeartRates: true,
      })

      if (errors.length >= 1) throw new Error(errors.join(','))

      yield this.createDive(messages)
    }
  }

  async add(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    for (const fileHandle of files) {
      const buffer = await fileHandle.arrayBuffer()

      if (fileHandle.name.toLowerCase().endsWith('.zip')) {
        const extracted = await this.extract(buffer)
        await this.add(extracted)
        continue
      }

      if (fileHandle.name.toLowerCase().endsWith('.fit')) {
        this.files.set(fileHandle.name, new Uint8Array(buffer))
        continue
      }
    }
  }

  private async extract(buffer: ArrayBuffer): Promise<File[]> {
    const decompressedFiles: Unzipped = unzipSync(new Uint8Array(buffer), {
      filter: (file) => file.name.toLowerCase().endsWith('.fit') && file.originalSize <= 10_000_000,
    })

    return Object.entries(decompressedFiles).map(
      // fflate's `unzipSync` always allocates a regular ArrayBuffer (never
      // SharedArrayBuffer), so narrowing the buffer type is safe and required
      // by the stricter DOM `BlobPart` typings.
      ([filename, bytes]) => new File([bytes as Uint8Array<ArrayBuffer>], filename),
    )
  }
}
