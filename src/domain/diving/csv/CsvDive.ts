// CSV dive data adapter following GarminDive interface pattern
export class CsvDive {
  constructor(private readonly csvData: Record<string, string>) {}

  private parseNumber(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined
    
    // Sanitize input to prevent potential issues
    const sanitizedValue = value.trim()
    if (sanitizedValue.length > 20) return undefined // Prevent extremely long strings
    
    const num = parseFloat(sanitizedValue)
    
    // Validate the parsed result is a valid finite number
    if (isNaN(num) || !Number.isFinite(num)) return undefined
    
    return num
  }

  private parseInteger(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined
    
    // Sanitize input to prevent potential issues
    const sanitizedValue = value.trim()
    if (sanitizedValue.length > 10) return undefined // Prevent extremely long strings
    
    const num = parseInt(sanitizedValue, 10)
    
    // Validate the parsed result is a valid finite integer
    if (isNaN(num) || !Number.isFinite(num)) return undefined
    
    return num
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
    
    // Sanitize input to prevent extremely long strings and control characters
    if (dateStr.length > 50) return undefined
    if (/[\x00-\x1F\x7F]/.test(dateStr)) return undefined // Reject control characters
    
    const parts = dateStr.split(' ')
    if (parts.length !== 2) return undefined
    
    const [datePart, timePart] = parts
    const dateParts = datePart.split('/')
    const timeParts = timePart.split(':')
    
    // Validate format: require exact format (DD/MM/YYYY HH:MM)
    if (dateParts.length !== 3 || timeParts.length < 2) return undefined
    
    const day = this.parseInteger(dateParts[0])
    const month = this.parseInteger(dateParts[1])
    const year = this.parseInteger(dateParts[2])
    const hour = this.parseInteger(timeParts[0])
    const minute = this.parseInteger(timeParts[1])
    
    // Validate all required parts are valid numbers
    if (day === undefined || month === undefined || year === undefined || 
        hour === undefined || minute === undefined) return undefined
    
    // Validate reasonable ranges to prevent malicious or invalid dates
    if (day < 1 || day > 31 || month < 1 || month > 12 || 
        year < 1900 || year > 2100 || hour < 0 || hour > 23 || 
        minute < 0 || minute > 59) return undefined
    
    const date = new Date(year, month - 1, day, hour, minute)
    
    // Final validation: ensure the Date object is valid
    return isNaN(date.getTime()) ? undefined : date
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