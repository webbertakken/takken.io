#!/usr/bin/env node
/**
 * Takken.io Image Generator - TypeScript version
 * Consolidates all image generation features from Python version
 */

import { createCanvas, registerFont, CanvasRenderingContext2D, Canvas } from 'canvas'
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import * as path from 'path'

// Dracula colour scheme
const COLOURS = {
  background: '#282a36',
  current_line: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
  blue: '#6272a4',

  // Additional colours
  dark_bg: '#21222c',
  light_bg: '#44475a',
  accent: '#6272a4',
  selection: '#44475a',
} as const

type ColourKey = keyof typeof COLOURS
type ChartData = Array<[string, number, ColourKey]>
type DiagramElement = {
  id: string
  label: string
  x: number
  y: number
  type?: 'box' | 'circle' | 'diamond'
  colour?: ColourKey
}
type Connection = {
  from: string
  to: string
  label?: string
  style?: 'solid' | 'dashed'
}

interface ChartOptions {
  width?: number
  height?: number
  title?: string
  format?: 'png' | 'svg'
}

class TakkenImageGenerator {
  private fontPath: string
  private fontRegistered: boolean = false

  constructor() {
    this.fontPath = join(__dirname, '..', 'fonts')
    this.registerFonts()
  }

  private registerFonts(): void {
    // Register just the main font with absolute path
    const mainFontPath = join(this.fontPath, 'FiraCodeNerdFontMono-Retina.ttf')

    if (!existsSync(mainFontPath)) {
      throw new Error(`Font file not found: ${mainFontPath}`)
    }

    try {
      registerFont(mainFontPath, { family: 'FiraCodeNerdFontMono' })
      console.log(`✅ Registered FiraCodeNerdFontMono from: ${mainFontPath}`)
      this.fontRegistered = true
    } catch (error) {
      throw new Error(`Failed to register FiraCodeNerdFontMono: ${error}`)
    }

    // Also register bold variant with separate family name
    const boldFontPath = join(this.fontPath, 'FiraCodeNerdFontMono-Bold.ttf')
    if (existsSync(boldFontPath)) {
      try {
        registerFont(boldFontPath, { family: 'FiraCodeNerdFontMono-Bold' })
        console.log(`✅ Registered FiraCodeNerdFontMono Bold from: ${boldFontPath}`)
      } catch (error) {
        console.warn(`⚠️ Could not register bold variant: ${error}`)
      }
    }
  }

  // Base image creation
  private createBaseCanvas(
    width: number,
    height: number,
    background: ColourKey = 'background',
  ): Canvas {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = COLOURS[background]
    ctx.fillRect(0, 0, width, height)

    // Enable antialiasing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ctx as any).antialias = 'default'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ctx as any).textRenderingOptimization = 'optimizeQuality'

    return canvas
  }

  // Bar chart (existing functionality)
  createBarChart(data: ChartData, options: ChartOptions = {}): Buffer | string {
    const { width = 2000, height = 1200, title = 'Chart', format = 'png' } = options

    if (format === 'svg') {
      return this.createBarChartSVG(data, title, width, height)
    }

    const canvas = this.createBaseCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const scaleFactor = width / 1000

    if (title) {
      this.drawTitle(ctx, title, width, scaleFactor)
    }

    this.drawBarChart(ctx, data, width, height, scaleFactor)

    return canvas.toBuffer('image/png')
  }

  private drawTitle(
    ctx: CanvasRenderingContext2D,
    title: string,
    width: number,
    scaleFactor: number,
  ): void {
    const fontSize = Math.round(24 * scaleFactor)
    const y = Math.round(30 * scaleFactor)

    ctx.font = `${fontSize}px FiraCodeNerdFontMono-Bold`
    ctx.fillStyle = COLOURS.foreground
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, width / 2, y)
  }

  private drawBarChart(
    ctx: CanvasRenderingContext2D,
    data: ChartData,
    width: number,
    height: number,
    scaleFactor: number,
  ): void {
    const margin = Math.round(100 * scaleFactor)
    const chartLeft = margin
    const chartRight = width - margin
    const chartTop = Math.round(150 * scaleFactor)
    const chartBottom = height - margin
    const chartWidth = chartRight - chartLeft
    const chartHeight = chartBottom - chartTop

    // Draw grid
    this.drawGrid(ctx, chartLeft, chartRight, chartTop, chartBottom, scaleFactor)

    // Draw bars
    this.drawBars(ctx, data, chartLeft, chartBottom, chartWidth, chartHeight, scaleFactor)
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    left: number,
    right: number,
    top: number,
    bottom: number,
    scaleFactor: number,
  ): void {
    const fontSize = Math.round(12 * scaleFactor)
    ctx.font = `${fontSize}px FiraCodeNerdFontMono`
    ctx.fillStyle = COLOURS.comment
    ctx.strokeStyle = COLOURS.comment
    ctx.lineWidth = Math.round(2 * scaleFactor)
    ctx.textAlign = 'end'
    ctx.textBaseline = 'middle'

    for (let i = 0; i <= 100; i += 25) {
      const y = bottom - (i / 100) * (bottom - top)

      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()

      ctx.fillText(`${i}%`, left - Math.round(20 * scaleFactor), y)
    }
  }

  private drawBars(
    ctx: CanvasRenderingContext2D,
    data: ChartData,
    chartLeft: number,
    chartBottom: number,
    chartWidth: number,
    chartHeight: number,
    scaleFactor: number,
  ): void {
    const barWidth = Math.round(chartWidth / (data.length + 1))
    const actualBarWidth = Math.round(barWidth * 0.6)

    data.forEach(([label, value, colourKey], index) => {
      const barHeight = (value / 100) * chartHeight
      const barX = chartLeft + (index + 1) * barWidth - actualBarWidth / 2
      const barY = chartBottom - barHeight

      // Draw bar
      ctx.fillStyle = COLOURS[colourKey]
      ctx.fillRect(barX, barY, actualBarWidth, barHeight)

      // Draw value label
      const valueFontSize = Math.round(14 * scaleFactor)
      ctx.font = `${valueFontSize}px FiraCodeNerdFontMono-Bold`
      ctx.fillStyle = COLOURS.foreground
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`${value}%`, barX + actualBarWidth / 2, barY - Math.round(10 * scaleFactor))

      // Draw bar label
      const labelFontSize = Math.round(12 * scaleFactor)
      ctx.font = `${labelFontSize}px FiraCodeNerdFontMono`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // Handle multi-line labels
      const words = label.split(' ')
      const maxWidth = actualBarWidth + Math.round(20 * scaleFactor)
      let line = ''
      let y = chartBottom + Math.round(20 * scaleFactor)
      const lineHeight = Math.round(16 * scaleFactor)

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)

        if (metrics.width > maxWidth && line) {
          ctx.fillText(line, barX + actualBarWidth / 2, y)
          line = word
          y += lineHeight
        } else {
          line = testLine
        }
      }

      if (line) {
        ctx.fillText(line, barX + actualBarWidth / 2, y)
      }
    })
  }

  private createBarChartSVG(data: ChartData, title: string, width: number, height: number): string {
    const margin = 100
    const chartLeft = margin
    const chartRight = width - margin
    const chartTop = 150
    const chartBottom = height - margin
    const chartWidth = chartRight - chartLeft
    const chartHeight = chartBottom - chartTop

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${COLOURS.background}"/>

  <!-- Title -->
  <text x="${width / 2}" y="40" text-anchor="middle" fill="${COLOURS.foreground}"
        font-family="FiraCodeNerdFontMono" font-size="32" font-weight="bold">${title}</text>

  <!-- Grid -->
  <g stroke="${COLOURS.comment}" stroke-width="2" fill="${COLOURS.comment}" font-family="FiraCode, monospace" font-size="16">
`

    // Grid lines and labels
    for (let i = 0; i <= 100; i += 25) {
      const y = chartBottom - (i / 100) * chartHeight
      svg += `    <line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}"/>
    <text x="${chartLeft - 10}" y="${y}" text-anchor="end" alignment-baseline="middle">${i}%</text>
