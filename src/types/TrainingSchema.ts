import { z } from 'zod';
import { ExerciceSchema } from './ExerciceSchema.ts'; // ton schema existant

export const TrainingSchema = z.object({
  id: z.string(),          // identifiant unique (toujours présent)
  name: z.string().optional(),
  exercices: z.array(ExerciceSchema),
});

export type Training = z.infer<typeof TrainingSchema>;
