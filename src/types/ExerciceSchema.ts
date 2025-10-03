import { z } from 'zod'

export const DifficultySchema = z.enum(['débutant', 'intermédiaire', 'avancé'])
export const BaseExerciceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  equipment: z.string().optional(),
  type: z.string().optional(),
  muscles_principaux: z.array(z.string().optional()).optional(),
  muscles_secondaires: z.array(z.string().optional()).optional(),
})
export function addExerciceGetters<T extends z.infer<typeof BaseExerciceSchema>>(data: T) {
  return {
    ...data,
    get hasEquipment() {
      return data.equipment && data.equipment.length !== 0 && data.equipment !== 'Aucun'
    },
  }
}
export const ExerciceSchema = BaseExerciceSchema.transform(addExerciceGetters)
export const ExerciceArraySchema = z.array(ExerciceSchema)

export type Exercice = z.infer<typeof ExerciceSchema>
