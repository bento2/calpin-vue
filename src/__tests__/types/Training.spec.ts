import { describe, it, expect } from 'vitest';
import { TrainingSchema } from '@/types/TrainingSchema.ts'

describe('Training', () => {
  it('doit être valide', () => {
    const training = {
      id: 't1',
      name: 'Séance du matin',
      exercices: [
        {
          id: 'e1',
          name: 'Pompes',
          category: 'Force',
          difficulty: 'débutant',
        },
      ],
    };

    expect(() => TrainingSchema.parse(training)).not.toThrow();
  });
});
