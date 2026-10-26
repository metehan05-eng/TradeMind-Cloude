import { z } from 'zod';
import { emailSchema } from '../../lib/validation';

export const demoRequestSchema = z.object({
  businessEmail: emailSchema,
  companyName: z.string().trim().min(2).max(200),
  jobTitle: z.string().trim().min(2).max(120),
  annualTradeVolume: z.enum([
    'under_500k',
    '500k_2m',
    '2m_10m',
    '10m_50m',
    '50m_plus'
  ]),
  primaryErp: z.enum(['sap', 'oracle_netsuite', 'logo', 'mikro', 'odoo', 'none', 'other']),
  primaryMarketplace: z.enum(['amazon', 'shopify', 'etsy', 'trendyol', 'none', 'other']),
  country: z.string().trim().toUpperCase().length(2).optional(),
  source: z.enum(['landing', 'auth']).default('landing'),
  note: z.string().trim().max(1000).optional()
});

export const demoConfirmSchema = z.object({
  token: z.string().min(16).max(256)
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
