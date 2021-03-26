import { useRef, useEffect } from 'react'

const updateDimensions = (canvas, context) => {
  const element = canvas.getBoundingClientRect()
  if (canvas.width !== element.width || canvas.height !== element.height) {
    const { devicePixelRatio = 1 } = window

    canvas.width = element.width * devicePixelRatio - 10
    canvas.height = element.height * devicePixelRatio - 10

    context.scale(devicePixelRatio, devicePixelRatio)
  }
}

export type DrawFunction = (context: CanvasRenderingContext2D, frame: number) => void
export interface CanvasOptions {
  contextAttributes?: CanvasRenderingContext2DSettings
}

const useCanvas = (drawFn: DrawFunction, options: CanvasOptions) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', options.contextAttributes)

    let frame = 0
    let animationFrame
    ;(function draw() {
      updateDimensions(canvas, context)

      drawFn(context, frame++)

      animationFrame = window.requestAnimationFrame(draw)
    })()

    return () => window.cancelAnimationFrame(animationFrame)
  }, [canvasRef, drawFn])

  return canvasRef
}
export default useCanvas
