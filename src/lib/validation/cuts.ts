import { z } from 'zod';

const targetWeightKg = z.number().min(20, 'Min 20 kg').max(400, 'Max 400 kg');

export const createCutSchema = z
  .object({
    name: z.string().min(1).max(100),
    startDate: z
      .coerce.date()
      .refine((d) => d.getTime() <= Date.now() + 86400000, 'startDate cannot be in the future'),
    targetWeightKg,
    expectedEndDate: z.coerce.date().optional(),
  })
  .refine(
    (v) => !v.expectedEndDate || v.expectedEndDate.getTime() >= v.startDate.getTime(),
    { message: 'expectedEndDate must be on or after startDate', path: ['expectedEndDate'] },
  );

export const updateCutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  targetWeightKg: targetWeightKg.optional(),
  expectedEndDate: z.coerce.date().nullable().optional(),
});

export const endCutSchema = z.object({
  endDate: z.coerce.date(),
});
