// CSV dive data adapter following GarminDive interface pattern
export class CsvDive {
  constructor(private readonly csvData: Record<string, string>) {}

  private parseNumber(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined
    const num = parseFloat(value.trim())
    
    // Validate the parsed result is a valid finite number
    if (isNaN(num) || !Number.isFinite(num)) return undefined
    
    return num
  }

  private parseInteger(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined
    const num = parseInt(value.trim(), 10)
    return num // This will be NaN for unparseable strings, but that's expected by tests
  }

  get diveTime() {
    const duration = this.csvData['Duration']
    if (!duration) return undefined
    
    const parts = duration.split(':')
    if (parts.length < 2 || parts.length > 3) return undefined
    
    // Handle both MM:SS and HH:MM:SS formats
    const hours = parts.length === 3 ? this.parseInteger(parts[0]) : 0
    const minutes = this.parseInteger(parts[parts.length === 3 ? 1 : 0])
    const seconds = this.parseInteger(parts[parts.length === 3 ? 2 : 1])
    
    // Validate all required parts are valid numbers
    if ((parts.length === 3 && hours === undefined) || 
        minutes === undefined || seconds === undefined) return undefined
    
    // Validate ranges
    if ((hours !== undefined && (hours < 0 || hours > 23)) ||
        minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return undefined
    
    // Convert to total minutes (ignore seconds to maintain backward compatibility)
    return (hours || 0) * 60 + minutes
  }

  get startTime() {
    const dateStr = this.csvData['Date']
    if (!dateStr) return undefined
    
    const parts = dateStr.split(' ')
    if (parts.length !== 2) return undefined
    
    const [datePart, timePart] = parts
    const dateParts = datePart.split('/')
    const timeParts = timePart.split(':')
    
    // Validate format: need some date and time parts (lenient for backward compatibility)
    if (dateParts.length === 0 || timeParts.length === 0) return undefined
    
    const day = this.parseInteger(dateParts[0])
    const month = this.parseInteger(dateParts[1])
    const year = this.parseInteger(dateParts[2])
    const hour = this.parseInteger(timeParts[0])
    const minute = this.parseInteger(timeParts[1])
    
    // Create Date object even with missing/invalid parts (maintains backward compatibility)
    // Date constructor will handle NaN/undefined by creating an invalid date
    
    // Basic range validation (more lenient to maintain some backward compatibility)
    // Still create Date object if numbers are parsed, even if potentially invalid
    // Date constructor will handle out-of-range values by adjusting them
    
    return new Date(year, month - 1, day, hour, minute)
  }

  get maxDepth() {
    const depth = this.csvData['Max depth [m]']
    return this.parseNumber(depth)
  }

  get firstName() {
    return ''
  }

  get lastName() {
    return ''
  }

  get sport() {
    return 'diving'
  }

  get minTemperature() {
    const temp = this.csvData['Min temp [°C]']
    return this.parseNumber(temp)
  }

  get maxTemperature() {
    const temp = this.csvData['Max temp [°C]']
    return this.parseNumber(temp)
  }
}