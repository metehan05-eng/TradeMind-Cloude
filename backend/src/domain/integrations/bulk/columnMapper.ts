import { randomUUID } from 'crypto';
import { FinancialTransactionRecord, InventoryRecord } from '../../../types/domain';

export type DatasetKind = 'inventory' | 'transactions';

export interface MappedRow {
  rowNumber: number;
  record: InventoryRecord | FinancialTransactionRecord;
}

export interface MappingResult {
  dataset: DatasetKind;
  records: Array<InventoryRecord | FinancialTransactionRecord>;
  mapping: Record<string, string>;
  errors: Array<{ row: number; message: string }>;
}

type AliasMap = Record<string, string[]>;

const INVENTORY_ALIASES: AliasMap = {
  sku: ['sku', 'stockcode', 'productcode', 'itemcode', 'barkod', 'stokkodu'],
  product_name: ['productname', 'product', 'name', 'urunadi', 'description'],
  quantity: ['quantity', 'qty', 'stock', 'stok', 'stockquantity', 'available'],
  unit_cost: ['unitcost', 'cost', 'price', 'birimfiyat', 'maliyet', 'unitprice'],
  currency: ['currency', 'curr', 'parabirimi', 'doviz'],
  warehouse: ['warehouse', 'depot', 'depo', 'location']
};

const TRANSACTION_ALIASES: AliasMap = {
  external_id: ['externalid', 'invoiceid', 'transactionid', 'faturaNo', 'id'],
  type: ['type', 'transactiontype', 'tip', 'eventtype'],
  amount: ['amount', 'total', 'tutar', 'value', 'netamount'],
  currency: ['currency', 'curr', 'parabirimi', 'doviz'],
  description: ['description', 'memo', 'aciklama', 'note'],
  counterparty: ['counterparty', 'vendor', 'customer', 'tedarikci', 'musteri'],
  occurred_at: ['occurredat', 'date', 'tarih', 'transactiondate', 'invoicedate']
};

const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const buildMapping = (headers: string[], aliases: AliasMap): Record<string, string> => {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeKey(header);
    for (const [target, candidates] of Object.entries(aliases)) {
      if (candidates.some((candidate) => normalizeKey(candidate) === normalized)) {
        mapping[target] = header;
        break;
      }
    }
  }
  return mapping;
};

const value = (row: Record<string, unknown>, mapping: Record<string, string>, key: string): unknown => {
  const header = mapping[key];
  return header ? row[header] : undefined;
};

const text = (input: unknown, fallback = ''): string =>
  input == null ? fallback : String(input).trim();

const amount = (input: unknown): number => {
  if (typeof input === 'number') return input;
  const parsed = Number(String(input ?? '0').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const detectDataset = (rows: Array<Record<string, unknown>>): DatasetKind => {
  const headers = Object.keys(rows[0] ?? {});
  const mapping = buildMapping(headers, { ...INVENTORY_ALIASES, ...TRANSACTION_ALIASES });
  if (mapping.sku || mapping.quantity) return 'inventory';
  return 'transactions';
};

/**
 * Maps heterogeneous CSV/Excel headers (English or Turkish aliases) to the
 * TradeMind canonical schema. Unknown columns are preserved in the mapping
 * report so users can correct their templates.
 */
export const mapRows = (
  tenantId: string,
  rows: Array<Record<string, unknown>>,
  dataset: DatasetKind,
  source: 'bulk_upload' | 'sftp' = 'bulk_upload'
): MappingResult => {
  const headers = Object.keys(rows[0] ?? {});
  const aliases = dataset === 'inventory' ? INVENTORY_ALIASES : TRANSACTION_ALIASES;
  const mapping = buildMapping(headers, aliases);
  const records: Array<InventoryRecord | FinancialTransactionRecord> = [];
  const errors: Array<{ row: number; message: string }> = [];
  const now = new Date().toISOString();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // account for header row
    try {
      if (dataset === 'inventory') {
        const sku = text(value(row, mapping, 'sku'));
        if (!sku) throw new Error('Missing required column: sku');
        records.push({
          id: randomUUID(),
          tenantId,
          sku,
          productName: text(value(row, mapping, 'product_name'), sku),
          quantity: Math.max(0, Math.trunc(amount(value(row, mapping, 'quantity')))),
          unitCost: amount(value(row, mapping, 'unit_cost')),
          currency: text(value(row, mapping, 'currency'), 'USD').toUpperCase(),
          warehouse: text(value(row, mapping, 'warehouse')) || undefined,
          source,
          updatedAt: now
        } satisfies InventoryRecord);
      } else {
        const gross = amount(value(row, mapping, 'amount'));
        if (!gross && gross !== 0) throw new Error('Missing required column: amount');
        const rawType = text(value(row, mapping, 'type'), 'cash_flow').toLowerCase();
        const type =
          rawType.includes('invoice') || rawType.includes('fatura')
            ? 'invoice'
            : rawType.includes('inventory') || rawType.includes('stok')
              ? 'inventory_delta'
              : 'cash_flow';
        records.push({
          id: randomUUID(),
          tenantId,
          externalId: text(value(row, mapping, 'external_id')) || undefined,
          type,
          amount: gross,
          currency: text(value(row, mapping, 'currency'), 'USD').toUpperCase(),
          description: text(value(row, mapping, 'description'), 'Imported transaction'),
          counterparty: text(value(row, mapping, 'counterparty')) || undefined,
          occurredAt: text(value(row, mapping, 'occurred_at'), now),
          source,
          createdAt: now
        } satisfies FinancialTransactionRecord);
      }
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'Unknown mapping error'
      });
    }
  });

  return { dataset, records, mapping, errors };
};
