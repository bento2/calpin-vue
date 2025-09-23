import exercisesData from '@/assets/exercises.json'
import { ExerciceArraySchema } from '@/types/ExerciceSchema'
import type { Exercice } from '@/types/ExerciceSchema'

export class ExerciceUtils {
  protected exercices?: Exercice[] | null = null

  async getById(id: string): Promise<Exercice | null | undefined> {
    return this.init().then((exercices) => {
      return exercices.find((exercice) => exercice.id === id)
    })
  }

  async getAll(): Promise<Exercice[]> {
    return this.init()
  }

  protected async init(): Promise<Exercice[]> {
    if (!this.exercices) {
      this.exercices = ExerciceArraySchema.parse(exercisesData)
    }
    return this.exercices
  }
}
