import { describe, it, expect } from 'vitest'
import { stringToHue, generatePastelColor } from '@/utils/colorUtils'

describe('colorUtils', () => {
  it('stringToHue returns consistent result', () => {
    expect(stringToHue('Test')).toBe(stringToHue('Test'))
    expect(stringToHue('Test')).not.toBe(stringToHue('Other'))
  })

  it('generatePastelColor returns grey for null', () => {
    expect(generatePastelColor(null)).toBe('#e0e0e0')
  })

  it('generatePastelColor returns hsl color', () => {
    const color = generatePastelColor('Test')
    expect(color).toMatch(/^hsl\(\d+ 60% 75%\)$/)
  })
})
