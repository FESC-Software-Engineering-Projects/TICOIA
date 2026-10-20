/** Cola de la distribución t de Student y de Fisher, vía la beta incompleta regularizada. */

function logGamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

export function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  if (x < (a + 1) / (a + b + 2)) {
    const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;
    return front * betacf(a, b, x);
  }
  const front = Math.exp(b * Math.log(1 - x) + a * Math.log(x) - lnBeta) / b;
  return 1 - front * betacf(b, a, 1 - x);
}

/** P(|T| ≥ |t|) con df grados de libertad. */
export function studentTTwoSidedP(t: number, df: number): number | null {
  if (!(df > 0) || !Number.isFinite(t)) return null;
  const x = df / (df + t * t);
  const p = regularizedBeta(x, df / 2, 0.5);
  if (!Number.isFinite(p)) return null;
  return Math.min(1, Math.max(0, p));
}

/** P(F ≥ f) con (d1, d2) grados de libertad. */
export function fisherUpperP(f: number, d1: number, d2: number): number | null {
  if (!(d1 > 0) || !(d2 > 0) || !Number.isFinite(f)) return null;
  if (f <= 0) return 1;
  const x = (d1 * f) / (d1 * f + d2);
  const cdf = regularizedBeta(x, d1 / 2, d2 / 2);
  if (!Number.isFinite(cdf)) return null;
  return Math.min(1, Math.max(0, 1 - cdf));
}
