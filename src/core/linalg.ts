/**
 * Álgebra lineal pequeña para mínimos cuadrados y Newton-Raphson.
 * La regresión múltiple no invierte XᵀX de forma explícita: resuelve
 * min ||Xβ − y|| con reflexiones de Householder (factorización QR).
 */

export interface LsResult {
  ok: true;
  beta: number[];
  /** Diagonal de R. Sirve para estimar el condicionamiento. */
  rdiag: number[];
  /** Factor R triangular superior (p × p). */
  r: number[][];
}

export interface LsFail {
  ok: false;
  reason: 'singular' | 'empty';
  rank: number;
  rdiag: number[];
}

function cloneMatrix(A: number[][]): number[][] {
  return A.map(row => row.slice());
}

/**
 * Mínimos cuadrados por Householder.
 * X es n × p, y tiene longitud n. Si alguna columna queda numéricamente
 * nula después de las reflexiones anteriores, el sistema es singular.
 */
export function leastSquares(X: number[][], y: number[], tol = 1e-10): LsResult | LsFail {
  const n = X.length;
  const p = X[0]?.length ?? 0;
  if (n === 0 || p === 0 || y.length !== n) {
    return { ok: false, reason: 'empty', rank: 0, rdiag: [] };
  }
  if (n < p) {
    return { ok: false, reason: 'singular', rank: n, rdiag: [] };
  }

  const A = cloneMatrix(X);
  const b = y.slice();
  const rdiag: number[] = [];

  for (let k = 0; k < p; k++) {
    let sigma = 0;
    for (let i = k; i < n; i++) sigma += A[i][k] * A[i][k];
    const norm = Math.sqrt(sigma);
    rdiag.push(k === 0 ? norm : norm);
    if (norm < tol) {
      return { ok: false, reason: 'singular', rank: k, rdiag };
    }

    const v: number[] = [];
    for (let i = k; i < n; i++) v.push(A[i][k]);
    v[0] += Math.sign(v[0] || 1) * norm;
    let vdot = 0;
    for (const vi of v) vdot += vi * vi;
    if (vdot < tol) {
      return { ok: false, reason: 'singular', rank: k, rdiag };
    }
    const beta = 2 / vdot;

    for (let j = k; j < p; j++) {
      let dot = 0;
      for (let i = 0; i < v.length; i++) dot += v[i] * A[k + i][j];
      const scale = beta * dot;
      for (let i = 0; i < v.length; i++) A[k + i][j] -= scale * v[i];
    }
    {
      let dot = 0;
      for (let i = 0; i < v.length; i++) dot += v[i] * b[k + i];
      const scale = beta * dot;
      for (let i = 0; i < v.length; i++) b[k + i] -= scale * v[i];
    }
    rdiag[k] = A[k][k];
  }

  const scale = Math.max(...rdiag.map(d => Math.abs(d)), 1);
  for (let k = 0; k < p; k++) {
    if (Math.abs(A[k][k]) <= tol * scale) {
      return { ok: false, reason: 'singular', rank: k, rdiag };
    }
  }

  const coef = new Array<number>(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    let acc = b[i];
    for (let j = i + 1; j < p; j++) acc -= A[i][j] * coef[j];
    coef[i] = acc / A[i][i];
    if (!Number.isFinite(coef[i])) {
      return { ok: false, reason: 'singular', rank: i, rdiag };
    }
  }

  const r = Array.from({ length: p }, (_, i) => {
    const row = new Array<number>(p).fill(0);
    for (let j = i; j < p; j++) row[j] = A[i][j];
    return row;
  });

  return { ok: true, beta: coef, rdiag, r };
}

/** Resuelve A x = b con eliminación de Gauss y pivoteo parcial. */
export function solveSystem(matrix: number[][], vector: number[], tol = 1e-12): number[] | null {
  const n = matrix.length;
  if (!n || vector.length !== n) return null;
  const A = matrix.map((row, i) => [...row, vector[i]]);
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(A[i][k]) > Math.abs(A[pivot][k])) pivot = i;
    }
    if (Math.abs(A[pivot][k]) < tol) return null;
    if (pivot !== k) {
      const tmp = A[k];
      A[k] = A[pivot];
      A[pivot] = tmp;
    }
    const akk = A[k][k];
    for (let j = k; j <= n; j++) A[k][j] /= akk;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const factor = A[i][k];
      if (factor === 0) continue;
      for (let j = k; j <= n; j++) A[i][j] -= factor * A[k][j];
    }
  }
  return A.map(row => row[n]);
}

/** (XᵀX)⁻¹ a partir de R de la factorización QR, con X de rango completo. */
export function covarianceFromR(r: number[][], sigma2: number): number[][] | null {
  const p = r.length;
  const inv = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  for (let col = 0; col < p; col++) {
    const e = new Array<number>(p).fill(0);
    e[col] = 1;
    for (let i = p - 1; i >= 0; i--) {
      let acc = e[i];
      for (let j = i + 1; j < p; j++) acc -= r[i][j] * inv[j][col];
      if (Math.abs(r[i][i]) < 1e-14) return null;
      inv[i][col] = acc / r[i][i];
    }
  }
  const xtxInv = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let acc = 0;
      for (let k = 0; k < p; k++) acc += inv[k][i] * inv[k][j];
      xtxInv[i][j] = sigma2 * acc;
    }
  }
  return xtxInv;
}

export function conditionFromR(rdiag: number[]): number | null {
  const abs = rdiag.map(d => Math.abs(d)).filter(d => d > 0);
  if (!abs.length) return null;
  return Math.max(...abs) / Math.min(...abs);
}
