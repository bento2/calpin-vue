import { z } from 'zod';
import { ExerciceSeriesSchema } from './ExerciceSchema.ts'; // ton schema existant

export const SessionStatusSchema = z.enum(['en_cours', 'terminee']);


export const SessionSchema = z.object({
  id: z.string(),
  entrainementId: z.string(), // référence à l'entraînement utilisé
  name: z.string().optional(),
  dateDebut: z.string(), // ISO string
  dateFin: z.string().optional(), // ISO string
  exercices: z.array(ExerciceSeriesSchema),
  status: SessionStatusSchema,
});
