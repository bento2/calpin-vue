export function stringToHue(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export function generatePastelColor(name: string | null | undefined): string {
  if (!name) return '#e0e0e0' // neutral grey for anonymous
  const hue = stringToHue(name)
  // use HSL for pleasant pastel backgrounds
  return `hsl(${hue} 60% 75%)`
}
