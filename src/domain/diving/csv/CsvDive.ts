// CSV dive data adapter following GarminDive interface pattern
export class CsvDive {
  constructor(private readonly csvData: Record<string, string>) {}

  get diveTime() {
    const duration = this.csvData['Duration']
    if (!duration) return undefined
    
    const parts = duration.split(':')
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }

  get startTime() {
    const dateStr = this.csvData['Date']
    if (!dateStr) return undefined
    
    const [datePart, timePart] = dateStr.split(' ')
    const [day, month, year] = datePart.split('/')
    const [hour, minute] = timePart.split(':')
    
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
  }

  get maxDepth() {
    const depth = this.csvData['Max depth [m]']
    return depth ? parseFloat(depth) : undefined
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
    return temp ? parseFloat(temp) : undefined
  }

  get maxTemperature() {
    const temp = this.csvData['Max temp [°C]']
    return temp ? parseFloat(temp) : undefined
  }
}