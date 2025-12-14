import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_FILE = path.resolve(__dirname, '../src/assets/exercises.json')
const OUTPUT_FILE = path.resolve(__dirname, '../src/assets/exercises-tabular.json')

type Exercise = Record<string, unknown>

/**
 * Converts an array of objects to a Structure of Arrays (tabular format).
 * Returns { keys: string[], data: any[][] }
 */
function toStructureOfArrays(exercises: Exercise[]) {
  if (exercises.length === 0) return { keys: [], data: [] }

  // 1. Collect all unique keys
  const keys = Array.from(new Set(exercises.flatMap((e) => Object.keys(e))))

  // 2. Create rows based on keys order
  const data = exercises.map((ex) => {
    return keys.map((key) => ex[key])
  })

  return { keys, data }
}

function optimize() {
  console.log('Reading exercises.json...')
  const rawData = fs.readFileSync(INPUT_FILE, 'utf-8')
  const exercises = JSON.parse(rawData)

  console.log(`Original size: ${(rawData.length / 1024).toFixed(2)} KB`)

  console.log('Converting to tabular format (Structure of Arrays)...')
  const optimizedData = toStructureOfArrays(exercises)
  const jsonString = JSON.stringify(optimizedData)

  console.log(`Optimized JSON size: ${(jsonString.length / 1024).toFixed(2)} KB`)

  fs.writeFileSync(OUTPUT_FILE, jsonString)
  console.log(`Saved to ${OUTPUT_FILE}`)
}

optimize()
