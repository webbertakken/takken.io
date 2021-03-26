import React, { CanvasHTMLAttributes } from 'react'
import cx from 'classnames'
import Canvas from '@/components/common/Canvas/Canvas'
import styles from './Background.module.scss'

interface BackgroundCanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {}

const BackgroundCanvas = ({ className, ...props }: BackgroundCanvasProps) => {
  const draw = (ctx: CanvasRenderingContext2D, frame: number) => {
    const { canvas } = ctx
    const { width, height } = canvas

    // Save canvas state
    ctx.save()

    // Background
    ctx.fillStyle = 'rgb(30 31 41)'
    ctx.fillRect(0, 0, width, height)

    // Restore canvas state
    ctx.restore()
  }

  return <Canvas className={cx(className, styles.canvas)} {...props} draw={draw} />
}

export default BackgroundCanvas