`
    }

    svg += `  </g>

  <!-- Bars -->
`

    const barWidth = chartWidth / (data.length + 1)
    const actualBarWidth = barWidth * 0.6

    data.forEach(([label, value, colourKey], index) => {
      const barHeight = (value / 100) * chartHeight
      const barX = chartLeft + (index + 1) * barWidth - actualBarWidth / 2
      const barY = chartBottom - barHeight

      svg += `  <rect x="${barX}" y="${barY}" width="${actualBarWidth}" height="${barHeight}" fill="${COLOURS[colourKey]}"/>
  <text x="${barX + actualBarWidth / 2}" y="${barY - 10}" text-anchor="middle" fill="${COLOURS.foreground}"
        font-family="FiraCodeNerdFontMono" font-size="20" font-weight="bold">${value}%</text>
  <text x="${barX + actualBarWidth / 2}" y="${chartBottom + 30}" text-anchor="middle" fill="${COLOURS.foreground}"
        font-family="FiraCodeNerdFontMono" font-size="16">${label}</text>
`
    })

    svg += `</svg>`

    return svg
  }

  // Terminal window visualization
  createTerminalWindow(
    lines: string[],
    title: string = 'Terminal',
    options: ChartOptions = {},
  ): Buffer {
    const { width = 900, height = 500 } = options
    const canvas = this.createBaseCanvas(width, height, 'dark_bg')
    const ctx = canvas.getContext('2d')

    // Window chrome
    const chromeHeight = 40
    ctx.fillStyle = COLOURS.current_line
    ctx.fillRect(0, 0, width, chromeHeight)

    // Window controls
    const controlY = chromeHeight / 2
    const controls = [
      { x: 20, colour: COLOURS.red },
      { x: 40, colour: COLOURS.yellow },
      { x: 60, colour: COLOURS.green },
    ]

    controls.forEach(({ x, colour }) => {
      ctx.fillStyle = colour
      ctx.beginPath()
      ctx.arc(x, controlY, 6, 0, Math.PI * 2)
      ctx.fill()
    })

    // Title
    ctx.font = '14px FiraCodeNerdFontMono'
    ctx.fillStyle = COLOURS.foreground
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, controlY + 5)

    // Terminal content
    ctx.textAlign = 'left'
    ctx.font = '14px FiraCodeNerdFontMono'
    let y = chromeHeight + 30

    lines.forEach((line) => {
      const colour = this.getLineColour(line)
      ctx.fillStyle = colour
      ctx.fillText(line, 20, y)
      y += 20
    })

    return canvas.toBuffer('image/png')
  }

  private getLineColour(line: string): string {
    if (line.startsWith('$') || line.startsWith('>')) return COLOURS.green
    if (line.startsWith('#')) return COLOURS.comment
    if (line.includes('error') || line.includes('Error')) return COLOURS.red
    if (line.includes('warning') || line.includes('Warning')) return COLOURS.yellow
    if (line.includes('success') || line.includes('✓')) return COLOURS.green
    return COLOURS.foreground
  }

  // Diagram creation
  createDiagram(
    elements: DiagramElement[],
    connections: Connection[],
    title: string,
    options: ChartOptions = {},
  ): Buffer {
    const { width = 1200, height = 600 } = options
    const canvas = this.createBaseCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Title
    if (title) {
      this.drawTitle(ctx, title, width, 1)
    }

    // Draw connections first (so they appear behind elements)
    ctx.strokeStyle = COLOURS.comment
    ctx.lineWidth = 2

    connections.forEach((conn) => {
      const from = elements.find((e) => e.id === conn.from)
      const to = elements.find((e) => e.id === conn.to)

      if (from && to) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)

        if (conn.style === 'dashed') {
          ctx.setLineDash([5, 5])
        }

        ctx.lineTo(to.x, to.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Arrow head
        this.drawArrowHead(ctx, from, to)

        // Connection label
        if (conn.label) {
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          ctx.font = '12px FiraCodeNerdFontMono'
          ctx.fillStyle = COLOURS.comment
          ctx.textAlign = 'center'
          ctx.fillText(conn.label, midX, midY - 10)
        }
      }
    })

    // Draw elements
    elements.forEach((element) => {
      const colour = element.colour || 'cyan'

      switch (element.type) {
        case 'circle':
          ctx.fillStyle = COLOURS[colour]
          ctx.beginPath()
          ctx.arc(element.x, element.y, 40, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'diamond':
          ctx.fillStyle = COLOURS[colour]
          ctx.beginPath()
          ctx.moveTo(element.x, element.y - 40)
          ctx.lineTo(element.x + 40, element.y)
          ctx.lineTo(element.x, element.y + 40)
          ctx.lineTo(element.x - 40, element.y)
          ctx.closePath()
          ctx.fill()
          break

        default: // box
          ctx.fillStyle = COLOURS[colour]
          this.drawRoundedRect(ctx, element.x - 60, element.y - 30, 120, 60, 10)
      }

      // Label
      ctx.font = '14px FiraCodeNerdFontMono'
      ctx.fillStyle = COLOURS.background
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(element.label, element.x, element.y)
    })

    return canvas.toBuffer('image/png')
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  }

  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    from: DiagramElement,
    to: DiagramElement,
  ): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const headLength = 15

    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6),
    )
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6),
    )
    ctx.stroke()
  }

  // Architecture diagram creation
  createArchitectureDiagram(
    boxes: ArchitectureBox[],
    arrows: ArchitectureArrow[],
    title: string,
    options: ChartOptions = {},
    indicators?: IndicatorLine[],
  ): Buffer {
    // Calculate optimal dimensions based on content
    const titleHeight = title ? 80 : 20
    const bottomMargin = 30

    // Find the extent of all boxes to determine canvas size
    const maxX = Math.max(...boxes.map((box) => box.x + box.width))
    const maxY = Math.max(...boxes.map((box) => box.y + box.height))

    const optimalWidth = maxX + 100 // Add margin
    const optimalHeight = titleHeight + maxY + bottomMargin

    const { width = optimalWidth, height = optimalHeight } = options
    const canvas = this.createBaseCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Title with icon
    if (title) {
      const titleY = 40
      ctx.font = '24px FiraCodeNerdFontMono-Bold'
      ctx.fillStyle = COLOURS.foreground
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(title, width / 2, titleY)
    }

    // Draw boxes
    boxes.forEach((box) => {
      // Draw box border
      ctx.strokeStyle = COLOURS[box.borderColor]
      ctx.lineWidth = 3
      ctx.strokeRect(box.x, box.y, box.width, box.height)

      // Fill background if specified
      if (box.backgroundColor) {
        ctx.fillStyle = COLOURS[box.backgroundColor]
        ctx.fillRect(box.x + 2, box.y + 2, box.width - 4, box.height - 4)
      }

      // Draw title
      ctx.font = '16px FiraCodeNerdFontMono-Bold'
      ctx.fillStyle = COLOURS[box.borderColor]
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(box.title, box.x + 15, box.y + 15)

      // Draw subtitle with more spacing
      ctx.font = '14px FiraCodeNerdFontMono'
      ctx.fillStyle = COLOURS.foreground
      ctx.fillText(box.subtitle, box.x + 15, box.y + 45)

      // Draw filesystem info if provided
      if (box.filesystem) {
        ctx.font = '12px FiraCodeNerdFontMono'
        ctx.fillStyle = COLOURS.comment
        ctx.fillText(box.filesystem, box.x + 15, box.y + 70)
      }
    })

    // Draw indicator lines first (so they appear behind arrows)
    if (indicators) {
      indicators.forEach((indicator) => {
        const fromBox = boxes.find((b) => b.id === indicator.from)
        const targetArrow = arrows[indicator.toArrow]

        if (fromBox && targetArrow) {
          // Find the actual arrow boxes
          const arrowFromBox = boxes.find((b) => b.id === targetArrow.from)
          const arrowToBox = boxes.find((b) => b.id === targetArrow.to)

          if (arrowFromBox && arrowToBox) {
            // Calculate the actual arrow position with offset
            const fromCenterY = arrowFromBox.y + arrowFromBox.height / 2 + (targetArrow.offset || 0)
            const toCenterY = arrowToBox.y + arrowToBox.height / 2 + (targetArrow.offset || 0)
            const arrowY = (fromCenterY + toCenterY) / 2

            // Calculate arrow X position (midpoint between the box edges)
            const arrowStartX = arrowFromBox.x + arrowFromBox.width
            const arrowEndX = arrowToBox.x
            const arrowMidX = (arrowStartX + arrowEndX) / 2

            // Draw indicator line from center-top of fromBox to the arrow midpoint
            const fromCenterX = fromBox.x + fromBox.width / 2
            const fromTopY = fromBox.y

            ctx.strokeStyle = COLOURS[indicator.color]
            ctx.fillStyle = COLOURS[indicator.color]
            ctx.lineWidth = 2

            if (indicator.style === 'dashed') {
              ctx.setLineDash([5, 5])
            } else if (indicator.style === 'dotted') {
              ctx.setLineDash([2, 3])
            }

            ctx.beginPath()
            ctx.moveTo(fromCenterX, fromTopY)
            ctx.lineTo(arrowMidX, arrowY)
            ctx.stroke()
            ctx.setLineDash([])
          }
        }
      })
    }

    // Draw arrows
    arrows.forEach((arrow) => {
      const fromBox = boxes.find((b) => b.id === arrow.from)
      const toBox = boxes.find((b) => b.id === arrow.to)

      if (fromBox && toBox) {
        ctx.strokeStyle = COLOURS[arrow.color]
        ctx.fillStyle = COLOURS[arrow.color]
        ctx.lineWidth = 3

        // Calculate arrow positions (edge to edge)
        let startX, startY, endX, endY

        if (arrow.positions?.startX !== undefined) {
          startX = arrow.positions.startX
          startY = arrow.positions.startY || fromBox.y + fromBox.height / 2
          endX = arrow.positions.endX || toBox.x + toBox.width / 2
          endY = arrow.positions.endY || toBox.y + toBox.height / 2
        } else {
          // Determine which edges to connect based on box positions
          const fromCenterX = fromBox.x + fromBox.width / 2
          const fromCenterY = fromBox.y + fromBox.height / 2
          const toCenterX = toBox.x + toBox.width / 2
          const toCenterY = toBox.y + toBox.height / 2

          // Apply offset for multiple arrows
          const offset = arrow.offset || 0

          // Horizontal connection (left-right)
          if (Math.abs(fromCenterX - toCenterX) > Math.abs(fromCenterY - toCenterY)) {
            if (fromCenterX < toCenterX) {
              // From box is to the left, connect right edge to left edge
              startX = fromBox.x + fromBox.width
              startY = fromCenterY + offset
              endX = toBox.x
              endY = toCenterY + offset
            } else {
              // From box is to the right, connect left edge to right edge
              startX = fromBox.x
              startY = fromCenterY + offset
              endX = toBox.x + toBox.width
              endY = toCenterY + offset
            }
          } else {
            // Vertical connection (top-bottom)
            if (fromCenterY < toCenterY) {
              // From box is above, connect bottom edge to top edge
              startX = fromCenterX + offset
              startY = fromBox.y + fromBox.height
              endX = toCenterX + offset
              endY = toBox.y
            } else {
              // From box is below, connect top edge to bottom edge
              startX = fromCenterX + offset
              startY = fromBox.y
              endX = toCenterX + offset
              endY = toBox.y + toBox.height
            }
          }
        }

        // Draw arrow line
        if (arrow.style === 'dashed') {
          ctx.setLineDash([10, 5])
        }

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw arrow head
        const angle = Math.atan2(endY - startY, endX - startX)
        const headLength = 20

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6),
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6),
        )
        ctx.stroke()

        // Draw label
        if (arrow.label) {
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2 - 20
          ctx.font = '12px FiraCodeNerdFontMono'
          ctx.fillStyle = COLOURS[arrow.color]
          ctx.textAlign = 'center'
          ctx.fillText(arrow.label, midX, midY)
        }
      }
    })

    return canvas.toBuffer('image/png')
  }

  // Create comparison chart
  createComparisonChart(boxes: ComparisonBox[], title: string): Buffer {
    const width = 2000
    const boxWidth = 400
    const boxHeight = 500
    const margin = 50
    const titleHeight = 150
    const bottomMargin = 80

    // Calculate optimal height based on content
    const height = titleHeight + boxHeight + bottomMargin

    const canvas = this.createBaseCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Title
    ctx.font = 'bold 48px FiraCodeNerdFontMono'
    ctx.fillStyle = COLOURS.foreground
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, 80)

    // Calculate box dimensions and positions
    const totalWidth = boxes.length * boxWidth + (boxes.length - 1) * margin
    const startX = (width - totalWidth) / 2

    boxes.forEach((box, index) => {
      const x = startX + index * (boxWidth + margin)
      const y = titleHeight

      // Box background
      ctx.fillStyle = COLOURS.dark_bg
      ctx.fillRect(x, y, boxWidth, boxHeight)

      // Box border
      ctx.strokeStyle = COLOURS[box.color]
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, boxWidth, boxHeight)

      // Title section
      ctx.fillStyle = COLOURS[box.color]
      ctx.fillRect(x, y, boxWidth, 80)

      // Box title
      ctx.font = 'bold 28px FiraCodeNerdFontMono'
      // Use dark text on colored header backgrounds for better contrast
      ctx.fillStyle = COLOURS.background
      ctx.textAlign = 'center'
      ctx.fillText(box.title, x + boxWidth / 2, y + 35)

      // Subtitle
      ctx.font = '20px FiraCodeNerdFontMono'
      ctx.fillStyle = COLOURS.background
      ctx.fillText(box.subtitle, x + boxWidth / 2, y + 60)

      // Features
      ctx.font = '18px FiraCodeNerdFontMono'
      ctx.textAlign = 'left'
      box.features.forEach((feature, featureIndex) => {
        const featureY = y + 120 + featureIndex * 35
        ctx.fillStyle = COLOURS.comment
        ctx.fillText('•', x + 20, featureY)
        ctx.fillStyle = COLOURS.foreground
        ctx.fillText(feature, x + 40, featureY)
      })

      // Verdict section at bottom
      const verdictY = y + boxHeight - 80
      ctx.fillStyle = COLOURS[box.color]
      ctx.fillRect(x, verdictY, boxWidth, 80)

      // Verdict text
      ctx.font = 'bold 22px FiraCodeNerdFontMono'
      // Use dark background color for better contrast on colored verdict sections
      ctx.fillStyle = COLOURS.background
      ctx.textAlign = 'center'
      ctx.fillText(box.verdict, x + boxWidth / 2, verdictY + 50)
    })

    return canvas.toBuffer('image/png')
  }

  // Save functionality
  saveImage(buffer: Buffer | string, outputPath: string): void {
    if (typeof buffer === 'string') {
      // SVG content
      writeFileSync(outputPath, buffer)
      console.log(`✅ SVG saved to: ${outputPath}`)
      return
    }

    // Save as PNG
    writeFileSync(outputPath, buffer)
    console.log(`✅ PNG saved to: ${outputPath}`)
  }
}

interface ClaudeChartData {
  title: string
  data: ChartData
}

interface ClaudeTerminalData {
  title: string
  lines: string[]
}

interface ClaudeDiagramData {
  title: string
  elements: DiagramElement[]
  connections: Connection[]
}

interface ArchitectureBox {
  id: string
  title: string
  subtitle: string
  filesystem?: string
  x: number
  y: number
  width: number
  height: number
  borderColor: ColourKey
  backgroundColor?: ColourKey
}

interface ArchitectureArrow {
  from: string
  to: string
  label: string
  color: ColourKey
  style?: 'solid' | 'dashed'
  offset?: number // Vertical offset for multiple arrows between same boxes
  positions?: {
    startX?: number
    startY?: number
    endX?: number
    endY?: number
  }
}

interface IndicatorLine {
  from: string
  toArrow: number // Index of arrow to connect to
  style: 'dashed' | 'dotted'
  color: ColourKey
}

interface ClaudeArchitectureData {
  title: string
  boxes: ArchitectureBox[]
  arrows: ArchitectureArrow[]
  indicators?: IndicatorLine[]
}

interface ComparisonBox {
  title: string
  subtitle: string
  features: string[]
  verdict: string
  color: ColourKey
}

interface ClaudeComparisonData {
  title: string
  boxes: ComparisonBox[]
}

class ClaudeImageGenerator {
  private generator: TakkenImageGenerator

  constructor() {
    this.generator = new TakkenImageGenerator()
  }

  private validateJsonStructure(data: unknown): boolean {
    // Check if it's an object
    if (!data || typeof data !== 'object') return false

    const obj = data as Record<string, unknown>

    // Check for required title field
    if (!obj.title || typeof obj.title !== 'string') return false

    // Validate based on data structure
    if ('data' in obj) {
      // Chart data validation
      if (!Array.isArray(obj.data)) return false
      return obj.data.every(
        (item: unknown) =>
          Array.isArray(item) &&
          item.length === 3 &&
          typeof item[0] === 'string' &&
          typeof item[1] === 'number' &&
          item[1] >= 0 &&
          item[1] <= 100 &&
          typeof item[2] === 'string' &&
          ['red', 'green', 'cyan', 'orange', 'purple', 'yellow'].includes(item[2]),
      )
    } else if ('lines' in obj) {
      // Terminal data validation
      if (!Array.isArray(obj.lines)) return false
      return obj.lines.every((line: unknown) => typeof line === 'string')
    } else if ('boxes' in obj && 'arrows' in obj) {
      // Architecture data validation
      if (!Array.isArray(obj.boxes) || !Array.isArray(obj.arrows)) return false

      const validColours = [
        'red',
        'green',
        'cyan',
        'orange',
        'purple',
        'yellow',
        'blue',
        'current_line',
        'background',
        'foreground',
        'comment',
        'pink',
        'dark_bg',
        'light_bg',
        'accent',
        'selection',
      ]

      const boxesValid = obj.boxes.every((box: unknown) => {
        if (!box || typeof box !== 'object') return false
        const b = box as Record<string, unknown>
        return (
          b.id &&
          typeof b.id === 'string' &&
          b.title &&
          typeof b.title === 'string' &&
          b.subtitle &&
          typeof b.subtitle === 'string' &&
          typeof b.x === 'number' &&
          typeof b.y === 'number' &&
          typeof b.width === 'number' &&
          typeof b.height === 'number' &&
          b.borderColor &&
          typeof b.borderColor === 'string' &&
          validColours.includes(b.borderColor as string) &&
          (!b.backgroundColor || validColours.includes(b.backgroundColor as string)) &&
          (!b.filesystem || typeof b.filesystem === 'string')
        )
      })

      const boxIds = new Set(
        obj.boxes.map((b: unknown) => {
          if (!b || typeof b !== 'object') return ''
          return (b as Record<string, unknown>).id as string
        }),
      )
      const arrowsValid = obj.arrows.every((arrow: unknown) => {
        if (!arrow || typeof arrow !== 'object') return false
        const a = arrow as Record<string, unknown>
        return (
          a.from &&
          typeof a.from === 'string' &&
          boxIds.has(a.from) &&
          a.to &&
          typeof a.to === 'string' &&
          boxIds.has(a.to) &&
          a.label &&
          typeof a.label === 'string' &&
          a.color &&
          typeof a.color === 'string' &&
          validColours.includes(a.color as string)
        )
      })

      // Validate indicators if present
      let indicatorsValid = true
      if ('indicators' in obj && obj.indicators) {
        if (!Array.isArray(obj.indicators)) {
          indicatorsValid = false
        } else {
          indicatorsValid = obj.indicators.every((indicator: unknown) => {
            if (!indicator || typeof indicator !== 'object') return false
            const ind = indicator as Record<string, unknown>
            return (
              ind.from &&
              typeof ind.from === 'string' &&
              boxIds.has(ind.from) &&
              typeof ind.toArrow === 'number' &&
              ind.toArrow >= 0 &&
              ind.toArrow < (obj.arrows as unknown[]).length &&
              ind.style &&
              typeof ind.style === 'string' &&
              ['dashed', 'dotted'].includes(ind.style as string) &&
              ind.color &&
              typeof ind.color === 'string' &&
              validColours.includes(ind.color as string)
            )
          })
        }
      }

      return boxesValid && arrowsValid && indicatorsValid
    } else if ('elements' in obj && 'connections' in obj) {
      // Diagram data validation
      if (!Array.isArray(obj.elements) || !Array.isArray(obj.connections)) return false

      const validTypes = ['box', 'circle', 'diamond']
      const validColours = [
        'red',
        'green',
        'cyan',
        'orange',
        'purple',
        'yellow',
        'blue',
        'current_line',
        'background',
        'foreground',
        'comment',
        'pink',
        'dark_bg',
        'light_bg',
        'accent',
        'selection',
      ]

      const elementsValid = obj.elements.every((elem: unknown) => {
        if (!elem || typeof elem !== 'object') return false
        const element = elem as Record<string, unknown>
        return (
          element.id &&
          typeof element.id === 'string' &&
          element.label &&
          typeof element.label === 'string' &&
          typeof element.x === 'number' &&
          element.x >= 0 &&
          element.x <= 1200 &&
          typeof element.y === 'number' &&
          element.y >= 0 &&
          element.y <= 600 &&
          (!element.type || validTypes.includes(element.type as string)) &&
          (!element.colour || validColours.includes(element.colour as string))
        )
      })

      const elementIds = new Set(
        obj.elements.map((e: unknown) => {
          if (!e || typeof e !== 'object') return ''
          return (e as Record<string, unknown>).id as string
        }),
      )
      const connectionsValid = obj.connections.every((conn: unknown) => {
        if (!conn || typeof conn !== 'object') return false
        const connection = conn as Record<string, unknown>
        return (
          connection.from &&
          typeof connection.from === 'string' &&
          elementIds.has(connection.from) &&
          connection.to &&
          typeof connection.to === 'string' &&
          elementIds.has(connection.to) &&
          (!connection.label || typeof connection.label === 'string')
        )
      })

      return elementsValid && connectionsValid
    }

    return false
  }

  private extractAndParseJson(result: string): unknown {
    // Try multiple JSON extraction methods
    let jsonData = null

    // Method 1: Try to parse the entire response as JSON
    try {
      jsonData = JSON.parse(result.trim())
      console.log('✅ Successfully parsed entire response as JSON')
      return jsonData
    } catch {
      // Continue to next method
    }

    // Method 2: Extract JSON between first { and last }
    const jsonStart = result.indexOf('{')
    const jsonEnd = result.lastIndexOf('}') + 1

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = result.substring(jsonStart, jsonEnd)
      try {
        jsonData = JSON.parse(jsonStr)
        console.log('✅ Successfully extracted and parsed JSON from response')
        return jsonData
      } catch {
        // Method 3: Try to clean up common issues
        const cleanedJson = jsonStr
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '')
          .trim()

        try {
          jsonData = JSON.parse(cleanedJson)
          console.log('✅ Successfully parsed cleaned JSON')
          return jsonData
        } catch {
          console.error('❌ Failed to parse JSON after cleaning')
          console.error('Cleaned JSON:', cleanedJson)
          return null
        }
      }
    } else {
      console.error('❌ No JSON structure found in response')
      return null
    }
  }

  async requestChartDataFromClaude(description: string): Promise<ClaudeChartData | null> {
    const prompt = `Create a bar chart data JSON for: "${description}"

