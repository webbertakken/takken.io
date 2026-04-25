#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoSvg = readFileSync(path.join(repoRoot, 'static/images/logo.svg'), 'utf8')

// Strip the outer <svg> wrapper so we can embed the inner content into our card.
const logoInner = logoSvg
  .replace(/^<\?xml[^>]*>\s*/u, '')
  .replace(/^<!DOCTYPE[^>]*>\s*/u, '')
  .replace(/^<svg[^>]*>/u, '')
  .replace(/<\/svg>\s*$/u, '')

const W = 1200
const H = 630
const logoSize = 360
const logoX = 140
const logoY = (H - logoSize) / 2
const wordmarkX = logoX + logoSize + 70
const wordmarkY = H / 2

const card = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b1b1d"/>
      <stop offset="100%" stop-color="#0f0f10"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.5" r="0.55">
      <stop offset="0%" stop-color="#ff0080" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ff0080" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(${logoX} ${logoY}) scale(${logoSize / 1024})">
    <svg viewBox="0 0 1024 1024" width="1024" height="1024">${logoInner}</svg>
  </g>
  <g font-family="FiraCode Nerd Font Mono, Fira Mono, ui-monospace, monospace" font-weight="700">
    <text x="${wordmarkX}" y="${wordmarkY - 24}" font-size="112" fill="#ffffff" dominant-baseline="middle">Takken<tspan fill="#ff3882">.io</tspan></text>
    <text x="${wordmarkX}" y="${wordmarkY + 56}" font-size="28" fill="#989586" dominant-baseline="middle" font-weight="500">notes \u00b7 thoughts \u00b7 projects</text>
  </g>
</svg>
`

const outDir = path.join(repoRoot, 'static/img')
const outSvg = path.join(outDir, 'og.svg')
const outPng = path.join(outDir, 'og.png')
writeFileSync(outSvg, card)

await sharp(Buffer.from(card)).png({ compressionLevel: 9 }).toFile(outPng)

console.log(`wrote ${path.relative(repoRoot, outSvg)} and ${path.relative(repoRoot, outPng)}`)
