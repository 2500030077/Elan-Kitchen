import { describe, expect, it } from 'vitest';
import { passwordStrength, validatePassword, validateSignup, isValidEmail } from '../src/utils/validation';
import { formatQuantity, scaleQuantity, getWeekStart } from '../src/utils/helpers';

describe('validation', () => {
  it('enforces password rules', () => {
    expect(validatePassword('short1A')).toMatch(/8/);
    expect(validatePassword('alllowercase1')).toMatch(/uppercase/);
    expect(validatePassword('ALLUPPER1')).toMatch(/lowercase/);
    expect(validatePassword('NoNumbers')).toMatch(/number/);
    expect(validatePassword('GoodPass1')).toBe('');
  });
  it('scores password strength', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('VeryStrong#Pass123').score).toBe(4);
  });
  it('validates email', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });
  it('collects signup errors', () => {
    const e = validateSignup({ name: '', email: 'x', password: 'a', confirmPassword: 'b', acceptTerms: false });
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['name', 'email', 'password', 'confirmPassword', 'acceptTerms']));
  });
});

describe('helpers', () => {
  it('scales and formats quantities', () => {
    expect(scaleQuantity(2, 4, 2)).toBe(1);
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(1.333)).toBe('1⅓');
    expect(scaleQuantity(null, 4, 8)).toBeNull();
  });
  it('computes Monday week start', () => {
    expect(getWeekStart(new Date(2026, 10, 27))).toBe('2026-11-23');
    expect(getWeekStart(new Date(2026, 10, 23))).toBe('2026-11-23');
    expect(getWeekStart(new Date(2026, 10, 29))).toBe('2026-11-23');
  });
});

describe('unit display', async () => {
  const { unitLabel } = await import('../src/utils/helpers');
  it('hides piece, pluralises countable units and rounds counts', () => {
    expect(unitLabel('piece', 4)).toBe('');
    expect(unitLabel('clove', 2)).toBe('cloves');
    expect(unitLabel('bunch', 2)).toBe('bunches');
    expect(unitLabel('g', 400)).toBe('g');
    expect(scaleQuantity(15, 4, 6, 'piece')).toBe(23);
    expect(scaleQuantity(1, 4, 6, 'piece')).toBe(1.5);
  });
});
