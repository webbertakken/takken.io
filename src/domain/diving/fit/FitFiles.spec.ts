import { Decoder } from '@garmin-fit/sdk'
import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__'
import { SuuntoFiles } from '@site/src/domain/diving/suunto/SuuntoFiles'
import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'

describe('FitFiles', () => {
  it('parses a single .fit file', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()

    await files.add([new File([bytes], 'suunto-ocean-scuba.fit')])

    const results = Array.from(files)
    expect(results).toHaveLength(1)
    const { name, dive } = results[0]
    expect(name).toBe('suunto-ocean-scuba.fit')
    expect(dive.sport).toBe('diving')
  })

  it('extracts .fit files from a .zip archive', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()
    const zipped = zipSync({ 'suunto-ocean-scuba.fit': bytes }) as Uint8Array<ArrayBuffer>

    await files.add([new File([zipped], 'dives.zip')])

    const results = Array.from(files)
    expect(results).toHaveLength(1)
    const { name, dive } = results[0]
    expect(name).toBe('suunto-ocean-scuba.fit')
    expect(dive.sport).toBe('diving')
  })

  it('does not add the same .fit file twice', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()
    const file = new File([bytes], 'suunto-ocean-scuba.fit')

    await files.add([file, file])

    const results = Array.from(files)
    expect(results).toHaveLength(1)
  })

  it('does not add a .fit file that was already extracted from a .zip', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()
    const zipped = zipSync({ 'suunto-ocean-scuba.fit': bytes }) as Uint8Array<ArrayBuffer>

    await files.add([new File([zipped], 'dives.zip')])
    await files.add([new File([bytes], 'suunto-ocean-scuba.fit')])

    const results = Array.from(files)
    expect(results).toHaveLength(1)
  })

  it('reset clears parsed files but keeps checksums so duplicates are still skipped', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()
    const file = new File([bytes], 'suunto-ocean-scuba.fit')

    await files.add([file])
    expect(Array.from(files)).toHaveLength(1)

    files.reset()
    expect(Array.from(files)).toHaveLength(0)

    await files.add([file])
    expect(Array.from(files)).toHaveLength(0)
  })

  it('ignores files that are neither .fit nor .zip', async () => {
    const files = new SuuntoFiles()

    await files.add([new File(['not a dive'], 'notes.txt')])

    const dives = Array.from(files)
    expect(dives).toHaveLength(0)
  })

  it('throws when a fit file fails the integrity check', async () => {
    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()
    const corrupted = new Uint8Array(bytes)
    corrupted[20] ^= 0xff

    await files.add([new File([corrupted], 'corrupted.fit')])

    expect(() => Array.from(files)).toThrow('Integrity check failed')
  })

  it('throws when the decoder reports errors', async () => {
    const read = vi
      .spyOn(Decoder.prototype, 'read')
      .mockReturnValue({ messages: {}, errors: ['bad record'] } as never)

    const files = new SuuntoFiles()
    const bytes = suuntoOceanScubaFixture()

    await files.add([new File([bytes], 'suunto-ocean-scuba.fit')])

    expect(() => Array.from(files)).toThrow('bad record')
    read.mockRestore()
  })
})
