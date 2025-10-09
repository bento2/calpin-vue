/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the amount of time
 */
export function forHumans(seconds: number) {
  return (
    Math.floor(seconds / 3600).toString() +
    ':' +
    Math.floor((seconds % 3600) / 60).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    }) +
    ':' +
    ((seconds % 3600) % 60).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })
  )
}
