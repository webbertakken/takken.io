// Helper function for CSV injection protection
const sanitizeCsvCell = (value: string): string => {
  if (!value) return value
  
  const trimmedValue = value.trim()
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r']
  
  // Check if cell starts with potentially dangerous character
  if (dangerousChars.some(char => trimmedValue.startsWith(char))) {
    // Prefix with single quote to neutralize formula execution
    return `'${trimmedValue}`
  }
  
  return trimmedValue
}

// Parse CSV text into structured data rows
export const parseCsv = (csvText: string): Record<string, string>[] => {
  // Validate input is non-empty string
  if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') {
    throw new Error('CSV input must be a non-empty string')
  }
  
  // Validate input size and format
  if (csvText.length > 10 * 1024 * 1024) throw new Error('CSV file too large (max 10MB)')
  if (csvText.includes('\0')) throw new Error('Invalid CSV format: contains null bytes')
  
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV file must contain header and data rows')
  if (lines.length > 10000) throw new Error('CSV file too large (max 10000 rows)')
  
  const headers = lines[0].split(';').map(h => sanitizeCsvCell(h))
  if (headers.length > 50) throw new Error('CSV file has too many columns (max 50)')
  
  // Filter for dive data rows (contain date and time patterns)
  const dataLines = lines.slice(1).filter(line => 
    line.includes('/') && line.includes(':') && line.split(';').length >= headers.length
  )
  
  if (dataLines.length === 0) throw new Error('No valid dive data found in CSV')
  
  return dataLines.map(line => {
    const values = line.split(';')
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      const cellValue = values[index] || ''
      row[header] = sanitizeCsvCell(cellValue) // Apply CSV injection protection
    })
    return row
  })
}