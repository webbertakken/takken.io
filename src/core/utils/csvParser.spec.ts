import { describe, it, expect } from 'vitest'
import { parseCsv } from './csvParser'

describe('csvParser', () => {
  const sampleCsvHeaders = 'Date;Duration;Surface time;Max depth [m];Average depth [m];Min temp [°C];Max temp [°C];Dive mode'
  const sampleDiveRow = '24/11/2023 14:40:00;01:00:20;01:26:00;19.2;11.5;26.5;27.6;NITROX'
  const metadataRow = 'CSV Generator;Generated @;Imported @;DB Version'
  const invalidRow = 'Some random text without proper format'

  describe('Positive scenarios', () => {
    it('should parse valid CSV with single dive row', () => {
      const csvText = `${sampleCsvHeaders}\n${sampleDiveRow}`
      const result = parseCsv(csvText)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        'Date': '24/11/2023 14:40:00',
        'Duration': '01:00:20',
        'Surface time': '01:26:00',
        'Max depth [m]': '19.2',
        'Average depth [m]': '11.5',
        'Min temp [°C]': '26.5',
        'Max temp [°C]': '27.6',
        'Dive mode': 'NITROX',
      })
    })

    it('should parse CSV with multiple dive rows', () => {
      const csvText = [
        sampleCsvHeaders,
        '24/11/2023 14:40:00;01:00:20;01:26:00;19.2;11.5;26.5;27.6;NITROX',
        '25/11/2023 09:30:00;00:45:15;02:15:00;15.8;9.2;24.1;25.3;AIR',
        '26/11/2023 16:20:00;01:15:30;01:45:00;22.5;13.7;23.8;24.9;NITROX',
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(3)
      expect(result[0]['Date']).toBe('24/11/2023 14:40:00')
      expect(result[1]['Date']).toBe('25/11/2023 09:30:00')
      expect(result[2]['Date']).toBe('26/11/2023 16:20:00')
    })

    it('should filter out non-dive data rows while keeping dive rows', () => {
      const csvText = [
        sampleCsvHeaders,
        sampleDiveRow,
        '',
        metadataRow,
        'Computer;Serial number;Computer ID',
        'Puck Pro;49288-192899;2',
        '25/11/2023 09:30:00;00:45:15;02:15:00;15.8;9.2;24.1;25.3;AIR',
        '',
        'Alarms/Warnings',
        'NO ALARM/WARNING',
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(2) // Only the two dive rows
      expect(result[0]['Date']).toBe('24/11/2023 14:40:00')
      expect(result[1]['Date']).toBe('25/11/2023 09:30:00')
    })

    it('should handle extra whitespace in CSV data', () => {
      const csvText = [
        '  Date  ; Duration ; Max depth [m] ',
        ' 24/11/2023 14:40:00 ; 01:00:20 ; 19.2 ',
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        'Date': '24/11/2023 14:40:00',
        'Duration': '01:00:20',
        'Max depth [m]': '19.2',
      })
    })

    it('should handle missing values in CSV cells', () => {
      const csvText = [
        'Date;Duration;Max depth [m];Notes',
        '24/11/2023 14:40:00;01:00:20;;Great dive',
        '25/11/2023 09:30:00;;15.8;',
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(2)
      expect(result[0]['Max depth [m]']).toBe('')
      expect(result[1]['Duration']).toBe('')
      expect(result[1]['Notes']).toBe('')
    })

    it('should handle CSV with different column count than headers', () => {
      const csvText = [
        'Date;Duration;Max depth [m]',
        '24/11/2023 14:40:00;01:00:20;19.2;Extra;Values',
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        'Date': '24/11/2023 14:40:00',
        'Duration': '01:00:20',
        'Max depth [m]': '19.2',
      })
    })
  })

  describe('Negative scenarios', () => {
    it('should throw error for empty CSV text', () => {
      expect(() => parseCsv('')).toThrow('CSV file must contain header and data rows')
    })

    it('should throw error for CSV with only whitespace', () => {
      expect(() => parseCsv('   \n  \n  ')).toThrow('CSV file must contain header and data rows')
    })

    it('should throw error for CSV with only headers', () => {
      expect(() => parseCsv(sampleCsvHeaders)).toThrow('CSV file must contain header and data rows')
    })

    it('should throw error for CSV with headers but no valid dive data', () => {
      const csvText = [
        sampleCsvHeaders,
        metadataRow,
        'Computer;Serial number;Computer ID',
        'Puck Pro;49288-192899;2',
        '',
        'Some other metadata',
      ].join('\n')
      
      expect(() => parseCsv(csvText)).toThrow('No valid dive data found in CSV')
    })

    it('should throw error when no rows contain date/time patterns', () => {
      const csvText = [
        'Column1;Column2;Column3',
        'Value1;Value2;Value3',
        'Another;Row;Here',
      ].join('\n')
      
      expect(() => parseCsv(csvText)).toThrow('No valid dive data found in CSV')
    })

    it('should filter out rows with insufficient columns', () => {
      const csvText = [
        'Date;Duration;Max depth [m];Min temp [°C]', // 4 columns
        '24/11/2023 14:40:00;01:00:20;19.2;26.5', // 4 columns - valid
        '25/11/2023 09:30:00;00:45:15', // 2 columns - invalid
        '26/11/2023 16:20:00;01:15:30;22.5;23.8', // 4 columns - valid
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(2) // Only rows with sufficient columns
      expect(result[0]['Date']).toBe('24/11/2023 14:40:00')
      expect(result[1]['Date']).toBe('26/11/2023 16:20:00')
    })

    it('should handle malformed CSV gracefully', () => {
      const csvText = [
        'Date;Duration;Max depth [m]',
        'Not a date;Not a duration;Not a depth',
        'Still not valid data',
      ].join('\n')
      
      expect(() => parseCsv(csvText)).toThrow('No valid dive data found in CSV')
    })

    it('should handle CSV with only newlines', () => {
      expect(() => parseCsv('\n\n\n')).toThrow('CSV file must contain header and data rows')
    })

    it('should handle CSV with mixed line endings', () => {
      const csvText = 'Date;Duration;Max depth [m]\r\n24/11/2023 14:40:00;01:00:20;19.2\r\n'
      const result = parseCsv(csvText)
      
      expect(result).toHaveLength(1)
      expect(result[0]['Date']).toBe('24/11/2023 14:40:00')
    })

    it('should require both slash and colon for dive data detection', () => {
      const csvText = [
        'Column1;Column2;Column3',
        'Has / slash;No colon;Value3', // Has slash but no colon
        'No slash;Has : colon;Value3', // Has colon but no slash
        '24/11/2023;14:40:00;Value3', // Has both - valid pattern
      ].join('\n')
      
      const result = parseCsv(csvText)
      expect(result).toHaveLength(1)
      expect(result[0]['Column1']).toBe('24/11/2023')
    })
  })
})