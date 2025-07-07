#!/usr/bin/env node
/**
 * Takken.io Image Generator - Node.js wrapper for yarn integration
 * This script invokes Claude Code to generate images based on descriptions
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Get the description from command line arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('❌ Error: Please provide a description for the image')
  console.error('Usage: yarn generate-image "Description of the image"')
  process.exit(1)
}

const description = args.join(' ')
const outputDir = path.join(process.cwd(), 'generated-images')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const outputFile = path.join(outputDir, `image-${timestamp}.png`)

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🎨 Takken.io Image Generator')
console.log('📝 Description:', description)
console.log('📁 Output:', outputFile)
console.log('')

// Create a temporary Python script using the Claude-powered generator
const tempScript = `
import sys
import os
sys.path.insert(0, '${path.join(__dirname).replace(/\\/g, '/')}')

from claude_generator import ClaudeImageGenerator

# Initialize the Claude-powered generator
generator = ClaudeImageGenerator()

# Generate image based on description using natural language processing
generator.generate_from_description(
    "${description.replace(/"/g, '\\"')}", 
    "${outputFile.replace(/\\/g, '/')}"
)

print("✅ Image generated successfully using Claude AI interpretation!")
`

const tempScriptPath = path.join(outputDir, `temp-${timestamp}.py`)
fs.writeFileSync(tempScriptPath, tempScript)

console.log('🤖 Generating image using Claude AI interpretation...\n')

// Run the Python script directly
const python = spawn('python3', [tempScriptPath], {
  stdio: 'inherit',
  shell: true,
})

python.on('close', (code) => {
  // Clean up temp file
  fs.unlinkSync(tempScriptPath)

  if (code === 0) {
    console.log('\n✅ Image generated successfully!')
    console.log(`📁 Saved to: ${outputFile}`)

    // Copy to clipboard if possible (Windows)
    if (process.platform === 'win32') {
      spawn('clip', [], { shell: true }).stdin.end(outputFile)
      console.log('📋 Path copied to clipboard')
    }
  } else {
    console.error('\n❌ Error generating image')
    process.exit(1)
  }
})

// The ClaudeImageGenerator uses natural language processing to:
// 1. Detect the most appropriate image type from the description
// 2. Generate relevant content based on keywords and context
// 3. Create production-quality images with Dracula colours and Nerd Fonts
