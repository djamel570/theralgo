import { describe, it, expect } from 'vitest';
import {
  SpecialtyTemplate,
} from '../specialty-templates';

// We need to import the getter and other exported functions
// Since the file doesn't export individual specialty objects, we'll test through the exported functionality
import { getSpecialtyTemplate, AVAILABLE_SPECIALTIES } from '../specialty-templates';

describe('Specialty Templates', () => {
  describe('All 6 specialties exist with required fields', () => {
    const expectedSpecialties = [
      'hypnotherapeute',
      'sophrologue',
      'osteopathe',
      'psychopraticien',
      'coach',
      'nutritionniste',
    ];

    expectedSpecialties.forEach(specialtyKey => {
      it(`should have ${specialtyKey} specialty with all required fields`, () => {
        const template = getSpecialtyTemplate(specialtyKey);

        // Check existence
        expect(template).toBeDefined();
        expect(template).not.toBeNull();

        // Check required top-level fields
        expect(template).toHaveProperty('specialty_key');
        expect(template).toHaveProperty('specialty_label');
        expect(template).toHaveProperty('intention_segments');
        expect(template).toHaveProperty('hook_templates');
        expect(template).toHaveProperty('promise_templates');
        expect(template).toHaveProperty('objections');
        expect(template).toHaveProperty('campaign_defaults');
        expect(template).toHaveProperty('faq_templates');

        // Check field types and values
        expect(template.specialty_key).toBe(specialtyKey);
        expect(typeof template.specialty_label).toBe('string');
        expect(template.specialty_label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Segments have required structure', () => {
    it('should have intention segments with required fields for hypnotherapeute', () => {
      const template = getSpecialtyTemplate('hypnotherapeute');

      expect(Array.isArray(template.intention_segments)).toBe(true);
      expect(template.intention_segments.length).toBeGreaterThan(0);

      template.intention_segments.forEach(segment => {
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('description');
        expect(segment).toHaveProperty('temperature');
        expect(segment).toHaveProperty('media_priority');
        expect(segment).toHaveProperty('typical_situations');
        expect(segment).toHaveProperty('keywords_fr');

        // Validate field types
        expect(typeof segment.name).toBe('string');
        expect(typeof segment.description).toBe('string');
        expect(['cold', 'warm', 'hot']).toContain(segment.temperature);
        expect(['high', 'medium', 'low']).toContain(segment.media_priority);
        expect(Array.isArray(segment.typical_situations)).toBe(true);
        expect(Array.isArray(segment.keywords_fr)).toBe(true);
      });
    });

    it('should have intention segments for all specialties', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(Array.isArray(template.intention_segments)).toBe(true);
        expect(template.intention_segments.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Hooks have required structure', () => {
    it('should have hook templates with required fields', () => {
      const template = getSpecialtyTemplate('sophrologue');

      expect(Array.isArray(template.hook_templates)).toBe(true);
      expect(template.hook_templates.length).toBeGreaterThan(0);

      template.hook_templates.forEach(hook => {
        expect(hook).toHaveProperty('template');
        expect(hook).toHaveProperty('angle');
        expect(hook).toHaveProperty('segment_match');

        // Validate field types and values
        expect(typeof hook.template).toBe('string');
        expect(hook.template.length).toBeGreaterThan(0);
        expect(['educational', 'transformation', 'reassurance', 'urgency', 'social_proof']).toContain(hook.angle);
        expect(Array.isArray(hook.segment_match)).toBe(true);
        expect(hook.segment_match.length).toBeGreaterThan(0);
      });
    });

    it('should have hook templates for all specialties', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(Array.isArray(template.hook_templates)).toBe(true);
        expect(template.hook_templates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Promises have required structure', () => {
    it('should have promise templates with required fields', () => {
      const template = getSpecialtyTemplate('osteopathe');

      expect(Array.isArray(template.promise_templates)).toBe(true);
      expect(template.promise_templates.length).toBeGreaterThan(0);

      template.promise_templates.forEach(promise => {
        expect(promise).toHaveProperty('template');
        expect(promise).toHaveProperty('proof_type');

        // Validate field types and values
        expect(typeof promise.template).toBe('string');
        expect(promise.template.length).toBeGreaterThan(0);
        expect(['result', 'method', 'experience', 'testimonial']).toContain(promise.proof_type);
      });
    });

    it('should have promise templates for all specialties', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(Array.isArray(template.promise_templates)).toBe(true);
        expect(template.promise_templates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Campaign defaults have correct structure', () => {
    it('should have campaign defaults with required fields', () => {
      const template = getSpecialtyTemplate('psychopraticien');

      expect(template.campaign_defaults).toBeDefined();
      const defaults = template.campaign_defaults;

      expect(defaults).toHaveProperty('recommended_objective');
      expect(defaults).toHaveProperty('recommended_optimization_event');
      expect(defaults).toHaveProperty('min_daily_budget_cents');
      expect(defaults).toHaveProperty('recommended_daily_budget_cents');
      expect(defaults).toHaveProperty('recommended_age_min');
      expect(defaults).toHaveProperty('recommended_age_max');
      expect(defaults).toHaveProperty('recommended_radius_km');
      expect(defaults).toHaveProperty('recommended_platforms');
      expect(defaults).toHaveProperty('learning_period_days');

      // Validate numeric fields are positive
      expect(defaults.min_daily_budget_cents).toBeGreaterThan(0);
      expect(defaults.recommended_daily_budget_cents).toBeGreaterThanOrEqual(defaults.min_daily_budget_cents);
      expect(defaults.recommended_age_min).toBeGreaterThan(0);
      expect(defaults.recommended_age_max).toBeGreaterThanOrEqual(defaults.recommended_age_min);
      expect(defaults.recommended_radius_km).toBeGreaterThan(0);
      expect(defaults.learning_period_days).toBeGreaterThan(0);

      // Validate platforms is an array
      expect(Array.isArray(defaults.recommended_platforms)).toBe(true);
      expect(defaults.recommended_platforms.length).toBeGreaterThan(0);
    });

    it('should have campaign defaults for all specialties', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(template.campaign_defaults).toBeDefined();
        expect(template.campaign_defaults.recommended_objective).toBeDefined();
        expect(template.campaign_defaults.min_daily_budget_cents).toBeGreaterThan(0);
      });
    });
  });

  describe('FAQ templates have correct structure', () => {
    it('should have FAQ templates with required fields', () => {
      const template = getSpecialtyTemplate('coach');

      expect(Array.isArray(template.faq_templates)).toBe(true);
      expect(template.faq_templates.length).toBeGreaterThan(0);

      template.faq_templates.forEach(faq => {
        expect(faq).toHaveProperty('question');
        expect(faq).toHaveProperty('answer_template');

        expect(typeof faq.question).toBe('string');
        expect(faq.question.length).toBeGreaterThan(0);
        expect(typeof faq.answer_template).toBe('string');
        expect(faq.answer_template.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Objections have required structure', () => {
    it('should have objections with required fields', () => {
      const template = getSpecialtyTemplate('hypnotherapeute');

      expect(Array.isArray(template.objections)).toBe(true);
      expect(template.objections.length).toBeGreaterThan(0);

      template.objections.forEach(objection => {
        expect(objection).toHaveProperty('objection');
        expect(objection).toHaveProperty('response_template');

        expect(typeof objection.objection).toBe('string');
        expect(objection.objection.length).toBeGreaterThan(0);
        expect(typeof objection.response_template).toBe('string');
        expect(objection.response_template.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Getter function behavior', () => {
    it('should return correct template for valid specialty key', () => {
      const template = getSpecialtyTemplate('sophrologue');
      expect(template.specialty_key).toBe('sophrologue');
      expect(template.specialty_label).toBe('Sophrologue');
    });

    it('should return coach template as default for unknown specialty', () => {
      const template = getSpecialtyTemplate('unknown_specialty');
      expect(template.specialty_key).toBe('coach');
    });

    it('should return coach template for undefined specialty', () => {
      const template = getSpecialtyTemplate(undefined);
      expect(template.specialty_key).toBe('coach');
    });

    it('should return coach template for empty string', () => {
      const template = getSpecialtyTemplate('');
      expect(template.specialty_key).toBe('coach');
    });
  });

  describe('AVAILABLE_SPECIALTIES constant', () => {
    it('should contain all expected specialties', () => {
      expect(Array.isArray(AVAILABLE_SPECIALTIES)).toBe(true);
      expect(AVAILABLE_SPECIALTIES.length).toBeGreaterThanOrEqual(6);

      const specialtyKeys = AVAILABLE_SPECIALTIES.map(s => s.key);
      expect(specialtyKeys).toContain('hypnotherapeute');
      expect(specialtyKeys).toContain('sophrologue');
      expect(specialtyKeys).toContain('osteopathe');
      expect(specialtyKeys).toContain('psychopraticien');
      expect(specialtyKeys).toContain('coach');
    });

    it('should have proper structure for each specialty entry', () => {
      AVAILABLE_SPECIALTIES.forEach(specialty => {
        expect(specialty).toHaveProperty('key');
        expect(specialty).toHaveProperty('name');
        expect(typeof specialty.key).toBe('string');
        expect(typeof specialty.name).toBe('string');
        expect(specialty.key.length).toBeGreaterThan(0);
        expect(specialty.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Template consistency across specialties', () => {
    it('should have at least 3 intention segments per specialty', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(template.intention_segments.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have at least 3 hook templates per specialty', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(template.hook_templates.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have at least 2 promise templates per specialty', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(template.promise_templates.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have at least 2 FAQ templates per specialty', () => {
      const specialties = ['hypnotherapeute', 'sophrologue', 'osteopathe', 'psychopraticien', 'coach', 'nutritionniste'];

      specialties.forEach(specialty => {
        const template = getSpecialtyTemplate(specialty);
        expect(template.faq_templates.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
