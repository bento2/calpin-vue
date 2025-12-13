import { describe, it, expect } from 'vitest'
import { forHumans } from '@/composables/forHumans'

describe('forHumans', () => {
  it('devrait formater les secondes correctement', () => {
    // 0 secondes -> 0:00:00
    expect(forHumans(0)).toBe('0:00:00')

    // 59 secondes -> 0:00:59
    expect(forHumans(59)).toBe('0:00:59')

    // 60 secondes (1 minute) -> 0:01:00
    expect(forHumans(60)).toBe('0:01:00')

    // 3599 secondes (59 min 59 sec) -> 0:59:59
    expect(forHumans(3599)).toBe('0:59:59')

    // 3600 secondes (1 heure) -> 1:00:00
    expect(forHumans(3600)).toBe('1:00:00')

    // 3661 secondes (1 heure 1 min 1 sec) -> 1:01:01
    expect(forHumans(3661)).toBe('1:01:01')

    // Grand nombre de secondes
    expect(forHumans(36000)).toBe('10:00:00')
    // Très grand nombre de secondes
    expect(forHumans(360000)).toBe('100:00:00')
  })
})
