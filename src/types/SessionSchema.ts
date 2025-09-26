import { z } from 'zod';
import { ExerciceSeriesSchema } from '@/types/ExerciceSeriesSchema.ts'
import { dateWithDefault } from '@/types/TrainingSchema.ts'


export const SessionStatusSchema = z.enum(['en_cours', 'terminee']);


export const SessionSchema = z.object({
  id: z.string(),
  trainingId: z.string(), // référence à l'entraînement utilisé
  name: z.string().optional(),
  dateDebut: dateWithDefault(),
  dateFin: dateWithDefault().optional(),
  exercices: z.array(ExerciceSeriesSchema),
  status: SessionStatusSchema,
});

export type Session = z.infer<typeof SessionSchema>;
