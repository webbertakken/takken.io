import React, { CanvasHTMLAttributes } from 'react'
import useCanvas, { CanvasOptions, DrawFunction } from './useCanvas'

export interface CanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  draw: DrawFunction
  options?: CanvasOptions
  className?: string
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
 */
const defaultOptions = {
  contextAttributes: {
    alpha: false,
  },
}

export function Canvas({ draw, options, ...rest }: CanvasProps) {
  const canvasRef = useCanvas(draw, { ...defaultOptions, ...options })

  return <canvas ref={canvasRef} {...rest} />
}

export default Canvas
