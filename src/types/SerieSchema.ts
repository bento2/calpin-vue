import { z } from 'zod'

export const SerieSchema = z
  .object({
    poids: z.number().optional().nullable(),
    repetitions: z.number().optional().nullable(),
    checked: z.boolean().optional(), // true si la série est validée
  })
  .transform((data) => {
    return {
      ...data,
      get total() {
        if (data.poids && data.repetitions) return data.poids * data.repetitions
        return 0
      },
    }
  })

export type Serie = z.infer<typeof SerieSchema>
