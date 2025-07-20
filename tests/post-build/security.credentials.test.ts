import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

// Inline security config
const forbiddenPatterns = [
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
  /GH_PERSONAL_ACCESS_TOKEN/g,
  /GITHUB_TOKEN/g,
  /personalAccessToken/g,
  /api[_-]?secret[_-]?key/gi,
  /database[_-]?password/gi,
  /db[_-]?password/gi,
]

const ignoredFiles = [
  '**/node_modules/**',
  '**/*.map',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/coverage/**',
]

const maxFileSize = 10 * 1024 * 1024 // 10MB

describe('Security Tests', () => {
  const buildDir = join(process.cwd(), 'build')

  beforeAll(() => {
    // Ensure build directory exists
    if (!existsSync(buildDir)) {
      throw new Error('Build directory does not exist. Run "yarn build-only" first.')
    }
  })

  it('should not expose any forbidden patterns in build artifacts', async () => {
    // Get all files in the build directory
    const files = await glob('**/*', {
      cwd: buildDir,
      nodir: true,
      dot: true,
      ignore: ignoredFiles,
    })

    const violations: Array<{ file: string; pattern: string; matches: string[] }> = []

    for (const file of files) {
      const filePath = join(buildDir, file)

      try {
        // Skip large files
        const stats = statSync(filePath)
        if (stats.size > maxFileSize) {
          continue
        }

        // Read file as text (skip binary files)
        const content = readFileSync(filePath, 'utf-8')

        // Check each forbidden pattern
        for (const pattern of forbiddenPatterns) {
          const matches = content.match(pattern)
          if (matches) {
            violations.push({
              file,
              pattern: pattern.toString(),
              matches: matches.slice(0, 5), // Limit to first 5 matches
            })
          }
        }
      } catch (error) {
        // Skip files that can't be read as text (binary files, etc.)
        if (error instanceof Error && error.message.includes('invalid character')) {
          continue
        }
        // For other errors, still continue but log them
        console.warn(`Could not read file ${file}: ${error}`)
      }
    }

    // Assert no violations were found
    if (violations.length > 0) {
      const errorMessage = violations
        .map(
          ({ file, pattern, matches }) =>
            `File: ${file}\nPattern: ${pattern}\nMatches: ${matches.join(', ')}`,
        )
        .join('\n\n')

      throw new Error(
        `🚨 SECURITY VIOLATION: Forbidden patterns found in build artifacts:\n\n${errorMessage}`,
      )
    }

    expect(violations).toHaveLength(0)
  })

  it('should not expose the specific environment variable references in build artifacts', async () => {
    // Look for the specific environment variable references that should not be exposed
    const criticalPatterns = [/GH_PERSONAL_ACCESS_TOKEN/g, /GITHUB_TOKEN/g, /personalAccessToken/g]

    const files = await glob('**/*.{js,html,css,json}', {
      cwd: buildDir,
      nodir: true,
    })

    const exposedVars: Array<{ file: string; pattern: string; matches: string[] }> = []

    for (const file of files) {
      const filePath = join(buildDir, file)

      try {
        const content = readFileSync(filePath, 'utf-8')

        for (const pattern of criticalPatterns) {
          const matches = content.match(pattern)
          if (matches) {
            exposedVars.push({
              file,
              pattern: pattern.toString(),
              matches,
            })
          }
        }
      } catch (_error) {
        // Skip files that can't be read as text
        continue
      }
    }

    if (exposedVars.length > 0) {
      const errorMessage = exposedVars
        .map(
          ({ file, pattern, matches }) =>
            `File: ${file}\nPattern: ${pattern}\nMatches: ${matches.join(', ')}`,
        )
        .join('\n\n')

      throw new Error(
        `Critical environment variable references found in build artifacts:\n\n${errorMessage}`,
      )
    }

    expect(exposedVars).toHaveLength(0)
  })

  it('should not expose process.env usage in client-side code', async () => {
    // Look for process.env usage that could indicate server-side code leaked to client
    const processEnvPattern = /process\.env\.[A-Z_]+/g

    const files = await glob('**/*.{js,html}', {
      cwd: buildDir,
      nodir: true,
    })

    const exposedEnvUsage: Array<{ file: string; matches: string[] }> = []

    for (const file of files) {
      const filePath = join(buildDir, file)

      try {
        const content = readFileSync(filePath, 'utf-8')
        const matches = content.match(processEnvPattern)

        if (matches) {
          // Filter out known safe environment variable usage
          const dangerousMatches = matches.filter((match) => {
            return !(
              (
                match.includes('process.env.NODE_ENV') || // Common safe usage
                match.includes('process.env.PUBLIC_') || // Public env vars
                match.includes('process.env.REACT_APP_')
              ) // Create React App public vars
            )
          })

          if (dangerousMatches.length > 0) {
            exposedEnvUsage.push({
              file,
              matches: dangerousMatches,
            })
          }
        }
      } catch (_error) {
        // Skip files that can't be read as text
        continue
      }
    }

    if (exposedEnvUsage.length > 0) {
      const errorMessage = exposedEnvUsage
        .map(({ file, matches }) => `File: ${file}\nMatches: ${matches.join(', ')}`)
        .join('\n\n')

      throw new Error(
        `Potentially dangerous process.env usage found in build artifacts:\n\n${errorMessage}`,
      )
    }

    expect(exposedEnvUsage).toHaveLength(0)
  })
})
