import { ExerciceArraySchema } from '@/types/ExerciceSchema'
import type { Exercice } from '@/types/ExerciceSchema'

type FindOptions = {
  nb?: number
  page?: number
  filter?: string
}

type TabularData = {
  keys: string[]
  data: unknown[][]
}

export class ExerciceUtils {
  private static instancePromise: Promise<ExerciceUtils> | null = null
  private readonly exercices: Exercice[]

  private constructor(exercices: Exercice[]) {
    this.exercices = exercices
  }

  public static async getInstance(): Promise<ExerciceUtils> {
    if (!ExerciceUtils.instancePromise) {
      ExerciceUtils.instancePromise = (async () => {
        try {
          const module = await import('@/assets/exercises-tabular.json')
          const json = module.default as TabularData

          // Reconstruct objects from tabular format
          const { keys, data } = json
          const reconstructed = data.map((row) => {
            const obj: Record<string, unknown> = {}
            keys.forEach((key, index) => {
              obj[key] = row[index]
            })
            return obj
          })

          const parsedExercices = ExerciceArraySchema.parse(reconstructed)
          return new ExerciceUtils(parsedExercices)
        } catch (error) {
          console.error('Error loading exercises:', error)
          // Fallback or empty if failed
          return new ExerciceUtils([])
        }
      })()
    }
    return ExerciceUtils.instancePromise
  }

  find({ nb = 10, page = 0, filter = '' }: FindOptions = {}): Exercice[] {
    return this.exercices
      .filter((item) =>
        filter === ''
          ? true
          : item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.equipment?.toLowerCase().includes(filter.toLowerCase()),
      )
      .slice(page * nb, page * nb + nb)
  }

  findById(id: string): Exercice | null {
    return this.exercices.find((exercice) => exercice.id === id) ?? null
  }

  all(): Exercice[] {
    return this.exercices
  }
}