Output the following JSON structure ONLY, replacing the example values with appropriate data:

{
  "title": "Web Framework Performance",
  "data": [
    ["Express.js", 92, "green"],
    ["Fastify", 98, "cyan"],
    ["Koa", 88, "orange"],
    ["Hapi", 82, "purple"],
    ["NestJS", 85, "yellow"],
    ["Next.js", 78, "red"]
  ]
}

RULES:
- Values must be integers between 0 and 100 (representing percentages or scores)
- Use exactly these colours: "red", "green", "cyan", "orange", "purple", "yellow"
- Include 3-8 items for comparison

IMPORTANT: Your response must be ONLY the JSON object above with appropriate values for "${description}". Do not add any text before or after the JSON.`

    const result = await this.callClaude(prompt)
    if (result && 'data' in result) {
      return result as ClaudeChartData
    }
    return null
  }

  async requestTerminalDataFromClaude(description: string): Promise<ClaudeTerminalData | null> {
    const prompt = `Create terminal session data JSON for: "${description}"

Output the following JSON structure ONLY, replacing the example with appropriate terminal content:

{
  "title": "Docker Compose Setup",
  "lines": [
    "$ docker-compose up -d",
    "Creating network myapp_default",
    "Creating volume myapp_data",
    "Creating myapp_db_1 ... done",
    "Creating myapp_api_1 ... done",
    "",
    "$ docker-compose ps",
    "Name                Command               State    Ports",
    "myapp_db_1    docker-entrypoint.sh postgres   Up      5432/tcp",
    "myapp_api_1   npm start                       Up      0.0.0.0:3000->3000/tcp",
    "",
    "✅ All containers started successfully"
  ]
}

