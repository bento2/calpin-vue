import type { Training } from '@/types/TrainingSchema.ts'
import type { Session } from '@/types/SessionSchema.ts'
import type { Exercice } from '@/types/ExerciceSchema.ts'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema.ts'

export default class SessionService {
  static createFromTraining(
    training: Training,
    options?: {
      name?: string
      startTime?: Date
    },
  ): Session {
    const startTime = options?.startTime || new Date()

    return {
      id: this.generateId(),
      trainingId: training.id,
      name: options?.name || `${training.name} - ${startTime.toLocaleDateString()}`,
      dateDebut: startTime.toISOString(),
      dateFin: undefined,
      exercices: this.initializeExercices(training.exercices),
      status: 'en_cours',
    }
  }

  private static initializeExercices(
    exercices: Exercice[],
    defaultSeriesCount: number = 4,
  ): ExerciceSeries[] {
    return exercices.map((exercice) => ({
      ...exercice,
      series: Array.from({ length: defaultSeriesCount }, () => ({
        poids: 0,
        repetitions: 0,
        checked: false,
      })),
    }))
  }

  private static generateId(): string {
    return crypto.randomUUID()
  }
}
