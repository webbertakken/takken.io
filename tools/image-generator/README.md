# Takken.io Image Generator

TypeScript-based image generation tool with Claude AI integration for dynamic content generation
from natural language descriptions.

## Features

- **Claude AI Integration**: Generate dynamic content from natural language descriptions
- **Bar Charts**: Performance comparisons, metrics visualization with real data
- **Terminal Windows**: Command line interface mockups
- **Diagrams**: System architecture, flow charts
- **Multiple Formats**: PNG, WebP, SVG support
- **Dracula Theme**: Consistent color scheme
- **FiraCode Font**: Professional monospace typography

## Usage

The generator now uses Claude AI to create dynamic content based on natural language descriptions.

```bash
# Generate bar chart from description
yarn image bar-chart output.webp "Performance comparison of web frameworks"

# Generate terminal window from description
yarn image terminal output.png "Terminal showing docker-compose commands"

# Generate diagram from description
yarn image diagram output.svg "Microservices architecture with API gateway"
```

## Requirements

- Node.js runtime
- Yarn package manager
- Claude CLI (for AI content generation)
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
