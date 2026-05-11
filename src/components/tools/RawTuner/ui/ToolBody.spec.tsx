import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetApplierState } from '../applier'
import { createLinearImage, PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'
import ToolBody from './ToolBody'

const buildSyntheticImage = (): LinearImage => {
  const image = createLinearImage(2, 2)
  for (let i = 0; i < 4; i++) {
    image.data.set([0.18, 0.18, 0.18, 1], i * PIXEL_STRIDE)
  }
  return image
}

vi.mock('../decode/decode', () => ({
  decode: vi.fn(async () => ({
    image: buildSyntheticImage(),
    metadata: {
      cameraMake: 'Canon',
      cameraModel: 'EOS R5',
      iso: 100,
      shutter: 0.01,
      aperture: 2.8,
      raw: {},
    },
  })),
}))

vi.mock('../clip/load-clip', async () => {
  const actual = await vi.importActual<typeof import('../clip/load-clip')>('../clip/load-clip')
  return {
    ...actual,
    loadClipImageEncoder: vi.fn(async () => ({
      embed: async () => new Float32Array(actual.CLIP_EMBEDDING_DIM),
    })),
  }
})

const installCanvasMock = (): (() => void) => {
  const ctx = {
    fillStyle: '#000',
    globalAlpha: 1,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
  }
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as unknown as typeof original
  return () => {
    HTMLCanvasElement.prototype.getContext = original
  }
}

const restorers: (() => void)[] = []

beforeEach(() => {
  resetApplierState()
})

afterEach(() => {
  while (restorers.length) restorers.pop()?.()
  resetApplierState()
})

describe('ToolBody', () => {
  it('renders the drop zone before any photo is loaded', () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    expect(screen.getByRole('button', { name: /drop a raw or jpeg/i })).toBeInTheDocument()
    expect(screen.getByText(/drop a photo to see suggested looks/i)).toBeInTheDocument()
  })

  it('decodes a dropped file and shows the camera info', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    const zone = screen.getByRole('button', { name: /drop a raw or jpeg/i })
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/Canon EOS R5/i)).toBeInTheDocument()
    })
  })

  it('shows a loaded sliders panel once the photo is decoded', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Exposure')).toBeInTheDocument()
    })
  })

  it('enables the export buttons once a photo is loaded', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export jpeg/i })).not.toBeDisabled()
    })
  })

  it('surfaces a decode failure as an error message', async () => {
    restorers.push(installCanvasMock())
    const decode = vi.mocked(await import('../decode/decode')).decode
    decode.mockRejectedValueOnce(new Error('unsupported format'))

    render(<ToolBody />)
    const file = new File(['fake'], 'photo.bin', { type: 'application/octet-stream' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => {
      expect(screen.getByText(/unsupported format/i)).toBeInTheDocument()
    })
  })

  it('shows preset suggestions once CLIP retrieves them', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(
      () => {
        // Wait for at least one preset name to render in the grid.
        expect(screen.getAllByRole('button').length).toBeGreaterThan(2)
      },
      { timeout: 2000 },
    )
  })

  it('moves a slider and clears the active preset', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(screen.getByLabelText('Exposure')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Exposure'), { target: { value: '1.5' } })

    await waitFor(() =>
      expect((screen.getByLabelText('Exposure') as HTMLInputElement).value).toBe('1.5'),
    )
    expect(screen.getByRole('button', { name: 'Auto-tuned' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reverts to auto-tune from the reset button', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(screen.getByLabelText('Exposure')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Exposure'), { target: { value: '1.5' } })
    fireEvent.click(screen.getByRole('button', { name: /reset to auto-tune/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Auto-tuned' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
  })

  it('selects a preset and marks it active', async () => {
    restorers.push(installCanvasMock())
    render(<ToolBody />)

    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(
      () => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(2)
      },
      { timeout: 2000 },
    )

    // Find a preset button that isn't "Auto-tuned" or one of the slider/export buttons.
    const allButtons = screen.getAllByRole('button')
    const presetButton = allButtons.find(
      (b) =>
        b.textContent &&
        b.textContent.length > 1 &&
        !/auto-tuned|reset|export|drop a raw/i.test(b.textContent),
    )
    if (!presetButton) throw new Error('no preset button found')
    fireEvent.click(presetButton)

    await waitFor(() => expect(presetButton).toHaveAttribute('aria-pressed', 'true'))
  })

  it('exports a JPEG via a synthesised download click', async () => {
    restorers.push(installCanvasMock())

    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
    restorers.push(() => {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    })

    // Stub OffscreenCanvas (jsdom doesn't have one).
    class FakeOffscreenCanvas {
      width = 0
      height = 0
      getContext() {
        return { putImageData: vi.fn() }
      }
      async convertToBlob() {
        return new Blob(['x'], { type: 'image/jpeg' })
      }
    }
    const originalOffscreen = (globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas
    ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = FakeOffscreenCanvas
    restorers.push(() => {
      ;(globalThis as { OffscreenCanvas?: unknown }).OffscreenCanvas = originalOffscreen
    })

    render(<ToolBody />)
    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export jpeg/i })).not.toBeDisabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: /export jpeg/i }))

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled())
  })

  it('exports an .xmp sidecar via a synthesised download click', async () => {
    restorers.push(installCanvasMock())
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
    restorers.push(() => {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    })

    render(<ToolBody />)
    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export \.xmp/i })).not.toBeDisabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: /export \.xmp/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  it('logs a warning and recovers when CLIP suggestions fail', async () => {
    restorers.push(installCanvasMock())
    const loadClip = vi.mocked(await import('../clip/load-clip')).loadClipImageEncoder
    loadClip.mockRejectedValueOnce(new Error('CLIP unavailable'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    restorers.push(() => warn.mockRestore())

    render(<ToolBody />)
    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.drop(screen.getByRole('button', { name: /drop a raw or jpeg/i }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(screen.getByLabelText('Exposure')).toBeInTheDocument())
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('preset suggestions failed'),
        expect.any(Error),
      ),
    )
  })
})
