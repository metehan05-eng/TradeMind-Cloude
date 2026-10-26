import {
  DataRetentionMode,
  SimulationBaseline,
  SimulationMacroInput,
  SimulationRequest,
  SimulationResult,
  SimulationScenarioResult
} from '../../types/domain';

const round = (value: number): number => Math.round(value * 100) / 100;

const compute = (
  baseline: SimulationBaseline,
  macro: SimulationMacroInput,
  scenario: string
): SimulationScenarioResult => {
  const revenue = baseline.revenue * (1 + macro.demandChangePct / 100);

  const fxImpact = macro.fxUsdTryChangePct * (baseline.fxExposurePct / 100);
  const commodityImpact =
    macro.commodityPriceChangePct * (baseline.commodityExposurePct / 100);
  const costMultiplier = 1 + (fxImpact + commodityImpact + macro.tariffChangePct) / 100;

  const cogs = baseline.cogs * costMultiplier;
  const delayPenalty = revenue * 0.0015 * Math.max(0, macro.logisticsDelayDays);
  const freight = baseline.freight * (1 + macro.freightCostChangePct / 100) + delayPenalty;
  const opex = baseline.opex + delayPenalty * 0.4;

  const netProfit = revenue - cogs - freight - opex;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const baselineMargin =
    baseline.revenue > 0
      ? ((baseline.revenue - baseline.cogs - baseline.freight - baseline.opex) /
          baseline.revenue) *
        100
      : 0;
  const marginDeltaPct = netMarginPct - baselineMargin;

  const drivers: string[] = [];
  if (Math.abs(macro.fxUsdTryChangePct) > 0) drivers.push('FX exposure');
  if (Math.abs(macro.freightCostChangePct) > 0) drivers.push('Freight rates');
  if (Math.abs(macro.commodityPriceChangePct) > 0) drivers.push('Commodity prices');
  if (Math.abs(macro.tariffChangePct) > 0) drivers.push('Tariffs / customs');
  if (Math.abs(macro.demandChangePct) > 0) drivers.push('Demand shift');
  if (macro.logisticsDelayDays > 0) drivers.push('Logistics delays');

  const riskLevel: SimulationScenarioResult['riskLevel'] =
    netMarginPct < 0 || marginDeltaPct < -8
      ? 'high'
      : marginDeltaPct < -3
        ? 'medium'
        : 'low';

  return {
    scenario,
    revenue: round(revenue),
    cogs: round(cogs),
    freight: round(freight),
    opex: round(opex),
    netProfit: round(netProfit),
    netMarginPct: round(netMarginPct),
    marginDeltaPct: round(marginDeltaPct),
    riskLevel,
    drivers
  };
};

const ZERO_MACRO: SimulationMacroInput = {
  fxUsdTryChangePct: 0,
  freightCostChangePct: 0,
  commodityPriceChangePct: 0,
  tariffChangePct: 0,
  demandChangePct: 0,
  logisticsDelayDays: 0
};

/**
 * Deterministic "what-if" engine. The same contract can later be routed to a
 * Monte Carlo or agent-based model without changing the API.
 */
export class SimulationService {
  run(request: SimulationRequest, dataRetention: DataRetentionMode): SimulationResult {
    const baselineScenario = compute(request.baseline, ZERO_MACRO, 'baseline');
    const stressed = compute(request.baseline, request.macro, 'macro_stress');

    const variables: Array<{ key: keyof SimulationBaseline | keyof SimulationMacroInput; variable: string; macro: SimulationMacroInput }> = [
      {
        key: 'fxUsdTryChangePct',
        variable: 'USD/TRY',
        macro: { ...ZERO_MACRO, fxUsdTryChangePct: request.macro.fxUsdTryChangePct }
      },
      {
        key: 'freightCostChangePct',
        variable: 'Freight',
        macro: { ...ZERO_MACRO, freightCostChangePct: request.macro.freightCostChangePct }
      },
      {
        key: 'commodityPriceChangePct',
        variable: 'Commodities',
        macro: { ...ZERO_MACRO, commodityPriceChangePct: request.macro.commodityPriceChangePct }
      },
      {
        key: 'tariffChangePct',
        variable: 'Tariffs',
        macro: { ...ZERO_MACRO, tariffChangePct: request.macro.tariffChangePct }
      },
      {
        key: 'demandChangePct',
        variable: 'Demand',
        macro: { ...ZERO_MACRO, demandChangePct: request.macro.demandChangePct }
      },
      {
        key: 'logisticsDelayDays',
        variable: 'Logistics delay',
        macro: { ...ZERO_MACRO, logisticsDelayDays: request.macro.logisticsDelayDays }
      }
    ];

    const sensitivity = variables
      .map(({ variable, macro }) => {
        const scenario = compute(request.baseline, macro, variable);
        return { variable, marginImpactPct: round(scenario.netMarginPct - baselineScenario.netMarginPct) };
      })
      .filter((entry) => Math.abs(entry.marginImpactPct) > 0.001)
      .sort((a, b) => Math.abs(b.marginImpactPct) - Math.abs(a.marginImpactPct));

    const recommendations: string[] = [];
    if (request.macro.fxUsdTryChangePct > 10 && request.baseline.fxExposurePct > 30) {
      recommendations.push(
        'Hedge USD/TRY exposure or renegotiate supplier contracts in TRY to protect gross margin.'
      );
    }
    if (request.macro.freightCostChangePct > 15) {
      recommendations.push(
        'Shift a portion of volume to consolidated sea freight and re-run Incoterms negotiations.'
      );
    }
    if (request.macro.commodityPriceChangePct > 10) {
      recommendations.push(
        'Lock forward commodity purchases and trigger the arbitrage alert engine for alternative vendors.'
      );
    }
    if (request.macro.logisticsDelayDays > 7) {
      recommendations.push(
        'Increase safety stock for delayed SKUs and reduce paid acquisition spend until lead times normalize.'
      );
    }
    if (request.macro.demandChangePct < -10) {
      recommendations.push('Reduce discretionary opex and prioritize high-margin product lines.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Macro assumptions are within tolerance; no hedging action required.');
    }

    return {
      baseline: baselineScenario,
      stressed,
      sensitivity,
      recommendations,
      generatedAt: new Date().toISOString(),
      dataRetention
    };
  }
}

export const simulationService = new SimulationService();
