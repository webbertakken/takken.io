import { describe, it, expect } from 'vitest'
import { parseCsv } from '../../../core/utils/csvParser'
import { CsvDive } from './CsvDive'

describe('CSV Integration Tests', () => {
  // Real CSV data format test
  const realCsvData = `Date;Duration;Max depth [m];Min temp [°C];Max temp [°C];Dive mode
24/11/2023 14:40:00;01:00:20;19.2;26.5;27.6;NITROX
25/11/2023 09:30:00;00:45:15;15.8;24.1;25.3;AIR`

  describe('End-to-end CSV processing', () => {
    it('should parse CSV and create valid CsvDive objects', () => {
      const csvRows = parseCsv(realCsvData)
      expect(csvRows).toHaveLength(2)
      
      const firstDive = new CsvDive(csvRows[0])
      expect(firstDive.diveTime).toBe(60)
      expect(firstDive.maxDepth).toBe(19.2)
      expect(firstDive.minTemperature).toBe(26.5)
      expect(firstDive.maxTemperature).toBe(27.6)
      expect(firstDive.sport).toBe('diving')
      
      const secondDive = new CsvDive(csvRows[1])
      expect(secondDive.diveTime).toBe(45)
      expect(secondDive.maxDepth).toBe(15.8)
      expect(secondDive.minTemperature).toBe(24.1)
      expect(secondDive.maxTemperature).toBe(25.3)
    })

    it('should handle date parsing correctly', () => {
      const csvRows = parseCsv(realCsvData)
      const firstDive = new CsvDive(csvRows[0])
      const startTime = firstDive.startTime
      
      expect(startTime).toBeInstanceOf(Date)
      expect(startTime?.getFullYear()).toBe(2023)
      expect(startTime?.getMonth()).toBe(10) // November (0-indexed)
      expect(startTime?.getDate()).toBe(24)
      expect(startTime?.getHours()).toBe(14)
      expect(startTime?.getMinutes()).toBe(40)
    })

    it('should validate expected QR code format structure', () => {
      // Test the structure we expect to generate
      const mockSsiDive = {
        dive: null,
        noid: null,
        dive_type: 0,
        divetime: 60,
        datetime: 202311241440,
        depth_m: 19.2,
        user_firstname: '',
        user_lastname: '',
        watertemp_c: 26.5,
        watertemp_max_c: 27.6,
      }

      // Manual QR generation to test format
      const qrCode = Object.entries(mockSsiDive)
        .map(([key, value]) => (null === value ? key : `${key}:${value}`))
        .join(';')

      const expectedQr = 'dive;noid;dive_type:0;divetime:60;datetime:202311241440;depth_m:19.2;user_firstname:;user_lastname:;watertemp_c:26.5;watertemp_max_c:27.6'
      expect(qrCode).toBe(expectedQr)
    })

    it('should handle malformed CSV gracefully', () => {
      const malformedCsv = `This is not a CSV file
It has no semicolons or proper structure`
      
      expect(() => parseCsv(malformedCsv)).toThrow('No valid dive data found in CSV')
    })

    it('should handle CSV with missing fields', () => {
      const incompleteCsv = `Date;Notes
24/11/2023 14:40:00;Great dive`
      
      const csvRows = parseCsv(incompleteCsv)
      const dive = new CsvDive(csvRows[0])
      
      expect(dive.diveTime).toBeUndefined()
      expect(dive.maxDepth).toBeUndefined()
      expect(dive.minTemperature).toBeUndefined()
      expect(dive.maxTemperature).toBeUndefined()
    })
  })
})