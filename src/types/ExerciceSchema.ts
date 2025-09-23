import { z } from 'zod';

export const DifficultySchema = z.enum(['débutant', 'intermédiaire', 'avancé']);
export const  ExerciceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
});
export const ExerciceArraySchema = z.array(ExerciceSchema);


export type Exercice = z.infer<typeof ExerciceSchema>;
