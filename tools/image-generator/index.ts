#!/usr/bin/env node
/**
 * Takken.io Image Generator - TypeScript version
 * Consolidates all image generation features from Python version
 */

import { createCanvas, registerFont, CanvasRenderingContext2D, Canvas } from 'canvas'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { execSync } from 'child_process'

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
  format?: 'png' | 'webp' | 'svg'
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

  // Save functionality
  saveImage(buffer: Buffer | string, outputPath: string): void {
    const ext = extname(outputPath).toLowerCase()

    if (typeof buffer === 'string') {
      // SVG content
      writeFileSync(outputPath, buffer)
      console.log(`✅ SVG saved to: ${outputPath}`)
      return
    }

    // Save as PNG first
    const pngPath = ext === '.webp' ? outputPath.replace('.webp', '.png') : outputPath
    writeFileSync(pngPath, buffer)
    console.log(`✅ PNG saved to: ${pngPath}`)

    // Convert to WebP if needed
    if (ext === '.webp') {
      try {
        execSync(`cwebp -q 90 "${pngPath}" -o "${outputPath}"`)
        console.log(`✅ WebP saved to: ${outputPath}`)
        unlinkSync(pngPath)
      } catch (error) {
        console.error('❌ Failed to convert to WebP:', error)
        console.log('Make sure cwebp is installed')
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Takken.io Image Generator - TypeScript Version

Usage: bun takken-image-generator.ts <command> [options]

Commands:
  bar-chart <output> [title]    Create a bar chart
  terminal <output> [title]     Create a terminal window
  diagram <output> [title]      Create a diagram

Examples:
  bun takken-image-generator.ts bar-chart chart.png "My Chart"
  bun takken-image-generator.ts terminal term.webp "npm install"
  bun takken-image-generator.ts diagram flow.svg "System Flow"
`)
    process.exit(0)
  }

  const generator = new TakkenImageGenerator()
  const command = args[0]
  const outputPath = args[1]
  const title = args[2] || 'Generated Image'

  switch (command) {
    case 'bar-chart': {
      const chartData: ChartData = [
        ['Windows Native', 100, 'green'],
        ['WSL Native', 100, 'cyan'],
        ['WSL to Windows', 9, 'orange'],
        ['Windows to WSL', 12, 'red'],
      ]
      const buffer = generator.createBarChart(chartData, { title })
      generator.saveImage(buffer, outputPath)
      break
    }

    case 'terminal': {
      const lines = [
        '$ npm install',
        'added 234 packages in 12s',
        '',
        '$ npm run build',
        '> my-app@1.0.0 build',
        '> webpack --mode production',
        '',
        'Build completed successfully ✓',
      ]
      const termBuffer = generator.createTerminalWindow(lines, title)
      generator.saveImage(termBuffer, outputPath)
      break
    }

    case 'diagram': {
      const elements: DiagramElement[] = [
        { id: 'a', label: 'Client', x: 200, y: 200, type: 'box', colour: 'cyan' },
        { id: 'b', label: 'API', x: 500, y: 200, type: 'circle', colour: 'green' },
        { id: 'c', label: 'Database', x: 800, y: 200, type: 'box', colour: 'purple' },
      ]
      const connections: Connection[] = [
        { from: 'a', to: 'b', label: 'HTTP' },
        { from: 'b', to: 'c', label: 'SQL', style: 'dashed' },
      ]
      const diagramBuffer = generator.createDiagram(elements, connections, title)
      generator.saveImage(diagramBuffer, outputPath)
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export {
  TakkenImageGenerator,
  type ChartData,
  type DiagramElement,
  type Connection,
  type ChartOptions,
}
