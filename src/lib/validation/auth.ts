import { z } from 'zod';

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'Max 72 characters')
  .refine((s) => /[A-Za-z]/.test(s), 'Must contain a letter')
  .refine((s) => /\d/.test(s), 'Must contain a digit');

const email = z
  .string()
  .email('Invalid email')
  .max(254, 'Email too long')
  .transform((s) => s.toLowerCase());

export const signupSchema = z.object({ email, password });
export const loginSchema = z.object({ email, password: z.string().min(1) });
export const changeEmailSchema = z.object({ email });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
export const deleteAccountSchema = z.object({ password: z.string().min(1) });

export type SignupInput = z.infer<typeof signupSchema>;
