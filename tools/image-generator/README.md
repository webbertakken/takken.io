# Takken.io Image Generator

An image generation toolset with natural language processing designed for creating consistent,
high-quality images for blog posts and documentation. Uses Claude AI to interpret descriptions and
generate appropriate content.

## Features

- 🎨 **Dracula Theme**: Consistent colour scheme across all images
- 🔤 **Nerd Font Support**: Full UTF-8 character and emoji support
- 🇬🇧 **British English**: Proper spelling throughout
- 🤖 **Natural Language Processing**: Automatically detects image type and generates relevant
  content from descriptions
- 📊 **Multiple Image Types**: Terminal windows, diagrams, charts, code editors, and more

## Installation

1. Ensure Python 3.8+ is installed with PIL/Pillow:

   ```bash
   pip install Pillow
   ```

2. The Nerd Font is already configured to use the fonts at:
   ```
   /home/webber/Setup/FiraCode Nerd Font Mono/
   ```

## Usage

### Via Yarn Command (Recommended)

From anywhere in the takken.io repository:

```bash
yarn generate-image "Description of the image you want"
```

Examples:

```bash
yarn generate-image "Terminal showing docker-compose commands"
yarn generate-image "Architecture diagram of a REST API with database"
yarn generate-image "Filesystem I/O performance comparison between native windows, native wsl, wsl reading and writing to windows fs and windows reading and writing to linux fs, use a barchart. Get your information from here: https://github.com/webbertakken/wsl-filesystem-benchmark?tab=readme-ov-file#-filesystem-io-performance-benchmarks show windows native as 100%, also show wsl native as 100%, combine all stats per column into a single percentage and use 1 bar per column shown in the readme the percentages are the average percentage of the column"
```

### Direct Python Usage

```python
from tools.image_generator.generator import TakkenImageGenerator

generator = TakkenImageGenerator()

# Create a terminal window
img = generator.create_terminal_window([
    "$ npm install",
    "added 1547 packages in 12.5s",
    "✅ Installation complete!"
], "Package Installation")

generator.save_image(img, "output.png")
```

## Image Types

### 1. Terminal Windows

Perfect for command-line tutorials and output examples.

```python
img = generator.create_terminal_window(content_lines, title, width, height)
```

### 2. Diagrams

Technical architecture and flow diagrams with connections.

```python
img = generator.create_diagram(title, elements, connections, width, height)
```

### 3. Charts

Bar charts and performance comparisons.

```python
img = generator.create_chart('bar', data, title, width, height)
```

### 4. Comparison Boxes

Feature comparisons and decision matrices.

```python
img = generator.create_comparison_boxes(data, title, width, height)
```

### 5. Code Editors

Syntax-highlighted code snippets.

```python
img = generator.create_code_editor(content, language, title, width, height)
```

## Natural Language Processing

The `ClaudeImageGenerator` uses intelligent keyword detection to automatically determine the best
image type and generate relevant content. When using `yarn generate-image`, the system will:

1. **Analyse** your description for keywords and context
2. **Detect** the most appropriate image type (terminal, diagram, chart, comparison, code)
3. **Generate** relevant content based on the detected type
4. **Apply** consistent Dracula styling and British English
5. **Save** the image with proper metadata

### Supported Keywords

- **Terminal**: terminal, command, shell, bash, docker, kubernetes, npm, git
- **Diagram**: architecture, microservices, API, pipeline, infrastructure, system
- **Chart**: performance, comparison, framework, benchmark, metrics
- **Comparison**: compare, versus, vs, pricing, features, cloud provider
- **Code**: python, javascript, function, class, configuration, YAML

## Colour Palette

All images use the official Dracula theme colours:

- Background: `#282a36`
- Foreground: `#f8f8f2`
- Green: `#50fa7b`
- Orange: `#ffb86c`
- Purple: `#bd93f9`
- Red: `#ff5555`
- Yellow: `#f1fa8c`
- Cyan: `#8be9fd`
- Pink: `#ff79c6`
- Comment: `#6272a4`

## Best Practices

1. **Be Specific**: Provide clear descriptions of what you want
2. **Include Context**: Mention if it's for a tutorial, comparison, or explanation
3. **Specify Data**: If creating charts, include the data points you want
4. **Use British English**: Maintain consistency with colour, centre, etc.

## Examples

### Terminal Output

```bash
yarn generate-image "Terminal showing successful pytest run with 50 tests"
```

### Architecture Diagram

```bash
yarn generate-image "Microservices architecture with React frontend, Node.js API, and PostgreSQL database"
```

### Performance Chart

```bash
yarn generate-image "Bar chart showing Python vs JavaScript vs Go performance for sorting algorithms"
```

### Feature Comparison

```bash
yarn generate-image "Comparison of VSCode, IntelliJ, and Neovim for Python development"
```

## Contributing

When adding new image types or features:

1. Maintain Dracula colour scheme
2. Use FiraCode Nerd Font Mono
3. Follow British English conventions
4. Add examples to Claude integration
5. Update this documentation

## Licence

Part of the takken.io project. See repository licence for details.
