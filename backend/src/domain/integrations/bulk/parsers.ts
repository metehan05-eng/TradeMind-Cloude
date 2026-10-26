import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { badRequest } from '../../../lib/errors';

export type FileFormat = 'csv' | 'xlsx' | 'json';
export type Row = Record<string, unknown>;

export const detectFormat = (fileName: string, mimeType?: string): FileFormat => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv') || mimeType === 'text/csv') return 'csv';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
  if (lower.endsWith('.json') || mimeType === 'application/json') return 'json';
  throw badRequest('Unsupported file type. Accepted formats: .csv, .xlsx, .json');
};

export const parseFile = (buffer: Buffer, format: FileFormat): Row[] => {
  try {
    let rows: unknown;
    if (format === 'csv') {
      rows = parseCsv(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true
      });
    } else if (format === 'xlsx') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Workbook has no sheets');
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    } else {
      const parsed = JSON.parse(buffer.toString('utf8')) as unknown;
      if (Array.isArray(parsed)) rows = parsed;
      else if (parsed && typeof parsed === 'object') {
        const candidate = (parsed as Record<string, unknown>).data ?? (parsed as Record<string, unknown>).rows;
        rows = Array.isArray(candidate) ? candidate : [parsed];
      } else {
        throw new Error('JSON root must be an array or object');
      }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('File does not contain any data rows');
    }
    if (rows.length > 50_000) {
      throw new Error('Files are limited to 50,000 rows per upload');
    }
    if (rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
      throw new Error('Every row must be a JSON object');
    }

    return rows as Row[];
  } catch (error) {
    throw badRequest(`Could not parse ${format.toUpperCase()} file`, {
      reason: error instanceof Error ? error.message : 'unknown'
    });
  }
};
