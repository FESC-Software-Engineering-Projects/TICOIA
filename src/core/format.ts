/** Formato numérico compartido por cálculos, pasos y la interfaz. */

export function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e6)) {
    return n.toExponential(3).replace(/\.?0+e/, 'e').replace('e+', 'e');
  }
  const fixed = n.toFixed(digits);
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

export function fmtSigned(n: number, digits = 4): string {
  const body = fmt(Math.abs(n), digits);
  return n < 0 ? `−${body}` : body;
}

/** Ecuación ŷ = b0 + b1 x1 + … con el signo de cada término. */
export function formatEquation(intercept: number, terms: { coef: number; name: string }[], digits = 4): string {
  let eq = `ŷ = ${fmt(intercept, digits)}`;
  for (const term of terms) {
    const mag = fmt(Math.abs(term.coef), digits);
    eq += term.coef < 0 ? ` − ${mag}·${term.name}` : ` + ${mag}·${term.name}`;
  }
  return eq;
}

export interface Step {
  title: string;
  body: string;
  latex?: string;
}

export type Fail = { ok: false; errors: string[] };

export function fail(errors: string[]): Fail {
  return { ok: false, errors };
}

export function parseNumberCell(raw: string): number | null {
  const t = raw.trim().replace(/\s+/g, '');
  if (!t) return null;
  if (t.includes(',') && t.includes('.')) return null;
  const s = t.includes(',') ? t.replace(',', '.') : t;
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function mean(xs: number[]): number {
  if (!xs.length) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}
