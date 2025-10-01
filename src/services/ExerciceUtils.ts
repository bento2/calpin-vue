import exercisesData from '@/assets/exercises.json'
import { ExerciceArraySchema } from '@/types/ExerciceSchema'
import type { Exercice } from '@/types/ExerciceSchema'

type FindOptions = {
  nb?: number
  page?: number
  filter?: string
}

export class ExerciceUtils {
  private static instance: ExerciceUtils
  private readonly exercices: Exercice[]

  private constructor() {
    // Ici le parsing/validation est fait immédiatement
    this.exercices = ExerciceArraySchema.parse(exercisesData)
  }

  public static getInstance(): ExerciceUtils {
    if (!ExerciceUtils.instance) {
      ExerciceUtils.instance = new ExerciceUtils()
    }
    return ExerciceUtils.instance
  }

  find({ nb = 10, page = 0, filter = '' }: FindOptions = {}): Exercice[] {
    return this.exercices
      .filter((item) =>
        filter === '' ? true : item.name.toLowerCase().includes(filter.toLowerCase()),
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
