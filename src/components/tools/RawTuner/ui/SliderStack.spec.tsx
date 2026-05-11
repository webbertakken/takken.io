import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultSliderStack, mergeSliderStacks } from '../domain/slider-stack'
import SliderStack from './SliderStack'

describe('SliderStack', () => {
  it('renders one slider per slider field with the current value', () => {
    render(<SliderStack value={defaultSliderStack()} onChange={vi.fn()} />)

    const exposure = screen.getByLabelText('Exposure') as HTMLInputElement
    expect(exposure).toBeInTheDocument()
    expect(exposure.value).toBe('0')

    expect(screen.getByLabelText('Contrast')).toBeInTheDocument()
    expect(screen.getByLabelText('Highlights')).toBeInTheDocument()
    expect(screen.getByLabelText('Shadows')).toBeInTheDocument()
    expect(screen.getByLabelText('Whites')).toBeInTheDocument()
    expect(screen.getByLabelText('Blacks')).toBeInTheDocument()
    expect(screen.getByLabelText('Temp')).toBeInTheDocument()
    expect(screen.getByLabelText('Tint')).toBeInTheDocument()
    expect(screen.getByLabelText('Vibrance')).toBeInTheDocument()
    expect(screen.getByLabelText('Saturation')).toBeInTheDocument()
  })

  it('reflects the supplied value', () => {
    const value = mergeSliderStacks(defaultSliderStack(), { exposure: 1.5, contrast: 25 })
    render(<SliderStack value={value} onChange={vi.fn()} />)

    expect((screen.getByLabelText('Exposure') as HTMLInputElement).value).toBe('1.5')
    expect((screen.getByLabelText('Contrast') as HTMLInputElement).value).toBe('25')
  })

  it('emits an onChange patch when the user moves a slider', () => {
    const onChange = vi.fn()
    render(<SliderStack value={defaultSliderStack()} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Exposure'), { target: { value: '0.7' } })

    expect(onChange).toHaveBeenCalledWith({ exposure: 0.7 })
  })

  it('emits the right field when contrast changes', () => {
    const onChange = vi.fn()
    render(<SliderStack value={defaultSliderStack()} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Contrast'), { target: { value: '40' } })

    expect(onChange).toHaveBeenCalledWith({ contrast: 40 })
  })

  it('exposes a reset button that emits the default stack', () => {
    const onChange = vi.fn()
    render(
      <SliderStack
        value={mergeSliderStacks(defaultSliderStack(), { exposure: 2 })}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(onChange).toHaveBeenCalledWith(defaultSliderStack())
  })

  it('renders min/max attributes that match the slider semantics', () => {
    render(<SliderStack value={defaultSliderStack()} onChange={vi.fn()} />)

    const exposure = screen.getByLabelText('Exposure') as HTMLInputElement
    expect(exposure.min).toBe('-5')
    expect(exposure.max).toBe('5')
    expect(exposure.step).toBe('0.05')

    const contrast = screen.getByLabelText('Contrast') as HTMLInputElement
    expect(contrast.min).toBe('-100')
    expect(contrast.max).toBe('100')
  })
})
