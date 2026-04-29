import { describe, it, expect } from 'vitest';
import { signupSchema, changePasswordSchema } from '@/lib/validation/auth';
import { createCutSchema } from '@/lib/validation/cuts';
import { createEntrySchema } from '@/lib/validation/entries';

describe('signupSchema', () => {
  it('accepts a valid email + password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abcd1234' }).success).toBe(true);
  });
  it('rejects too-short password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abc1' }).success).toBe(false);
  });
  it('rejects password without a digit', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: 'abcdefgh' }).success).toBe(false);
  });
  it('rejects password without a letter', () => {
    expect(signupSchema.safeParse({ email: 'a@b.co', password: '12345678' }).success).toBe(false);
  });
  it('rejects malformed email', () => {
    expect(signupSchema.safeParse({ email: 'not-an-email', password: 'abcd1234' }).success).toBe(false);
  });
  it('rejects email > 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.co';
    expect(signupSchema.safeParse({ email: long, password: 'abcd1234' }).success).toBe(false);
  });
});

describe('createCutSchema', () => {
  const baseDate = new Date('2026-01-01');
  it('accepts a valid cut', () => {
    expect(createCutSchema.safeParse({ name: 'Spring', startDate: baseDate, targetWeightKg: 70 }).success).toBe(true);
  });
  it('rejects future startDate', () => {
    const future = new Date(Date.now() + 86400000 * 2);
    expect(createCutSchema.safeParse({ name: 'Future', startDate: future, targetWeightKg: 70 }).success).toBe(false);
  });
  it('rejects target out of range', () => {
    expect(createCutSchema.safeParse({ name: 'X', startDate: baseDate, targetWeightKg: 10 }).success).toBe(false);
    expect(createCutSchema.safeParse({ name: 'X', startDate: baseDate, targetWeightKg: 500 }).success).toBe(false);
  });
});

describe('createEntrySchema', () => {
  const valid = {
    measuredAt: new Date(),
    period: 'AM' as const,
    weightKg: 75.4,
    bodyFatPct: 18.5,
    musclePct: 42.0,
    waterPct: 55.5,
    tzOffsetMinutes: 0,
  };

  it('accepts a valid entry', () => {
    expect(createEntrySchema.safeParse(valid).success).toBe(true);
  });
  it('rejects weight out of range', () => {
    expect(createEntrySchema.safeParse({ ...valid, weightKg: 10 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...valid, weightKg: 500 }).success).toBe(false);
  });
  it('rejects bodyFatPct out of range', () => {
    expect(createEntrySchema.safeParse({ ...valid, bodyFatPct: 0 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...valid, bodyFatPct: 80 }).success).toBe(false);
  });
  it('rejects future measuredAt', () => {
    const future = new Date(Date.now() + 60_000);
    expect(createEntrySchema.safeParse({ ...valid, measuredAt: future }).success).toBe(false);
  });
  it('rejects measuredAt > 1 year ago', () => {
    const old = new Date(Date.now() - 400 * 86400000);
    expect(createEntrySchema.safeParse({ ...valid, measuredAt: old }).success).toBe(false);
  });
  it('rejects note > 500 chars', () => {
    expect(createEntrySchema.safeParse({ ...valid, note: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('requires current and new password and applies same complexity', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'abcd1234', newPassword: 'wxyz5678' }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: 'abcd1234', newPassword: 'short' }).success).toBe(false);
  });
});
