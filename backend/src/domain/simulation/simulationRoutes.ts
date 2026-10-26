import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, parse } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { simulationService } from './simulationService';
import { store } from '../../repositories/inMemory/store';
import { notFound } from '../../lib/errors';

const router = Router();

const baselineSchema = z.object({
  revenue: z.number().positive(),
  cogs: z.number().nonnegative(),
  freight: z.number().nonnegative(),
  opex: z.number().nonnegative(),
  fxExposurePct: z.number().min(0).max(100).default(35),
  commodityExposurePct: z.number().min(0).max(100).default(25),
  currency: z.string().trim().length(3).default('USD')
});

const simulationSchema = z.object({
  baseline: baselineSchema,
  macro: z.object({
    fxUsdTryChangePct: z.number().min(-90).max(500),
    freightCostChangePct: z.number().min(-90).max(500),
    commodityPriceChangePct: z.number().min(-90).max(500),
    tariffChangePct: z.number().min(-100).max(500),
    demandChangePct: z.number().min(-100).max(500),
    logisticsDelayDays: z.number().min(0).max(365)
  }),
  horizonMonths: z.number().int().min(1).max(24).optional()
});

router.post(
  '/run',
  requireAuth,
  requirePermission('simulations:run'),
  asyncHandler(async (req: Request, res: Response) => {
    const input = parse(simulationSchema, req.body);
    const tenant = store.tenants.findById(req.auth!.tenantId);
    if (!tenant) throw notFound('Tenant');

    return ok(
      res,
      simulationService.run(
        { baseline: input.baseline, macro: input.macro, horizonMonths: input.horizonMonths },
        tenant.dataRetention
      )
    );
  })
);

router.get(
  '/templates',
  requireAuth,
  requirePermission('market:read'),
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, {
      scenarios: [
        {
          key: 'currency_shock',
          name: 'USD/TRY +30%',
          macro: {
            fxUsdTryChangePct: 30,
            freightCostChangePct: 0,
            commodityPriceChangePct: 0,
            tariffChangePct: 0,
            demandChangePct: 0,
            logisticsDelayDays: 0
          }
        },
        {
          key: 'red_sea_disruption',
          name: 'Freight +45% & 14-day delay',
          macro: {
            fxUsdTryChangePct: 0,
            freightCostChangePct: 45,
            commodityPriceChangePct: 5,
            tariffChangePct: 0,
            demandChangePct: -5,
            logisticsDelayDays: 14
          }
        },
        {
          key: 'commodity_supercycle',
          name: 'Commodity +25% & tariff +10%',
          macro: {
            fxUsdTryChangePct: 0,
            freightCostChangePct: 0,
            commodityPriceChangePct: 25,
            tariffChangePct: 10,
            demandChangePct: 0,
            logisticsDelayDays: 0
          }
        }
      ]
    });
  })
);

export default router;
