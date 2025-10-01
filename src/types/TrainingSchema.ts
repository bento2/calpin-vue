import { z } from 'zod'
import { ExerciceSchema } from './ExerciceSchema.ts' // ton schema existant

export const dateWithDefault = () =>
  z.preprocess((val) => {
    if (val === undefined) {
      return new Date() // valeur par défaut
    }
    if (typeof val === 'string') {
      return new Date(val) // string → Date
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