IMPORTANT: Your response must be ONLY the JSON object above with appropriate terminal session for "${description}". Do not add any text before or after the JSON.`

    const result = await this.callClaude(prompt)
    if (result && 'lines' in result) {
      return result as ClaudeTerminalData
    }
    return null
  }

  async requestArchitectureDataFromClaude(
    description: string,
  ): Promise<ClaudeArchitectureData | null> {
    const prompt = `Create custom architecture diagram JSON for: "${description}"

Output the following JSON structure ONLY, replacing the example with appropriate architecture elements:

{
  "title": "Mutagen sync architecture",
  "boxes": [
    {"id": "windows", "title": "Windows", "subtitle": "C:\\\\Users\\\\Webber\\\\Repositories", "filesystem": "NTFS", "x": 100, "y": 100, "width": 300, "height": 150, "borderColor": "purple"},
    {"id": "wsl", "title": "WSL2 Ubuntu", "subtitle": "/home/webber/Repositories", "filesystem": "ext4", "x": 800, "y": 100, "width": 300, "height": 150, "borderColor": "orange"},
    {"id": "mutagen", "title": "Mutagen Daemon", "subtitle": "Real-time Bidirectional Sync", "x": 425, "y": 350, "width": 350, "height": 100, "borderColor": "green"}
  ],
  "arrows": [
    {"from": "windows", "to": "wsl", "label": "Sync files", "color": "green", "offset": -15},
    {"from": "wsl", "to": "windows", "label": "Sync files", "color": "green", "offset": 15}
  ],
  "indicators": [
    {"from": "mutagen", "toArrow": 0, "style": "dotted", "color": "blue"}
  ]
}

