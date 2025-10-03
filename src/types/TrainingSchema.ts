import { z } from 'zod'
import { ExerciceSchema } from './ExerciceSchema.ts'
import { Timestamp } from 'firebase/firestore' // ton schema existant

type FirestoreTimestampJson = {
  type: 'firestore/timestamp/1.0'
  seconds: number
  nanoseconds: number
}
export const dateWithDefault = () =>
  z.preprocess((val) => {
    if (val === undefined) {
      return new Date() // valeur par défaut
    }
    if (typeof val === 'string') {
      return new Date(val) // string → Date
    }
    if (val instanceof Timestamp) {
      return val.toDate()
    }
    // Firestore JSON {type: 'firestore/timestamp/1.0', seconds, nanoseconds}
    // Firestore JSON {type: 'firestore/timestamp/1.0', seconds, nanoseconds}
    if (typeof val === 'object' && val !== null && 'type' in val) {
      const candidate = val as Partial<FirestoreTimestampJson>
      if (
        candidate.type === 'firestore/timestamp/1.0' &&
        typeof candidate.seconds === 'number' &&
        typeof candidate.nanoseconds === 'number'
      ) {
        return new Date(candidate.seconds * 1000 + candidate.nanoseconds / 1_000_000)
      }
    }

    // Déjà une Date ?
    if (val instanceof Date) {
      return val
    }

    return val // si c'est déjà une Date
  }, z.date())
export const TrainingSchema = z.object({
  id: z.string(), // identifiant unique (toujours présent)
  name: z.string().optional(),
  exercices: z.array(ExerciceSchema),
  ctime: dateWithDefault(),
  mtime: dateWithDefault(),
})

export type Training = z.infer<typeof TrainingSchema>
