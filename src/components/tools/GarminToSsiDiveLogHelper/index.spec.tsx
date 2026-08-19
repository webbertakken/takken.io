import { Decoder } from '@garmin-fit/sdk'
import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { zipSync } from 'fflate'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GarminToSsiDiveLogHelper from './index'

const suunto = () => suuntoOceanScubaFixture()
const garmin = () => garminDescentScubaFixture()
const zip = (entries: Record<string, Uint8Array>) => zipSync(entries) as Uint8Array<ArrayBuffer>

/** Renders the tool and returns a helper that uploads through the file input. */
const renderHelper = () => {
  const { container } = render(<GarminToSsiDiveLogHelper />)
  const input = container.querySelector('input[type="file"]') as HTMLInputElement

  return {
    input,
    upload: (files: File[]) => {
      Object.defineProperty(input, 'files', { value: files, configurable: true })
      fireEvent.input(input)
    },
  }
}

const currentFileName = () => screen.getByRole('heading', { level: 3 }).textContent

describe('GarminToSsiDiveLogHelper', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders inside a ToolPage with the expected title', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(
      screen.getByRole('heading', { name: 'Garmin to SSI DiveLog helper' }),
    ).toBeInTheDocument()
  })

  it('explains the upload steps and that no data is stored', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByText(/Upload or drag and drop your garmin/i)).toBeInTheDocument()
    expect(screen.getByText(/Scan the resulting QR code in the SSI app/i)).toBeInTheDocument()
    expect(screen.getByText(/This page does not store data/i)).toBeInTheDocument()
  })

  it('offers a file selector button', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByRole('button', { name: /Select file/i })).toBeInTheDocument()
  })

  it('opens the hidden file input when the button is clicked', () => {
    const { input } = renderHelper()
    const click = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByRole('button', { name: /Select file/i }))

    expect(click).toHaveBeenCalledOnce()
  })

  it('keeps the heading order of the page intact', async () => {
    const { upload } = renderHelper()

    upload([new File([garmin()], 'dive.fit')])

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2, name: 'Importing your dive' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'dive.fit' })).toBeVisible()
  })

  it('shows when the dive was made, not just the file name', async () => {
    const { upload } = renderHelper()

    upload([new File([garmin()], '22981515843_ACTIVITY.fit')])

    await waitFor(() => expect(screen.getByText(/23 May 2026/)).toBeInTheDocument())
  })

  describe('multiple files', () => {
    it('accepts several files at once and paginates between them', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'dive-1.fit'), new File([garmin()], 'dive-2.fit')])

      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('dive-1.fit')

      fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))

      await waitFor(() => expect(screen.getByText('Dive 2 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('dive-2.fit')

      fireEvent.click(screen.getByRole('button', { name: /Previous dive/i }))

      await waitFor(() => expect(currentFileName()).toBe('dive-1.fit'))
    })

    it('walks through the dives with the arrow keys', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'dive-1.fit'), new File([garmin()], 'dive-2.fit')])
      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => expect(currentFileName()).toBe('dive-2.fit'))

      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      await waitFor(() => expect(currentFileName()).toBe('dive-1.fit'))
    })

    it('leaves the arrow keys alone while typing or with a modifier held', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'dive-1.fit'), new File([garmin()], 'dive-2.fit')])
      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())

      const field = document.createElement('input')
      document.body.append(field)
      const editable = document.createElement('div')
      editable.setAttribute('contenteditable', 'true')
      document.body.append(editable)

      fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
      fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true })
      fireEvent.keyDown(window, { key: 'Enter' })
      fireEvent.keyDown(field, { key: 'ArrowRight' })
      fireEvent.keyDown(editable, { key: 'ArrowRight' })

      expect(currentFileName()).toBe('dive-1.fit')
      field.remove()
      editable.remove()
    })

    it('disables the previous button on the first dive and next on the last', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'dive-1.fit'), new File([garmin()], 'dive-2.fit')])
      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())

      expect(screen.getByRole('button', { name: /Previous dive/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Next dive/i })).not.toBeDisabled()

      fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))
      await waitFor(() => expect(screen.getByText('Dive 2 of 2')).toBeInTheDocument())

      expect(screen.getByRole('button', { name: /Previous dive/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /Next dive/i })).toBeDisabled()
    })

    it('keeps both dives when two files share a name', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'ACTIVITY.fit'), new File([garmin()], 'ACTIVITY.fit')])

      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('ACTIVITY.fit')

      // The Suunto export carries no tank pressures, the Garmin one does.
      expect(screen.queryByText(/psi \//)).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))

      await waitFor(() => expect(screen.getByText('2317 psi / 159.8 bar')).toBeInTheDocument())
      expect(currentFileName()).toBe('ACTIVITY.fit')
    })

    it('shows the dives that worked even when one file is broken', async () => {
      const { upload } = renderHelper()
      const corrupted = new Uint8Array(suunto())
      corrupted[20] ^= 0xff

      upload([
        new File([corrupted], 'broken.fit'),
        new File([garmin()], 'good-1.fit'),
        new File([suunto()], 'good-2.fit'),
      ])

      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())
      expect(screen.getByText('broken.fit: Integrity check failed')).toBeInTheDocument()
      expect(currentFileName()).toBe('good-1.fit')
    })

    it('selects the first dive of the newest batch', async () => {
      const { upload } = renderHelper()

      upload([new File([suunto()], 'first.fit')])
      await waitFor(() => expect(currentFileName()).toBe('first.fit'))

      upload([new File([garmin()], 'second.fit')])
      await waitFor(() => expect(screen.getByText('Dive 2 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('second.fit')
    })
  })

  describe('archives', () => {
    it('converts every dive inside a zip', async () => {
      const { upload } = renderHelper()

      upload([new File([zip({ 'dive-a.fit': suunto(), 'dive-b.fit': garmin() })], 'dives.zip')])

      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('dive-a.fit')
    })

    it('ignores the resource forks macOS puts in a zip', async () => {
      const { upload } = renderHelper()
      const archive = zip({
        'dive-a.fit': garmin(),
        '__MACOSX/._dive-a.fit': new Uint8Array([0, 5, 22, 7]),
      })

      upload([new File([archive], 'mac.zip')])

      await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
      expect(screen.queryByRole('navigation', { name: 'Dive files' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Unable to parse FIT file/)).not.toBeInTheDocument()
    })

    it('says so when an archive holds no dives', async () => {
      const { upload } = renderHelper()
      const archive = zip({ 'readme.txt': new TextEncoder().encode('nothing here') })

      upload([new File([archive], 'dives.zip')])

      await waitFor(() =>
        expect(screen.getByText('dives.zip holds no .fit files')).toBeInTheDocument(),
      )
    })

    it('says so when an archive cannot be opened', async () => {
      const { upload } = renderHelper()

      upload([new File([new Uint8Array([1, 2, 3, 4])], 'broken.zip')])

      await waitFor(() =>
        expect(screen.getByText('broken.zip could not be opened')).toBeInTheDocument(),
      )
    })

    it('deduplicates a dive already uploaded inside an archive', async () => {
      const { upload } = renderHelper()
      const bytes = suunto()

      upload([new File([zip({ 'suunto.fit': bytes })], 'first.zip')])
      await waitFor(() => expect(currentFileName()).toBe('suunto.fit'))

      upload([new File([zip({ 'suunto.fit': bytes, 'garmin.fit': garmin() })], 'second.zip')])

      await waitFor(() => expect(screen.getByText('Dive 2 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('garmin.fit')
    })
  })

  describe('unusable input', () => {
    it('reports a file that is neither .fit nor .zip', async () => {
      const { upload } = renderHelper()

      upload([new File(['just notes'], 'notes.txt')])

      await waitFor(() =>
        expect(screen.getByText('notes.txt is not a .fit or .zip file')).toBeInTheDocument(),
      )
    })

    it('tells the diver when a file was already uploaded', async () => {
      const { upload } = renderHelper()
      const file = () => new File([suunto()], 'suunto.fit')

      upload([file()])
      await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())

      upload([file()])

      await waitFor(() =>
        expect(screen.getByText('1 file skipped, already uploaded')).toBeInTheDocument(),
      )
    })

    it('reports an error instead of crashing on an unreadable fit file', async () => {
      const { upload } = renderHelper()

      upload([new File([new Uint8Array([1, 2, 3, 4])], 'broken.fit')])

      await waitFor(() =>
        expect(screen.getByText('broken.fit: Unable to parse FIT file')).toBeInTheDocument(),
      )
      expect(screen.queryByText('Importing your dive')).not.toBeInTheDocument()
    })

    it('surfaces a non-Error conversion failure as a string error', async () => {
      vi.spyOn(SsiDive, 'fromDive').mockImplementation(() => {
        throw 'something went wrong'
      })
      const { upload } = renderHelper()

      upload([new File([suunto()], 'suunto.fit')])

      await waitFor(() =>
        expect(screen.getByText('suunto.fit: something went wrong')).toBeInTheDocument(),
      )
    })

    it('surfaces a non-Error decoding failure as a string error', async () => {
      vi.spyOn(Decoder.prototype, 'isFIT').mockImplementation(() => {
        throw 'decode exploded'
      })
      const { upload } = renderHelper()

      upload([new File([suunto()], 'suunto.fit')])

      await waitFor(() =>
        expect(screen.getByText('suunto.fit: decode exploded')).toBeInTheDocument(),
      )
    })

    it('reports a failure to read the selected files', async () => {
      const { upload } = renderHelper()
      const file = new File([suunto()], 'suunto.fit')
      vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('disk went away'))

      upload([file])

      await waitFor(() => expect(screen.getByText('disk went away')).toBeInTheDocument())
    })
  })

  describe('drag and drop', () => {
    it('parses files dropped on the page', async () => {
      render(<GarminToSsiDiveLogHelper />)
      const dataTransfer = {
        files: [new File([suunto()], 'drop-1.fit'), new File([garmin()], 'drop-2.fit')],
      }

      fireEvent.dragEnter(window, { dataTransfer })
      fireEvent.drop(window, { dataTransfer })

      await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())
      expect(currentFileName()).toBe('drop-1.fit')
    })

    it('shows a drop overlay while dragging and hides it when leaving', async () => {
      render(<GarminToSsiDiveLogHelper />)
      const dataTransfer = { files: [] }

      fireEvent.dragEnter(window, { dataTransfer })
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.dragLeave(window, { dataTransfer })
      await waitFor(() => expect(screen.queryByText('Drop files here')).not.toBeInTheDocument())
    })

    it('keeps the overlay while a drag moves across nested elements', async () => {
      render(<GarminToSsiDiveLogHelper />)
      const dataTransfer = { files: [] }

      fireEvent.dragEnter(window, { dataTransfer })
      fireEvent.dragEnter(window, { dataTransfer })
      fireEvent.dragLeave(window, { dataTransfer })
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.dragLeave(window, { dataTransfer })
      await waitFor(() => expect(screen.queryByText('Drop files here')).not.toBeInTheDocument())
    })

    it('hides the overlay when the drag ends outside the window', async () => {
      render(<GarminToSsiDiveLogHelper />)

      fireEvent.dragEnter(window, { dataTransfer: { files: [] } })
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.dragEnd(window)

      await waitFor(() => expect(screen.queryByText('Drop files here')).not.toBeInTheDocument())
    })

    it('allows dragging over the page without errors', () => {
      render(<GarminToSsiDiveLogHelper />)

      expect(() => fireEvent.dragOver(window, { dataTransfer: { files: [] } })).not.toThrow()
    })

    it('does nothing when a drop carries no files', async () => {
      render(<GarminToSsiDiveLogHelper />)

      fireEvent.dragEnter(window, { dataTransfer: {} })
      fireEvent.drop(window, { dataTransfer: {} })

      await waitFor(() => expect(screen.queryByText('Importing your dive')).not.toBeInTheDocument())
    })
  })

  it('still converts a Suunto file but flags the vendor mismatch', async () => {
    const { upload } = renderHelper()

    upload([new File([suunto()], 'suunto-ocean-scuba.fit')])

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    const notice = screen.getByRole('note')
    expect(notice).toHaveTextContent(/Suunto file/i)
    expect(
      within(notice).getByRole('link', { name: /Suunto to SSI dive log helper/i }),
    ).toHaveAttribute('href', '/tools/suunto-to-ssi-dive-log-helper')
  })

  it('flags the vendor mismatch per dive, not for the whole batch', async () => {
    const { upload } = renderHelper()

    upload([new File([suunto()], 'suunto.fit'), new File([garmin()], 'garmin.fit')])
    await waitFor(() => expect(screen.getByText('Dive 1 of 2')).toBeInTheDocument())

    expect(screen.getByRole('note')).toHaveTextContent(/Suunto file/i)

    fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))

    await waitFor(() => expect(currentFileName()).toBe('garmin.fit'))
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
