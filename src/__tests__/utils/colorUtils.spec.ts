import { describe, it, expect } from 'vitest'
import { stringToHue, generatePastelColor } from '@/utils/colorUtils'

describe('colorUtils', () => {
  it('stringToHue retourne un résultat cohérent', () => {
    expect(stringToHue('Test')).toBe(stringToHue('Test'))
    expect(stringToHue('Test')).not.toBe(stringToHue('Other'))
  })

  it('generatePastelColor retourne gris pour null', () => {
    expect(generatePastelColor(null)).toBe('#e0e0e0')
  })

  it('generatePastelColor retourne une couleur hsl', () => {
    const color = generatePastelColor('Test')
    expect(color).toMatch(/^hsl\(\d+ 60% 75%\)$/)
  })
})
