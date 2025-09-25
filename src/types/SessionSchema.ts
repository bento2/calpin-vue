import { z } from 'zod';
import { ExerciceSeriesSchema } from '@/types/ExerciceSeriesSchema.ts'


export const SessionStatusSchema = z.enum(['en_cours', 'terminee']);


export const SessionSchema = z.object({
  id: z.string(),
  trainingId: z.string(), // référence à l'entraînement utilisé
  name: z.string().optional(),
  dateDebut: z.string(), // ISO string
  dateFin: z.string().optional(), // ISO string
  exercices: z.array(ExerciceSeriesSchema),
  status: SessionStatusSchema,
});

export type Session = z.infer<typeof SessionSchema>;