CRITICAL: Use ONLY these exact color names: "red", "green", "cyan", "orange", "purple", "yellow", "blue". Do not use hex codes.

IMPORTANT: Your response must be ONLY the JSON object above with appropriate architecture for "${description}". Do not add any text before or after the JSON.`

    const result = await this.callClaude(prompt)
    if (result && 'boxes' in result && 'arrows' in result) {
      return result as ClaudeArchitectureData
    }
    return null
  }

  async requestDiagramDataFromClaude(description: string): Promise<ClaudeDiagramData | null> {
    const prompt = `Create architecture diagram data JSON for: "${description}"

Output the following JSON structure ONLY, replacing the example with appropriate diagram elements:

{
  "title": "Microservices Architecture",
  "elements": [
    {"id": "gateway", "label": "API Gateway", "x": 600, "y": 100, "type": "box", "colour": "cyan"},
    {"id": "auth", "label": "Auth Service", "x": 300, "y": 300, "type": "circle", "colour": "green"},
    {"id": "users", "label": "User Service", "x": 600, "y": 300, "type": "circle", "colour": "orange"},
    {"id": "orders", "label": "Order Service", "x": 900, "y": 300, "type": "circle", "colour": "purple"},
    {"id": "db", "label": "Database", "x": 600, "y": 500, "type": "diamond", "colour": "yellow"}
  ],
  "connections": [
    {"from": "gateway", "to": "auth", "label": "authenticate"},
    {"from": "gateway", "to": "users", "label": "route"},
    {"from": "gateway", "to": "orders", "label": "route"},
    {"from": "auth", "to": "db", "label": "query"},
    {"from": "users", "to": "db", "label": "query"},
    {"from": "orders", "to": "db", "label": "query"}
  ]
}

