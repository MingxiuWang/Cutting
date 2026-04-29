import { z } from 'zod';

const targetWeightKg = z.number().min(20, 'Min 20 kg').max(400, 'Max 400 kg');

export const createCutSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z
    .coerce.date()
    .refine((d) => d.getTime() <= Date.now() + 86400000, 'startDate cannot be in the future'),
  targetWeightKg,
});

export const updateCutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.coerce.date().optional(),
  targetWeightKg: targetWeightKg.optional(),
});

export const endCutSchema = z.object({
  endDate: z.coerce.date(),
});
