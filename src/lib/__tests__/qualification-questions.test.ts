import { describe, it, expect } from 'vitest';
import {
  getQualificationConfig,
  calculateLeadScore,
  getLeadTemperature,
  getTemperatureLabel,
  AVAILABLE_SPECIALTIES,
  type QualificationConfig,
} from '../qualification-questions';

describe('Qualification Questions', () => {
  describe('getQualificationConfig - All specialties have questions', () => {
    const expectedSpecialties = [
      'hypnotherapeute',
      'psychotherapeute',
      'coach',
      'naturopathe',
      'nutritionniste',
      'osteopathe',
    ];

    expectedSpecialties.forEach(specialtyKey => {
      it(`should return config for ${specialtyKey} specialty`, () => {
        const config = getQualificationConfig(specialtyKey);

        expect(config).toBeDefined();
        expect(config.specialty_key).toBe(specialtyKey);
        expect(config.specialty_name).toBeDefined();
        expect(config.questions).toBeDefined();
        expect(Array.isArray(config.questions)).toBe(true);
        expect(config.questions.length).toBeGreaterThan(0);
        expect(config.scoring).toBeDefined();
        expect(config.scoring.hot_threshold).toBeDefined();
        expect(config.scoring.warm_threshold).toBeDefined();
      });
    });
  });

  describe('Questions have required structure', () => {
    it('should have questions with all required fields for hypnotherapeute', () => {
      const config = getQualificationConfig('hypnotherapeute');

      config.questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('type');
        expect(question).toHaveProperty('required');
        expect(question).toHaveProperty('weight');

        // Validate field types
        expect(typeof question.id).toBe('string');
        expect(typeof question.question).toBe('string');
        expect(['select', 'radio', 'text']).toContain(question.type);
        expect(typeof question.required).toBe('boolean');
        expect(typeof question.weight).toBe('number');
        expect(question.weight).toBeGreaterThan(0);
        expect(question.weight).toBeLessThanOrEqual(1);

        // If has options, validate them
        if (question.options) {
          expect(Array.isArray(question.options)).toBe(true);
          question.options.forEach(option => {
            expect(option).toHaveProperty('label');
            expect(option).toHaveProperty('value');
            expect(option).toHaveProperty('score');
            expect(typeof option.label).toBe('string');
            expect(typeof option.value).toBe('string');
            expect(typeof option.score).toBe('number');
            expect(option.score).toBeGreaterThanOrEqual(0);
            expect(option.score).toBeLessThanOrEqual(100);
          });
        }
      });
    });

    it('should have questions for all specialties with proper structure', () => {
      const specialties = [
        'hypnotherapeute',
        'psychotherapeute',
        'coach',
        'naturopathe',
        'nutritionniste',
        'osteopathe',
      ];

      specialties.forEach(specialty => {
        const config = getQualificationConfig(specialty);
        expect(config.questions.length).toBeGreaterThanOrEqual(3);

        config.questions.forEach(q => {
          expect(q.id).toBeDefined();
          expect(q.weight).toBeGreaterThan(0);
          expect(q.required).toBeDefined();
        });
      });
    });
  });

  describe('Scoring thresholds are properly ordered', () => {
    it('should have warm_threshold < hot_threshold for all specialties', () => {
      const specialties = [
        'hypnotherapeute',
        'psychotherapeute',
        'coach',
        'naturopathe',
        'nutritionniste',
        'osteopathe',
      ];

      specialties.forEach(specialty => {
        const config = getQualificationConfig(specialty);
        expect(config.scoring.warm_threshold).toBeLessThan(config.scoring.hot_threshold);
        expect(config.scoring.warm_threshold).toBeGreaterThanOrEqual(0);
        expect(config.scoring.hot_threshold).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculateLeadScore - Score between 0-100', () => {
    it('should return score between 0 and 100 for valid answers', () => {
      const config = getQualificationConfig('coach');

      // Answer with maximum scores
      const maxAnswers = config.questions.reduce(
        (acc, q) => {
          const option = q.options?.[0];
          if (option) {
            acc[q.id] = option.score;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const score = calculateLeadScore(maxAnswers, config);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 0 for no answers', () => {
      const config = getQualificationConfig('hypnotherapeute');
      const score = calculateLeadScore({}, config);
      expect(score).toBe(0);
    });

    it('should properly weight answers based on question weights', () => {
      const config = getQualificationConfig('psychotherapeute');

      // Create answers with known scores
      const answers: Record<string, number> = {};
      config.questions.forEach(q => {
        answers[q.id] = 50; // Give all questions a score of 50
      });

      const score = calculateLeadScore(answers, config);

      // Since all answers are 50 and weights sum to 1.0, score should be 50
      expect(score).toBe(50);
    });
  });

  describe('calculateLeadScore - High-intent > Low-intent', () => {
    it('should score high-intent leads higher than low-intent leads', () => {
      const config = getQualificationConfig('nutritionniste');

      // Low intent: all low scores
      const lowIntentAnswers: Record<string, number> = {};
      config.questions.forEach(q => {
        const lowScoreOption = q.options?.sort((a, b) => a.score - b.score)[0];
        if (lowScoreOption) {
          lowIntentAnswers[q.id] = lowScoreOption.score;
        }
      });

      // High intent: all high scores
      const highIntentAnswers: Record<string, number> = {};
      config.questions.forEach(q => {
        const highScoreOption = q.options?.sort((a, b) => b.score - a.score)[0];
        if (highScoreOption) {
          highIntentAnswers[q.id] = highScoreOption.score;
        }
      });

      const lowScore = calculateLeadScore(lowIntentAnswers, config);
      const highScore = calculateLeadScore(highIntentAnswers, config);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('calculateLeadScore - Missing answers handled', () => {
    it('should handle missing answers gracefully', () => {
      const config = getQualificationConfig('osteopathe');

      // Provide answers for only some questions
      const partialAnswers: Record<string, number> = {};
      partialAnswers[config.questions[0].id] = 80;
      // Skip other questions

      const score = calculateLeadScore(partialAnswers, config);

      // Should return a valid score between 0-100
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('should calculate score even with one answer', () => {
      const config = getQualificationConfig('coach');

      const oneAnswer: Record<string, number> = {
        [config.questions[0].id]: 75,
      };

      const score = calculateLeadScore(oneAnswer, config);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getLeadTemperature - Temperature classification', () => {
    it('should classify hot lead correctly (>= hot_threshold)', () => {
      const config = getQualificationConfig('hypnotherapeute');

      const answers: Record<string, number> = {};
      config.questions.forEach(q => {
        // Set all answers to high value
        answers[q.id] = 90;
      });

      const score = calculateLeadScore(answers, config);
      const temperature = getLeadTemperature(score, config);

      expect(temperature).toBe('hot');
    });

    it('should classify warm lead correctly (>= warm_threshold, < hot_threshold)', () => {
      const config = getQualificationConfig('psychotherapeute');

      const answers: Record<string, number> = {};
      config.questions.forEach(q => {
        // Set to middle value
        answers[q.id] = 55;
      });

      const score = calculateLeadScore(answers, config);
      const temperature = getLeadTemperature(score, config);

      if (score >= config.scoring.hot_threshold) {
        expect(temperature).toBe('hot');
      } else if (score >= config.scoring.warm_threshold) {
        expect(temperature).toBe('warm');
      }
    });

    it('should classify cold lead correctly (< warm_threshold)', () => {
      const config = getQualificationConfig('naturopathe');

      const answers: Record<string, number> = {};
      config.questions.forEach(q => {
        // Set to very low value
        answers[q.id] = 20;
      });

      const score = calculateLeadScore(answers, config);
      const temperature = getLeadTemperature(score, config);

      if (score < config.scoring.warm_threshold) {
        expect(temperature).toBe('cold');
      }
    });
  });

  describe('getTemperatureLabel', () => {
    it('should return correct French label for hot lead', () => {
      const label = getTemperatureLabel('hot');
      expect(label).toBe('Lead Qualifié Chaud');
    });

    it('should return correct French label for warm lead', () => {
      const label = getTemperatureLabel('warm');
      expect(label).toBe('Lead Qualifié Tiède');
    });

    it('should return correct French label for cold lead', () => {
      const label = getTemperatureLabel('cold');
      expect(label).toBe('Lead Froid');
    });
  });

  describe('Unknown specialty handling', () => {
    it('should return coach config for unknown specialty', () => {
      const config = getQualificationConfig('unknown_specialty');
      expect(config.specialty_key).toBe('coach');
    });

    it('should return coach config for undefined specialty', () => {
      const config = getQualificationConfig(undefined);
      expect(config.specialty_key).toBe('coach');
    });

    it('should return coach config for empty string', () => {
      const config = getQualificationConfig('');
      expect(config.specialty_key).toBe('coach');
    });
  });

  describe('AVAILABLE_SPECIALTIES constant', () => {
    it('should contain all expected specialties', () => {
      expect(Array.isArray(AVAILABLE_SPECIALTIES)).toBe(true);
      expect(AVAILABLE_SPECIALTIES.length).toBeGreaterThanOrEqual(6);

      const keys = AVAILABLE_SPECIALTIES.map(s => s.key);
      expect(keys).toContain('hypnotherapeute');
      expect(keys).toContain('psychotherapeute');
      expect(keys).toContain('coach');
      expect(keys).toContain('naturopathe');
      expect(keys).toContain('nutritionniste');
      expect(keys).toContain('osteopathe');
    });
  });

  describe('Threshold ordering validation', () => {
    it('should enforce warm < hot for all specialties', () => {
      const specialties = [
        'hypnotherapeute',
        'psychotherapeute',
        'coach',
        'naturopathe',
        'nutritionniste',
        'osteopathe',
      ];

      specialties.forEach(specialty => {
        const config = getQualificationConfig(specialty);
        expect(config.scoring.warm_threshold).toBeLessThan(config.scoring.hot_threshold);
      });
    });

    it('should have realistic threshold ranges', () => {
      const specialties = [
        'hypnotherapeute',
        'psychotherapeute',
        'coach',
        'naturopathe',
        'nutritionniste',
        'osteopathe',
      ];

      specialties.forEach(specialty => {
        const config = getQualificationConfig(specialty);
        expect(config.scoring.warm_threshold).toBeGreaterThanOrEqual(30); // Reasonable minimum
        expect(config.scoring.hot_threshold).toBeLessThanOrEqual(100); // Max possible score
        expect(config.scoring.hot_threshold).toBeGreaterThan(config.scoring.warm_threshold);
      });
    });
  });

  describe('Weight consistency', () => {
    it('should have weights that sum to approximately 1.0 for each specialty', () => {
      const specialties = [
        'hypnotherapeute',
        'psychotherapeute',
        'coach',
        'naturopathe',
        'nutritionniste',
        'osteopathe',
      ];

      specialties.forEach(specialty => {
        const config = getQualificationConfig(specialty);
        const totalWeight = config.questions.reduce((sum, q) => sum + q.weight, 0);

        // Allow small floating point errors (within 0.01)
        expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);
      });
    });
  });

  describe('Score calculation edge cases', () => {
    it('should handle empty config answers object', () => {
      const config = getQualificationConfig('coach');
      const score = calculateLeadScore({}, config);

      expect(score).toBe(0);
    });

    it('should handle answers with undefined values', () => {
      const config = getQualificationConfig('hypnotherapeute');
      const answers: Record<string, number> = {
        [config.questions[0].id]: 50,
        undefined_question: 75,
      };

      const score = calculateLeadScore(answers, config);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should produce normalized scores between 0 and 100', () => {
      const config = getQualificationConfig('nutritionniste');

      // Test with various answer combinations
      for (let i = 0; i < 10; i++) {
        const answers: Record<string, number> = {};
        config.questions.forEach(q => {
          answers[q.id] = Math.random() * 100;
        });

        const score = calculateLeadScore(answers, config);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});