IMPORTANT: Your response must be ONLY the JSON object above with appropriate diagram for "${description}". Do not add any text before or after the JSON.`

    const result = await this.callClaude(prompt)
    if (result && 'elements' in result && 'connections' in result) {
      return result as ClaudeDiagramData
    }
    return null
  }

  async requestComparisonDataFromClaude(description: string): Promise<ClaudeComparisonData | null> {
    const prompt = `Create comparison chart JSON for: "${description}"

Output the following JSON structure ONLY, replacing the example with appropriate comparison data:

{
  "title": "Development Workflow Comparison",
  "boxes": [
    {
      "title": "Type 2 Hypervisors",
      "subtitle": "VMware, QEMU",
      "features": ["Complex GPU setup", "Resource overhead", "Context switching"],
      "verdict": "Poor Experience",
      "color": "red"
    },
    {
      "title": "Type 1 Hypervisors",
      "subtitle": "Proxmox, ESXi",
      "features": ["GPU passthrough", "VM switching required", "Hardware dedicated"],
      "verdict": "Limited Flexibility",
      "color": "orange"
    },
    {
      "title": "Dual Boot",
      "subtitle": "Windows + Linux",
      "features": ["Native performance", "Constant rebooting", "Shared state issues"],
      "verdict": "Limited Flexibility",
      "color": "orange"
    },
    {
      "title": "WSL2 + Sync",
      "subtitle": "This approach",
      "features": ["Native performance", "Direct GPU access", "Unified environment"],
      "verdict": "Excellent Solution",
      "color": "green"
    }
  ]
}

