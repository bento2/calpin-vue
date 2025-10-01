import { z } from 'zod'

export const SerieSchema = z.object({
  poids: z.number(),
  repetitions: z.number(),
  checked: z.boolean().optional(), // true si la série est validée
})

export type Serie = z.infer<typeof SerieSchema>
