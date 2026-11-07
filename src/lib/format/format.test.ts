import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  parseBrNumber,
} from './index';

const norm = (s: string) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('formata BRL e USD', () => {
    expect(norm(formatCurrency(1234.5))).toBe('R$ 1.234,50');
    expect(norm(formatCurrency(1234.5, 'USD'))).toBe('US$ 1.234,50');
  });
});

describe('formatPercent', () => {
  it('formata fração como percentual', () => {
    expect(formatPercent(0.0123)).toBe('1,23%');
    expect(formatPercent(0.0123, { signed: true })).toBe('+1,23%');
    expect(formatPercent(-0.004, { signed: true })).toBe('-0,40%');
    expect(formatPercent(0.5, { decimals: 0 })).toBe('50%');
  });
  it('não produz -0,00%', () => {
    expect(formatPercent(-0.00001)).toBe('0,00%');
    expect(formatPercent(-0.00001, { signed: true })).toBe('0,00%');
  });
});

describe('formatNumber', () => {
  it('usa 2 casas por padrão', () => {
    expect(formatNumber(1234.567)).toBe('1.234,57');
    expect(formatNumber(1234.567, 0)).toBe('1.235');
  });
});

describe('datas', () => {
  it('formatDate trata ISO sem hora como data local', () => {
    expect(formatDate('2026-11-07')).toBe('07/11/2026');
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
  });
  it('formatDateTime', () => {
    expect(formatDateTime('2026-11-07T14:30:00')).toBe('07/11/2026 14:30');
  });
  it('converte instantes com Z/offset para America/Sao_Paulo', () => {
    expect(formatDateTime('2026-11-07T14:30:00Z')).toBe('07/11/2026 11:30');
    expect(formatDateTime('2026-11-07T14:30:00-03:00')).toBe('07/11/2026 14:30');
    expect(formatDate('2026-11-07T02:00:00Z')).toBe('06/11/2026');
  });
  it('retorna "Data inválida" para entrada inválida', () => {
    expect(formatDate('abc')).toBe('Data inválida');
    expect(formatDateTime('')).toBe('Data inválida');
    expect(formatDate('2026-02-31')).toBe('Data inválida');
  });
  it('mantém o dia em datas puras', () => {
    expect(formatDate('2026-11-07')).toBe('07/11/2026');
  });
});

describe('parseBrNumber', () => {
  it('interpreta formato brasileiro', () => {
    expect(parseBrNumber('1.000,50')).toBe(1000.5);
    expect(parseBrNumber('12,5')).toBe(12.5);
    expect(parseBrNumber('1000')).toBe(1000);
    expect(parseBrNumber(' 7 ')).toBe(7);
    expect(parseBrNumber('-3,2')).toBe(-3.2);
    expect(parseBrNumber('1.234.567')).toBe(1234567);
  });
  it('aceita ponto decimal com 1-2 dígitos sem vírgula', () => {
    expect(parseBrNumber('1.5')).toBe(1.5);
    expect(parseBrNumber('1.000')).toBe(1000);
  });
  it('retorna null para entradas inválidas', () => {
    expect(parseBrNumber('')).toBeNull();
    expect(parseBrNumber('   ')).toBeNull();
    expect(parseBrNumber('abc')).toBeNull();
    expect(parseBrNumber('1,2,3')).toBeNull();
    expect(parseBrNumber('1.00.000,5')).toBeNull();
    expect(parseBrNumber('R$ 10')).toBeNull();
    expect(parseBrNumber('NaN')).toBeNull();
  });
});
