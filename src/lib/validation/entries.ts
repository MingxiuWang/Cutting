import { z } from 'zod';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const createEntrySchema = z.object({
  measuredAt: z
    .coerce.date()
    .refine((d) => d.getTime() <= Date.now(), 'measuredAt cannot be in the future')
    .refine((d) => d.getTime() >= Date.now() - ONE_YEAR_MS, 'measuredAt cannot be more than 1 year in the past'),
  period: z.enum(['AM', 'PM']),
  weightKg: z.number().min(20).max(400),
  bodyFatPct: z.number().min(1).max(70),
  musclePct: z.number().min(10).max(80),
  waterPct: z.number().min(20).max(80),
  note: z.string().max(500).optional(),
  tzOffsetMinutes: z.number().int().min(-720).max(840),
});

export const updateEntrySchema = createEntrySchema.partial({
  measuredAt: true,
  period: true,
  weightKg: true,
  bodyFatPct: true,
  musclePct: true,
  waterPct: true,
  note: true,
});
