import { z } from 'zod';
import { emailSchema, passwordSchema } from '../../lib/validation';

export const corporateRegisterSchema = z
  .object({
    companyLegalName: z.string().trim().min(2).max(200),
    displayName: z.string().trim().min(2).max(120).optional(),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'Country must be a 2-letter ISO code'),
    taxIdType: z.enum(['vkn', 'mersis', 'duns', 'eu_vat', 'other']),
    taxId: z.string().trim().min(5).max(32),
    fullName: z.string().trim().min(2).max(120),
    jobTitle: z.string().trim().min(2).max(120),
    email: emailSchema,
    password: passwordSchema,
    plan: z.enum(['starter', 'professional', 'enterprise']).default('professional')
  })
  .superRefine((value, ctx) => {
    const normalized = value.taxId.replace(/\s/g, '');
    const rules: Record<string, { regex: RegExp; message: string }> = {
      vkn: { regex: /^\d{10}$/, message: 'VKN must contain 10 digits' },
      mersis: { regex: /^\d{16}$/, message: 'MERSİS number must contain 16 digits' },
      duns: { regex: /^\d{9}$/, message: 'DUNS number must contain 9 digits' }
    };
    const rule = rules[value.taxIdType];
    if (rule && !rule.regex.test(normalized)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxId'], message: rule.message });
    }
    if (value.taxIdType === 'vkn' && value.country !== 'TR') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taxIdType'],
        message: 'VKN is only valid for Turkish entities. Use DUNS or EU VAT for global companies.'
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(512)
});

export const verifyEmailTokenSchema = z.object({
  token: z.string().min(16).max(256)
});

export const discoverSsoSchema = z.object({
  email: emailSchema
});

export const dnsVerifySchema = z.object({
  challengeId: z.string().uuid()
});

export const resendVerificationSchema = z.object({
  level: z.enum(['email', 'dns']).default('email')
});

export type CorporateRegisterInput = z.infer<typeof corporateRegisterSchema>;