CRITICAL: Use ONLY these exact color names: "red", "green", "cyan", "orange", "purple", "yellow". Do not use hex codes.

IMPORTANT: Your response must be ONLY the JSON object above with appropriate comparison for "${description}". Do not add any text before or after the JSON.`

    const result = await this.callClaude(prompt)
    if (result && 'boxes' in result) {
      return result as ClaudeComparisonData
    }
    return null
  }

  private async callClaude(
    prompt: string,
  ): Promise<
    | ClaudeChartData
    | ClaudeTerminalData
    | ClaudeDiagramData
    | ClaudeArchitectureData
    | ClaudeComparisonData
    | null
  > {
    console.log('📝 CLAUDE CODE PROMPT:')
    console.log('='.repeat(60))
    console.log(prompt)
    console.log('='.repeat(60))

    try {
      // Create temporary file with prompt
      const tempDir = mkdtempSync(join(tmpdir(), 'claude-image-gen-'))
      const tempFile = join(tempDir, 'prompt.txt')
      writeFileSync(tempFile, prompt)

      console.log('🔄 Running Claude Code...')
      console.log('💡 Claude may prompt you for permissions - please respond as needed')
      console.log('='.repeat(60))

      try {
        // Call Claude CLI with prompt via stdin
        console.log('🔧 Executing Claude CLI command...')
        const result = execSync(
          `echo "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" | claude --print --dangerously-skip-permissions`,
          {
            encoding: 'utf8',
            timeout: 120000,
            stdio: ['pipe', 'pipe', 'inherit'],
          },
        )

        console.log('🤖 CLAUDE CODE RESPONSE:')
        console.log('='.repeat(60))
        console.log(result)
        console.log('='.repeat(60))

        // Check if response is empty or just whitespace
        if (!result || result.trim().length === 0) {
          console.error('❌ Claude CLI returned empty response')
          return null
        }

        // Extract and parse JSON
        const jsonData = this.extractAndParseJson(result)

        // Validate the parsed data
        if (jsonData && this.validateJsonStructure(jsonData)) {
          return jsonData as
            | ClaudeChartData
            | ClaudeTerminalData
            | ClaudeDiagramData
            | ClaudeArchitectureData
        } else {
          console.error('❌ JSON structure validation failed')
          console.error('Parsed data:', jsonData)
          return null
        }
      } catch (execError) {
        console.error('❌ Failed to execute Claude CLI with --dangerously-skip-permissions')
        console.error('Execution error:', execError)

        // Try without the dangerous flag as fallback
        try {
          console.log('🔄 Retrying without --dangerously-skip-permissions flag...')
          const result = execSync(
            `echo "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" | claude --print`,
            {
              encoding: 'utf8',
              timeout: 120000,
              stdio: ['pipe', 'pipe', 'inherit'],
            },
          )

          console.log('🤖 CLAUDE CODE RESPONSE (fallback):')
          console.log('='.repeat(60))
          console.log(result)
          console.log('='.repeat(60))

          if (!result || result.trim().length === 0) {
            console.error('❌ Claude CLI returned empty response (fallback)')
            return null
          }

          // Extract and parse JSON
          const jsonData = this.extractAndParseJson(result)

          // Validate the parsed data
          if (jsonData && this.validateJsonStructure(jsonData)) {
            return jsonData as
              | ClaudeChartData
              | ClaudeTerminalData
              | ClaudeDiagramData
              | ClaudeArchitectureData
          } else {
            console.error('❌ JSON structure validation failed (fallback)')
            console.error('Parsed data:', jsonData)
            return null
          }
        } catch (fallbackError) {
          console.error('❌ Fallback Claude CLI execution also failed')
          console.error('Fallback error:', fallbackError)
          return null
        }
      } finally {
        // Clean up temp file
        try {
          execSync(`rm -rf "${tempDir}"`)
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error('❌ Error calling Claude:', error)
      return null
    }
  }

  async generateFromDescription(
    description: string,
    outputPath: string,
    type: 'bar-chart' | 'terminal' | 'diagram' | 'architecture' | 'comparison',
  ): Promise<boolean> {
    console.log(`🤖 Processing: ${description}`)
    console.log(`📊 Generating type: ${type}`)

    try {
      let buffer: Buffer | string | null = null
      let claudeData:
        | ClaudeChartData
        | ClaudeTerminalData
        | ClaudeDiagramData
        | ClaudeArchitectureData
        | ClaudeComparisonData
        | null = null

      switch (type) {
        case 'bar-chart': {
          claudeData = await this.requestChartDataFromClaude(description)
          if (claudeData?.data && claudeData?.title) {
            console.log(`✅ Generated chart: ${claudeData.title}`)
            buffer = this.generator.createBarChart(claudeData.data, { title: claudeData.title })
          }
          break
        }

        case 'terminal': {
          claudeData = await this.requestTerminalDataFromClaude(description)
          if (claudeData?.lines && claudeData?.title) {
            console.log(`✅ Generated terminal: ${claudeData.title}`)
            buffer = this.generator.createTerminalWindow(claudeData.lines, claudeData.title)
          }
          break
        }

        case 'architecture': {
          claudeData = await this.requestArchitectureDataFromClaude(description)
          if (claudeData?.boxes && claudeData?.arrows && claudeData?.title) {
            console.log(`✅ Generated architecture: ${claudeData.title}`)
            buffer = this.generator.createArchitectureDiagram(
              claudeData.boxes,
              claudeData.arrows,
              claudeData.title,
              {},
              claudeData.indicators,
            )
          }
          break
        }

        case 'diagram': {
          claudeData = await this.requestDiagramDataFromClaude(description)
          if (claudeData?.elements && claudeData?.connections && claudeData?.title) {
            console.log(`✅ Generated diagram: ${claudeData.title}`)
            buffer = this.generator.createDiagram(
              claudeData.elements,
              claudeData.connections,
              claudeData.title,
            )
          }
          break
        }

        case 'comparison': {
          claudeData = await this.requestComparisonDataFromClaude(description)
          if (claudeData?.boxes && claudeData?.title) {
            console.log(`✅ Generated comparison: ${claudeData.title}`)
            buffer = this.generator.createComparisonChart(claudeData.boxes, claudeData.title)
          }
          break
        }
      }

      if (buffer && claudeData) {
        // Save the image
        this.generator.saveImage(buffer, outputPath)

        // Save the JSON data
        this.saveJsonData(claudeData, outputPath, type)

        return true
      } else {
        console.error('❌ Failed to generate image - Claude returned invalid data')
        return false
      }
    } catch (error) {
      console.error('❌ Error generating image:', error)
      return false
    }
  }

  private saveJsonData(
    data:
      | ClaudeChartData
      | ClaudeTerminalData
      | ClaudeDiagramData
      | ClaudeArchitectureData
      | ClaudeComparisonData,
    outputPath: string,
    type: string,
  ): void {
    try {
      // Create JSON filename based on output path
      const parsedPath = path.parse(outputPath)
      const jsonPath = path.join(parsedPath.dir, `${parsedPath.name}-${type}.json`)

      // Add type to the data
      const dataWithType = {
        type: type,
        ...data,
      }

      // Save JSON with pretty formatting
      writeFileSync(jsonPath, JSON.stringify(dataWithType, null, 2))
      console.log(`💾 JSON saved to: ${jsonPath}`)
    } catch (error) {
      console.warn(`⚠️ Could not save JSON data: ${error}`)
    }
  }

  generateFromJson(jsonPath: string, outputPath: string): boolean {
    try {
      const jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'))

      if (!jsonData.type) {
        console.error('❌ JSON file missing "type" field')
        return false
      }

      let buffer: Buffer | string | null = null

      switch (jsonData.type) {
        case 'architecture':
          if (jsonData?.boxes && jsonData?.arrows && jsonData?.title) {
            console.log(`✅ Loaded architecture data: ${jsonData.title}`)
            buffer = this.generator.createArchitectureDiagram(
              jsonData.boxes,
              jsonData.arrows,
              jsonData.title,
              {},
              jsonData.indicators,
            )
          } else {
            console.error('❌ Invalid architecture JSON structure')
            return false
          }
          break

        case 'bar-chart':
          if (jsonData?.data && jsonData?.title) {
            console.log(`✅ Loaded bar chart data: ${jsonData.title}`)
            buffer = this.generator.createBarChart(jsonData.data, { title: jsonData.title })
          } else {
            console.error('❌ Invalid bar chart JSON structure')
            return false
          }
          break

        case 'comparison':
          if (jsonData?.boxes && jsonData?.title) {
            console.log(`✅ Loaded comparison data: ${jsonData.title}`)
            buffer = this.generator.createComparisonChart(jsonData.boxes, jsonData.title)
          } else {
            console.error('❌ Invalid comparison JSON structure')
            return false
          }
          break

        default:
          console.error(`❌ Unsupported JSON type: ${jsonData.type}`)
          return false
      }

      if (buffer) {
        this.generator.saveImage(buffer, outputPath)
      } else {
        console.error('❌ Failed to generate image buffer')
        return false
      }
      return true
    } catch (error) {
      console.error('❌ Error loading JSON:', error)
      return false
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Takken.io Image Generator - TypeScript Version

Usage: yarn image <command> <output> <description>

Commands:
  bar-chart <output> <description>    Create a bar chart from description
  terminal <output> <description>     Create a terminal window from description
  diagram <output> <description>      Create a diagram from description
  architecture <output> <description> Create a custom architecture diagram from description
  comparison <output> <description>   Create a comparison chart from description
  json <jsonPath> <output>            Create a diagram from JSON file

Examples:
  yarn image bar-chart chart.png "Performance comparison of web frameworks"
  yarn image terminal term.png "Terminal showing docker-compose commands"
  yarn image diagram flow.svg "Microservices architecture with API gateway"
  yarn image architecture sync.png "Mutagen sync architecture diagram"
  yarn image comparison compare.png "Development workflow comparison"
`)
    process.exit(0)
  }

  const command = args[0] as
    | 'bar-chart'
    | 'terminal'
    | 'diagram'
    | 'architecture'
    | 'comparison'
    | 'json'
  const generator = new ClaudeImageGenerator()
  let success = false

  if (command === 'json') {
    if (args.length < 3) {
      console.error('❌ Missing required arguments. Use: yarn image json <jsonPath> <output>')
      process.exit(1)
    }
    const jsonPath = args[1]
    const outputPath = args[2]
    success = generator.generateFromJson(jsonPath, outputPath)
  } else {
    if (args.length < 3) {
      console.error(
        '❌ Missing required arguments. Use: yarn image <command> <output> <description>',
      )
      process.exit(1)
    }

    const outputPath = args[1]
    const description = args.slice(2).join(' ')

    if (!['bar-chart', 'terminal', 'diagram', 'architecture', 'comparison'].includes(command)) {
      console.error(`❌ Unknown command: ${command}`)
      process.exit(1)
    }

    success = await generator.generateFromDescription(description, outputPath, command)
  }

  if (!success) {
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export {
  TakkenImageGenerator,
  ClaudeImageGenerator,
  type ChartData,
  type DiagramElement,
  type Connection,
  type ChartOptions,
}
