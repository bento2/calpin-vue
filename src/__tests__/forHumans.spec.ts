import { describe, it, expect } from 'vitest'
import { forHumans } from '../composables/forHumans'

describe('forHumans', () => {
  it('should format seconds correctly', () => {
    // 0 seconds -> 0:00:00
    expect(forHumans(0)).toBe('0:00:00')

    // 59 seconds -> 0:00:59
    expect(forHumans(59)).toBe('0:00:59')

    // 60 seconds (1 minute) -> 0:01:00
    expect(forHumans(60)).toBe('0:01:00')

    // 3599 seconds (59 min 59 sec) -> 0:59:59
    expect(forHumans(3599)).toBe('0:59:59')

    // 3600 seconds (1 hour) -> 1:00:00
    expect(forHumans(3600)).toBe('1:00:00')

    // 3661 seconds (1 hour 1 min 1 sec) -> 1:01:01
    expect(forHumans(3661)).toBe('1:01:01')

    // Large number of seconds
    expect(forHumans(36000)).toBe('10:00:00')
    // Very large number of seconds
    expect(forHumans(360000)).toBe('100:00:00')
  })
})
