# Takken.io Image Generator

TypeScript-based image generation tool with support for charts, diagrams, and terminal windows.

## Features

- **Bar Charts**: Performance comparisons, metrics visualization
- **Terminal Windows**: Command line interface mockups
- **Diagrams**: System architecture, flow charts
- **Multiple Formats**: PNG, WebP, SVG support
- **Dracula Theme**: Consistent color scheme
- **FiraCode Font**: Professional monospace typography

## Usage

```bash
# Bar chart
yarn image bar-chart output.webp "Chart Title"

# Terminal window
yarn image terminal output.png "Terminal Title"

# Diagram
yarn image diagram output.svg "Diagram Title"
```

## Requirements

- Node.js runtime
- Yarn package manager
- `cwebp` (for WebP conversion)
- FiraCode Nerd Font (included in tools/fonts/)

## Examples

### Generate blog post chart

```bash
yarn image bar-chart \
  blog/2025-07-06-seamless-windows-wsl-development-with-mutagen/assets/filesystem-performance-comparison.webp \
  "Filesystem I/O Performance Comparison"
```

### Create terminal demo

```bash
yarn image terminal demo/terminal.png "npm install"
```

## Integration

The generator can be imported and used programmatically:

```typescript
import { TakkenImageGenerator } from './tools/image-generator/index.ts'

const generator = new TakkenImageGenerator()
const chartData = [['Label', 100, 'green']]
const buffer = generator.createBarChart(chartData, { title: 'My Chart' })
generator.saveImage(buffer, 'output.png')
```
