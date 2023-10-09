import { useMemo } from 'react'
import type { Unzipped } from 'fflate'
import { unzipSync } from 'fflate'
import { Decoder, Stream } from '@garmin-fit/sdk'
import { GarminDive } from '@site/src/domain/diving/garmin/GarminDive'

class GarminFiles {
  private files: Map<string, Uint8Array> = new Map<string, Uint8Array>();

  *[Symbol.iterator](): Generator<GarminDive> {
    for (const [fileName, bytes] of this.files.entries()) {
      console.log('reading', fileName)
      const decoder = new Decoder(Stream.fromByteArray(bytes))

      // Check integrity
      if (!decoder.isFIT(bytes)) throw new Error('Unable to parse FIT file')
      if (!decoder.checkIntegrity()) throw new Error('Integrity check failed')

      // Check for errors
      const { messages, errors } = decoder.read({
        // convertTypesToStrings: false,
        includeUnknownData: false,
        mergeHeartRates: true,
      })

      if (errors.length >= 1) throw new Error(errors.join(','))

      yield new GarminDive(messages)
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

      console.log('unsupported file', fileHandle.name)
    }
  }

  private async extract(buffer: ArrayBuffer): Promise<File[]> {
    const decompressedFiles: Unzipped = unzipSync(new Uint8Array(buffer), {
      filter: (file) => file.name.toLowerCase().endsWith('.fit') && file.originalSize <= 10_000_000,
    })

    return Object.entries(decompressedFiles).map(
      ([filename, bytes]) => new File([bytes] as Uint8Array[], filename),
    )
  }
}

export function useGarminFiles(): GarminFiles {
  const garminFiles = useMemo(() => new GarminFiles(), [])

  return garminFiles
}
