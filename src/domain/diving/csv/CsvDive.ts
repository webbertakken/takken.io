// CSV dive data adapter following GarminDive interface pattern
export class CsvDive {
  constructor(private readonly csvData: Record<string, string>) {}

  private parseNumber(value: string | undefined): number | undefined {
    if (!value || value.trim() === '') return undefined
    const num = parseFloat(value.trim())
    return num // This will be NaN for invalid strings, valid number for valid strings
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
    if (parts.length < 2) return undefined
    
    const hours = this.parseInteger(parts[0]) || 0
    const minutes = this.parseInteger(parts[1]) || 0
    
    return hours * 60 + minutes
  }

  get startTime() {
    const dateStr = this.csvData['Date']
    if (!dateStr) return undefined
    
    const parts = dateStr.split(' ')
    if (parts.length < 2) return undefined
    
    const [datePart, timePart] = parts
    const dateParts = datePart.split('/')
    const timeParts = timePart.split(':')
    
    // Be more lenient to match original behavior - just need some parts
    if (dateParts.length === 0 || timeParts.length === 0) return undefined
    
    const day = this.parseInteger(dateParts[0])
    const month = this.parseInteger(dateParts[1])
    const year = this.parseInteger(dateParts[2])
    const hour = this.parseInteger(timeParts[0])
    const minute = this.parseInteger(timeParts[1])
    
    // Create Date object even with potentially invalid values (maintains backward compatibility)
    // parseInt can return NaN for unparseable strings, and Date constructor handles NaN
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