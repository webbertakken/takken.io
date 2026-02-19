import { describe, it, expect } from 'vitest'
import { CsvDive } from './CsvDive'

describe('CsvDive', () => {
  // Test data based on the actual CSV format
  const validCsvData = {
    'Date': '24/11/2023 14:40:00',
    'Duration': '01:00:20',
    'Max depth [m]': '19.2',
    'Min temp [°C]': '26.5',
    'Max temp [°C]': '27.6',
    'Dive mode': 'NITROX',
  }

  describe('Positive scenarios', () => {
    it('should parse dive time correctly from HH:MM:SS format', () => {
      const dive = new CsvDive(validCsvData)
      expect(dive.diveTime).toBe(60) // 1 hour = 60 minutes
    })

    it('should parse dive time for various durations', () => {
      const testCases = [
        { duration: '00:30:15', expected: 30 },
        { duration: '02:15:45', expected: 135 },
        { duration: '00:05:00', expected: 5 },
      ]

      testCases.forEach(({ duration, expected }) => {
        const dive = new CsvDive({ ...validCsvData, 'Duration': duration })
        expect(dive.diveTime).toBe(expected)
      })
    })

    it('should parse start time correctly from DD/MM/YYYY HH:MM:SS format', () => {
      const dive = new CsvDive(validCsvData)
      const startTime = dive.startTime
      
      expect(startTime).toBeInstanceOf(Date)
      expect(startTime?.getFullYear()).toBe(2023)
      expect(startTime?.getMonth()).toBe(10) // November (0-indexed)
      expect(startTime?.getDate()).toBe(24)
      expect(startTime?.getHours()).toBe(14)
      expect(startTime?.getMinutes()).toBe(40)
    })

    it('should parse max depth correctly', () => {
      const dive = new CsvDive(validCsvData)
      expect(dive.maxDepth).toBe(19.2)
    })

    it('should parse temperature values correctly', () => {
      const dive = new CsvDive(validCsvData)
      expect(dive.minTemperature).toBe(26.5)
      expect(dive.maxTemperature).toBe(27.6)
    })

    it('should handle decimal values in depth and temperature', () => {
      const data = {
        ...validCsvData,
        'Max depth [m]': '15.75',
        'Min temp [°C]': '22.3',
        'Max temp [°C]': '24.8',
      }
      const dive = new CsvDive(data)
      
      expect(dive.maxDepth).toBe(15.75)
      expect(dive.minTemperature).toBe(22.3)
      expect(dive.maxTemperature).toBe(24.8)
    })

    it('should return default values for names and sport', () => {
      const dive = new CsvDive(validCsvData)
      expect(dive.firstName).toBe('')
      expect(dive.lastName).toBe('')
      expect(dive.sport).toBe('diving')
    })
  })

  describe('Negative scenarios', () => {
    it('should return undefined for missing duration', () => {
      const data = { ...validCsvData, 'Duration': undefined }
      const dive = new CsvDive(data)
      expect(dive.diveTime).toBeUndefined()
    })

    it('should return undefined for empty duration', () => {
      const dive = new CsvDive({ ...validCsvData, 'Duration': '' })
      expect(dive.diveTime).toBeUndefined()
    })

    it('should return undefined for missing date', () => {
      const data = { ...validCsvData, 'Date': undefined }
      const dive = new CsvDive(data)
      expect(dive.startTime).toBeUndefined()
    })

    it('should return undefined for empty date', () => {
      const dive = new CsvDive({ ...validCsvData, 'Date': '' })
      expect(dive.startTime).toBeUndefined()
    })

    it('should return undefined for missing depth', () => {
      const data = { ...validCsvData, 'Max depth [m]': undefined }
      const dive = new CsvDive(data)
      expect(dive.maxDepth).toBeUndefined()
    })

    it('should return undefined for empty depth', () => {
      const dive = new CsvDive({ ...validCsvData, 'Max depth [m]': '' })
      expect(dive.maxDepth).toBeUndefined()
    })

    it('should return undefined for missing temperature values', () => {
      const data = { 
        ...validCsvData, 
        'Min temp [°C]': undefined,
        'Max temp [°C]': undefined
      }
      const dive = new CsvDive(data)
      
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
    })

    it('should return undefined for empty temperature values', () => {
      const dive = new CsvDive({
        ...validCsvData,
        'Min temp [°C]': '',
        'Max temp [°C]': '',
      })
      
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
    })

    it('should handle malformed duration gracefully', () => {
      const testCases = [
        { duration: 'invalid', expected: undefined },
        { duration: '25:99:99', expected: undefined }, // Invalid time values
        { duration: 'abc:def:ghi', expected: undefined },
        { duration: '1:2', expected: 1 }, // Valid MM:SS format
        { duration: '12345678901234567890:12:34', expected: undefined }, // Extremely long input
        { duration: 'Infinity:Infinity:Infinity', expected: undefined },
        { duration: 'NaN:NaN:NaN', expected: undefined },
      ]
      
      testCases.forEach(({ duration, expected }) => {
        const dive = new CsvDive({ ...validCsvData, 'Duration': duration })
        const diveTime = dive.diveTime
        expect(diveTime).toBe(expected)
      })
    })

    it('should handle malformed date gracefully', () => {
      const testCases = [
        'invalid date',
        '32/13/2023 25:99:99', // Invalid day/month/hour/minute
        'abc/def/ghij hh:mm:ss', // Non-numeric parts
        '2023-11-24 14:40:00', // Wrong format (ISO instead of DD/MM/YYYY)
        '24/11/2023', // Missing time part
        '14:40:00', // Missing date part
        '', // Empty string
        '24/11/2023 14:40:00 extra', // Too many parts
        '99/99/9999 99:99:99', // Out of range values
      ]
      
      testCases.forEach(date => {
        const dive = new CsvDive({ ...validCsvData, 'Date': date })
        const startTime = dive.startTime
        expect(startTime).toBeUndefined()
      })
    })

    it('should handle non-numeric depth and temperature values', () => {
      const dive = new CsvDive({
        ...validCsvData,
        'Max depth [m]': 'very deep',
        'Min temp [°C]': 'cold',
        'Max temp [°C]': 'warm',
      })
      
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
    })

    it('should handle malicious input attempts', () => {
      const maliciousInputs = {
        'Max depth [m]': 'JavaScript:alert("XSS")',
        'Min temp [°C]': '../../etc/passwd',
        'Max temp [°C]': '<script>alert("XSS")</script>',
        'Duration': '00:00:00; DROP TABLE users;',
        'Date': '24/11/2023 14:40:00\u0000\u0001\u0002',
      }
      
      const dive = new CsvDive(maliciousInputs)
      
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
      expect(dive.diveTime).toBeUndefined()
      expect(dive.startTime).toBeUndefined() // Now properly validates and rejects malicious date
    })

    it('should handle date-specific security attacks', () => {
      const dateAttacks = [
        'X'.repeat(1000) + ' 14:40:00', // Extremely long date string
        '01/01/1800 14:40:00', // Year before valid range
        '01/01/2200 14:40:00', // Year after valid range
        '00/01/2023 14:40:00', // Invalid day (0)
        '32/01/2023 14:40:00', // Invalid day (32)
        '01/00/2023 14:40:00', // Invalid month (0)
        '01/13/2023 14:40:00', // Invalid month (13)
        '01/01/2023 25:00:00', // Invalid hour (25)
        '01/01/2023 14:60:00', // Invalid minute (60)
        '../../etc/passwd 14:40:00', // Path traversal attempt
        '<script>alert("XSS")</script> 14:40:00', // XSS attempt
        'null null null', // Null injection
        'undefined undefined undefined', // Undefined injection
      ]
      
      dateAttacks.forEach(dateStr => {
        const dive = new CsvDive({ ...validCsvData, 'Date': dateStr })
        expect(dive.startTime).toBeUndefined()
      })
    })

    it('should handle extremely large numeric strings', () => {
      const extremeInputs = {
        'Max depth [m]': '9'.repeat(100),
        'Min temp [°C]': '1'.repeat(50),
        'Max temp [°C]': '123456789012345678901234567890',
        'Duration': '999999999999999999:999999999999999999:999999999999999999',
      }
      
      const dive = new CsvDive(extremeInputs)
      
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
      expect(dive.diveTime).toBeUndefined()
    })

    it('should handle special numeric values', () => {
      const specialValues = {
        'Max depth [m]': 'Infinity',
        'Min temp [°C]': '-Infinity',
        'Max temp [°C]': 'NaN',
        'Duration': 'Infinity:NaN:-Infinity',
      }
      
      const dive = new CsvDive(specialValues)
      
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
      expect(dive.diveTime).toBeUndefined()
    })

    it('should handle empty CSV data object', () => {
      const dive = new CsvDive({})
      
      expect(dive.diveTime).toBeUndefined()
      expect(dive.startTime).toBeUndefined()
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
      expect(dive.firstName).toBe('')
      expect(dive.lastName).toBe('')
      expect(dive.sport).toBe('diving')
    })

    it('should handle undefined properties identically to missing properties', () => {
      const undefinedData = {
        'Date': undefined,
        'Duration': undefined,
        'Max depth [m]': undefined,
        'Min temp [°C]': undefined,
        'Max temp [°C]': undefined,
      }
      
      const diveUndefined = new CsvDive(undefinedData)
      const diveMissing = new CsvDive({})
      
      // Security: ensure undefined and missing properties behave identically
      expect(diveUndefined.diveTime).toBe(diveMissing.diveTime)
      expect(diveUndefined.startTime).toBe(diveMissing.startTime)
      expect(diveUndefined.maxDepth).toBe(diveMissing.maxDepth)
      expect(diveUndefined.minTemperature).toBe(diveMissing.minTemperature)
      expect(diveUndefined.maxTemperature).toBe(diveMissing.maxTemperature)
    })
  })
})