import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('A valid email address is required')
  .max(254);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0)
});

export const isoDateSchema = z.string().datetime({ offset: true });

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Country must be a 2-letter ISO code');

export const vknSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'VKN must contain exactly 10 digits');

export const mersisSchema = z
  .string()
  .trim()
  .regex(/^\d{16}$/, 'Mersis number must contain exactly 16 digits');

export const dunsSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, 'DUNS number must contain exactly 9 digits');

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/\d/, 'Password must include a number');

export const taxIdSchema = z.object({
  taxIdType: z.enum(['vkn', 'mersis', 'duns', 'eu_vat', 'other']),
  taxId: z.string().trim().min(5).max(32)
});
