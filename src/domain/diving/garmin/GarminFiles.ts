import { useMemo } from 'react'
import type { Unzipped } from 'fflate'
import { unzipSync } from 'fflate'

class GarminFiles {
  private files: Map<string, Uint8Array> = new Map<string, Uint8Array>();

  *[Symbol.iterator]() {
    for (const file of this.files.entries()) yield file
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
