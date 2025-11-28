import { describe, it, expect } from 'vitest'
import SessionService from '@/services/SessionService'
import type { Training } from '@/types/TrainingSchema'
import { addExerciceGetters } from '@/types/ExerciceSchema'

describe('SessionService', () => {
  const mockTraining: Training = {
    id: 't1',
    name: 'Training 1',
    exercices: [
      addExerciceGetters({
        id: 'e1',
        name: 'Ex 1',
      }),
    ],
    ctime: new Date(),
    mtime: new Date(),
  }

  it('should create session from training with defaults', () => {
    const session = SessionService.createFromTraining(mockTraining)

    expect(session.id).toBeDefined()
    expect(session.trainingId).toBe(mockTraining.id)
    expect(session.name).toContain('Training 1')
    expect(session.dateDebut).toBeInstanceOf(Date)
    expect(session.status).toBe('en_cours')
    expect(session.exercices).toHaveLength(1)
    expect(session.exercices[0].series).toHaveLength(4) // Default series count
  })

  it('should create session with custom name and start time', () => {
    const startTime = new Date('2023-01-01')
    const session = SessionService.createFromTraining(mockTraining, {
      name: 'Custom Session',
      startTime,
    })

    expect(session.name).toBe('Custom Session')
    expect(session.dateDebut).toBe(startTime)
  })
})
