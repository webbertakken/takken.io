// Parse CSV text into structured data rows
export const parseCsv = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV file must contain header and data rows')
  
  const headers = lines[0].split(';').map(h => h.trim())
  // Filter for dive data rows (contain date and time patterns)
  const dataLines = lines.slice(1).filter(line => 
    line.includes('/') && line.includes(':') && line.split(';').length >= headers.length
  )
  
  if (dataLines.length === 0) throw new Error('No valid dive data found in CSV')
  
  return dataLines.map(line => {
    const values = line.split(';')
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })
    return row
  })
}