import { Decoder } from '@garmin-fit/sdk'
import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__'
import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__'
import { SuuntoFiles } from '@site/src/domain/diving/suunto/SuuntoFiles'
import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'

const suunto = () => suuntoOceanScubaFixture()
const garmin = () => garminDescentScubaFixture()
const zip = (entries: Record<string, Uint8Array>) => zipSync(entries) as Uint8Array<ArrayBuffer>

const dives = (files: SuuntoFiles) => Array.from(files)
const names = (files: SuuntoFiles) => dives(files).map((result) => result.name)

describe('FitFiles', () => {
  it('parses a single .fit file', async () => {
    const files = new SuuntoFiles()

    await files.add([new File([suunto()], 'suunto-ocean-scuba.fit')])

    const results = dives(files)
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('suunto-ocean-scuba.fit')
    expect(results[0].dive?.sport).toBe('diving')
  })

  it('extracts every .fit file from a .zip archive', async () => {
    const files = new SuuntoFiles()

    await files.add([new File([zip({ 'dive-a.fit': suunto(), 'dive-b.fit': garmin() })], 'd.zip')])

    expect(names(files)).toEqual(['dive-a.fit', 'dive-b.fit'])
  })

  it('keeps both dives when two files share a name', async () => {
    const files = new SuuntoFiles()

    await files.add([new File([suunto()], 'ACTIVITY.fit'), new File([garmin()], 'ACTIVITY.fit')])

    const results = dives(files)
    expect(results).toHaveLength(2)
    expect(results.map((result) => result.name)).toEqual(['ACTIVITY.fit', 'ACTIVITY.fit'])
    expect(results[0].dive).not.toBe(results[1].dive)
  })

  it('ignores the resource forks that macOS puts in a .zip', async () => {
    const files = new SuuntoFiles()
    const resourceFork = new Uint8Array([0, 5, 22, 7, 0, 2, 0, 0])

    await files.add([
      new File(
        [
          zip({
            'dive-a.fit': suunto(),
            '__MACOSX/._dive-a.fit': resourceFork,
            '._dive-b.fit': resourceFork,
          }),
        ],
        'mac.zip',
      ),
    ])

    expect(names(files)).toEqual(['dive-a.fit'])
  })

  it('does not add the same file twice', async () => {
    const files = new SuuntoFiles()
    const file = new File([suunto()], 'suunto-ocean-scuba.fit')

    const summary = await files.add([file, file])

    expect(dives(files)).toHaveLength(1)
    expect(summary.added).toBe(1)
    expect(summary.duplicates).toBe(1)
  })

  it('does not add a .fit file that was already extracted from a .zip', async () => {
    const files = new SuuntoFiles()
    const bytes = suunto()

    await files.add([new File([zip({ 'suunto-ocean-scuba.fit': bytes })], 'dives.zip')])
    const summary = await files.add([new File([bytes], 'suunto-ocean-scuba.fit')])

    expect(dives(files)).toHaveLength(1)
    expect(summary.duplicates).toBe(1)
  })

  it('reset clears parsed files but keeps checksums so duplicates are still skipped', async () => {
    const files = new SuuntoFiles()
    const file = new File([suunto()], 'suunto-ocean-scuba.fit')

    await files.add([file])
    expect(dives(files)).toHaveLength(1)

    files.reset()
    expect(dives(files)).toHaveLength(0)

    await files.add([file])
    expect(dives(files)).toHaveLength(0)
  })

  it('reports files that are neither .fit nor .zip', async () => {
    const files = new SuuntoFiles()

    const summary = await files.add([new File(['not a dive'], 'notes.txt')])

    expect(dives(files)).toHaveLength(0)
    expect(summary.unsupported).toEqual(['notes.txt'])
    expect(summary.added).toBe(0)
  })

  it('reports an archive that holds no .fit files', async () => {
    const files = new SuuntoFiles()
    const empty = zip({ 'readme.txt': new TextEncoder().encode('nothing here') })

    const summary = await files.add([new File([empty], 'dives.zip')])

    expect(summary.emptyArchives).toEqual(['dives.zip'])
  })

  it('reports an archive it cannot read', async () => {
    const files = new SuuntoFiles()

    const summary = await files.add([new File([new Uint8Array([1, 2, 3, 4])], 'broken.zip')])

    expect(summary.unreadableArchives).toEqual(['broken.zip'])
  })

  it('yields an error for a file that fails the integrity check', async () => {
    const files = new SuuntoFiles()
    const corrupted = new Uint8Array(suunto())
    corrupted[20] ^= 0xff

    await files.add([new File([corrupted], 'corrupted.fit')])

    const [result] = dives(files)
    expect(result.name).toBe('corrupted.fit')
    expect(result.error?.message).toBe('Integrity check failed')
    expect(result.dive).toBeUndefined()
  })

  it('yields an error for a file that is not a fit file at all', async () => {
    const files = new SuuntoFiles()

    await files.add([new File([new Uint8Array([1, 2, 3, 4])], 'nonsense.fit')])

    expect(dives(files)[0].error?.message).toBe('Unable to parse FIT file')
  })

  it('yields an error when the decoder reports errors', async () => {
    const read = vi
      .spyOn(Decoder.prototype, 'read')
      .mockReturnValue({ messages: {}, errors: ['bad record'] } as never)
    const files = new SuuntoFiles()

    await files.add([new File([suunto()], 'suunto-ocean-scuba.fit')])

    expect(dives(files)[0].error?.message).toBe('bad record')
    read.mockRestore()
  })

  it('wraps a non-Error decoding failure', async () => {
    const isFit = vi.spyOn(Decoder.prototype, 'isFIT').mockImplementation(() => {
      throw 'decode exploded'
    })
    const files = new SuuntoFiles()

    await files.add([new File([suunto()], 'suunto-ocean-scuba.fit')])

    expect(dives(files)[0].error?.message).toBe('decode exploded')
    isFit.mockRestore()
  })

  it('keeps converting the files that follow a broken one', async () => {
    const files = new SuuntoFiles()
    const corrupted = new Uint8Array(suunto())
    corrupted[20] ^= 0xff

    await files.add([new File([corrupted], 'broken.fit'), new File([garmin()], 'good.fit')])

    const results = dives(files)
    expect(results).toHaveLength(2)
    expect(results[0].error).toBeDefined()
    expect(results[1].dive?.sport).toBe('diving')
  })
})
