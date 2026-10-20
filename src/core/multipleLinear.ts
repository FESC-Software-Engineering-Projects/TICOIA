import { fisherUpperP, studentTTwoSidedP } from './distributions';
import { fail, fmt, formatEquation, mean, type Fail, type Step } from './format';
import { conditionFromR, covarianceFromR, leastSquares } from './linalg';

export interface MultiRow {
  x: number[];
  y: number;
  yHat: number;
  residual: number;
  squared: number;
}

export interface CoefInfo {
  name: string;
  value: number;
  se: number | null;
  t: number | null;
  p: number | null;
  vif: number | null;
}

export interface PredictionExplain {
  x: number[];
  yHat: number;
  terms: { name: string; coef: number; value: number | null; product: number; centered: number | null }[];
  note: string;
}

export interface MultiFit {
  n: number;
  p: number;
  names: string[];
  meansX: number[];
  meanY: number;
  coefficients: CoefInfo[];
  intercept: number;
  equation: string;
  rows: MultiRow[];
  sse: number;
  ssr: number;
  sst: number;
  r2: number | null;
  r2Adj: number | null;
  mse: number | null;
  sigma2: number | null;
  f: number | null;
  pF: number | null;
  dfModel: number;
  dfError: number;
  condition: number | null;
  prediction: PredictionExplain | null;
  steps: Step[];
  interpretation: string[];
}

export type MultiResult = { ok: true; fit: MultiFit } | Fail;

export function fitMultiple(
  predictors: number[][],
  y: number[],
  names: string[],
  x0?: number[] | null,
): MultiResult {
  const errors: string[] = [];
  const n = y.length;
  const p = names.length;
  if (predictors.length !== n) errors.push('Cada observación debe tener la variable objetivo y todas las explicativas.');
  if (n === 0 || p === 0) errors.push('Agrega observaciones y al menos una variable explicativa.');
  if (p > 0 && n < p + 1) {
    errors.push(`Hay ${n} observaciones y ${p + 1} coeficientes (intercepto incluido). Se necesita al menos una observación más que coeficientes.`);
  }
  if (predictors.some(row => row.length !== p || row.some(v => !Number.isFinite(v))) || y.some(v => !Number.isFinite(v))) {
    errors.push('Hay celdas vacías, no numéricas o infinitas. Completa la tabla con números finitos.');
  }
  if (errors.length) return fail(errors);

  for (let j = 0; j < p; j++) {
    const col = predictors.map(row => row[j]);
    const m = mean(col);
    if (col.every(v => Math.abs(v - m) < 1e-12)) {
      return fail([
        `La variable ${names[j]} es constante. Su coeficiente no se puede separar del intercepto. Cámbiala o elimínala.`,
      ]);
    }
  }
  if (y.every(v => Math.abs(v - y[0]) < 1e-12) && p >= n) {
    return fail(['No hay suficientes observaciones distintas para estimar el modelo.']);
  }

  const X = predictors.map(row => [1, ...row]);
  const solved = leastSquares(X, y);
  if (!solved.ok) {
    return fail([
      solved.reason === 'empty'
        ? 'La matriz de diseño está vacía.'
        : `La matriz de diseño tiene rango ${solved.rank} y se necesitan ${p + 1} columnas independientes. Hay colinealidad exacta o datos insuficientes: quita una variable redundante o agrega observaciones que no sean combinaciones de las demás.`,
    ]);
  }

  const beta = solved.beta;
  const rows: MultiRow[] = predictors.map((row, i) => {
    let yHat = beta[0];
    for (let j = 0; j < p; j++) yHat += beta[j + 1] * row[j];
    const residual = y[i] - yHat;
    return { x: row, y: y[i], yHat, residual, squared: residual * residual };
  });

  const meanY = mean(y);
  const sse = rows.reduce((acc, row) => acc + row.squared, 0);
  const sst = y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0);
  const ssr = sst - sse;
  const r2 = Math.abs(sst) < 1e-12 ? null : 1 - sse / sst;
  const dfModel = p;
  const dfError = n - p - 1;
  const sigma2 = dfError > 0 ? sse / dfError : null;
  const mse = sse / n;
  const r2Adj = r2 === null || dfError <= 0 || n <= 1
    ? null
    : 1 - (sse / dfError) / (sst / (n - 1));
  const msr = dfModel > 0 ? ssr / dfModel : null;
  const f = sigma2 !== null && sigma2 > 0 && msr !== null ? msr / sigma2 : null;
  const pF = f !== null && dfError > 0 ? fisherUpperP(f, dfModel, dfError) : null;

  const cov = sigma2 !== null ? covarianceFromR(solved.r, sigma2) : null;
  const meansX = names.map((_, j) => mean(predictors.map(row => row[j])));
  const coefficients: CoefInfo[] = beta.map((value, k) => {
    const se = cov ? Math.sqrt(Math.max(0, cov[k][k])) : null;
    const t = se && se > 1e-15 ? value / se : null;
    const pValue = t !== null && dfError > 0 ? studentTTwoSidedP(t, dfError) : null;
    return {
      name: k === 0 ? 'Intercepto' : names[k - 1],
      value,
      se,
      t,
      p: pValue,
      vif: null,
    };
  });

  for (let j = 0; j < p; j++) {
    coefficients[j + 1].vif = varianceInflation(
      predictors.map(row => row[j]),
      predictors.map(row => row.filter((_, idx) => idx !== j)),
    );
  }

  const equation = formatEquation(beta[0], names.map((name, j) => ({ coef: beta[j + 1], name })));
  const prediction = x0 && x0.length === p && x0.every(Number.isFinite)
    ? explainPrediction(beta, names, meansX, meanY, x0)
    : null;

  const condition = conditionFromR(solved.rdiag);
  const steps = buildSteps({
    n, p, names, meansX, meanY, beta, equation, sse, ssr, sst, r2, r2Adj, f, dfModel, dfError, condition, prediction, rows,
  });

  const interpretation: string[] = [
    'Cada coeficiente de una variable explicativa es el cambio esperado en Y cuando esa variable aumenta una unidad y las demás se mantienen fijas.',
  ];
  names.forEach((name, j) => {
    interpretation.push(`${name}: coeficiente ${fmt(beta[j + 1], 4)}.`);
  });
  if (r2 === null) {
    interpretation.push('Y es constante (SST = 0). R² y R² ajustado no se interpretan.');
  } else {
    interpretation.push(`R² = ${fmt(r2, 4)}: el modelo explica el ${fmt(r2 * 100, 2)} % de la variabilidad de Y.`);
    if (r2Adj !== null) interpretation.push(`R² ajustado = ${fmt(r2Adj, 4)}. Penaliza el número de variables para no premiar un modelo solo por ser más grande.`);
  }
  const highVif = coefficients.filter(c => c.vif !== null && c.vif > 5 && c.name !== 'Intercepto');
  if (highVif.length) {
    interpretation.push(
      `Multicolinealidad: ${highVif.map(c => `${c.name} tiene VIF ${fmt(c.vif!, 2)}`).join('; ')}. Un VIF mayor que 5 (y sobre todo mayor que 10) indica que esa variable se puede predecir con las demás y su coeficiente es inestable.`,
    );
  } else {
    interpretation.push('Ninguna variable explicativa supera VIF = 5 con estos datos. Eso no demuestra que el modelo sea correcto, solo que no hay una colinealidad fuerte entre las columnas.');
  }
  if (condition !== null && condition > 1e6) {
    interpretation.push(`El número de condición aproximado de R es ${fmt(condition, 2)}. El sistema está mal condicionado: pequeños cambios en los datos pueden mover mucho los coeficientes.`);
  }
  if (prediction) {
    interpretation.push(`La predicción del registro nuevo es ${fmt(prediction.yHat, 4)}. ${prediction.note}`);
  }

  return {
    ok: true,
    fit: {
      n, p, names, meansX, meanY, coefficients, intercept: beta[0], equation, rows,
      sse, ssr, sst, r2, r2Adj, mse, sigma2, f, pF, dfModel, dfError, condition, prediction, steps, interpretation,
    },
  };
}

/** VIF de una columna al regresarla sobre las demás. Con una sola explicativa, VIF = 1. */
function varianceInflation(target: number[], others: number[][]): number | null {
  if (others[0] && others[0].length === 0) return 1;
  const X = others.map(row => [1, ...row]);
  const solved = leastSquares(X, target);
  if (!solved.ok) return null;
  const meanT = mean(target);
  const sst = target.reduce((acc, value) => acc + (value - meanT) ** 2, 0);
  if (Math.abs(sst) < 1e-12) return null;
  let sse = 0;
  for (let i = 0; i < target.length; i++) {
    let yHat = solved.beta[0];
    for (let j = 0; j < others[i].length; j++) yHat += solved.beta[j + 1] * others[i][j];
    sse += (target[i] - yHat) ** 2;
  }
  const r2 = 1 - sse / sst;
  if (r2 >= 1 - 1e-10) return Number.POSITIVE_INFINITY;
  return 1 / (1 - r2);
}

export function explainPrediction(
  beta: number[],
  names: string[],
  meansX: number[],
  meanY: number,
  x0: number[],
): PredictionExplain {
  const terms: PredictionExplain['terms'] = [
    { name: 'Intercepto', coef: beta[0], value: null, product: beta[0], centered: null },
  ];
  let yHat = beta[0];
  for (let j = 0; j < names.length; j++) {
    const product = beta[j + 1] * x0[j];
    yHat += product;
    terms.push({
      name: names[j],
      coef: beta[j + 1],
      value: x0[j],
      product,
      centered: beta[j + 1] * (x0[j] - meansX[j]),
    });
  }
  return {
    x: x0,
    yHat,
    terms,
    note: `Si se toma como referencia la media de cada variable, la misma predicción es ȳ + Σ bⱼ(xⱼ − x̄ⱼ) = ${fmt(meanY, 4)} + las contribuciones centradas. El aporte de una variable no es “su valor”, sino su coeficiente por la distancia al punto de referencia.`,
  };
}

function buildSteps(d: {
  n: number; p: number; names: string[]; meansX: number[]; meanY: number; beta: number[];
  equation: string; sse: number; ssr: number; sst: number; r2: number | null; r2Adj: number | null;
  f: number | null; dfModel: number; dfError: number; condition: number | null;
  prediction: PredictionExplain | null; rows: MultiRow[];
}): Step[] {
  const preview = d.rows.slice(0, 4).map((row, i) => `fila ${i + 1}: [1, ${row.x.map(v => fmt(v, 4)).join(', ')}]`).join('; ');
  const steps: Step[] = [
    {
      title: 'Preparación de los datos',
      body: `Hay n = ${d.n} observaciones y p = ${d.p} variables explicativas (${d.names.join(', ')}). Medias: ${d.names.map((name, j) => `${name}̄ = ${fmt(d.meansX[j], 4)}`).join(', ')}; ȳ = ${fmt(d.meanY, 4)}.`,
    },
    {
      title: 'Matriz de diseño',
      body: `Se agrega una columna de unos para el intercepto. X tiene ${d.n} filas y ${d.p + 1} columnas. Primeras filas: ${preview}. El vector β tiene el intercepto y un coeficiente por variable.`,
      latex: 'y = X\\beta + \\varepsilon,\\quad \\hat\\beta = \\arg\\min \\lVert X\\beta - y \\rVert_2',
    },
    {
      title: 'Estimación por mínimos cuadrados (QR)',
      body: `Los coeficientes se obtienen con la factorización QR de Householder, equivalente a las ecuaciones normales cuando X tiene rango completo, y más estable si las columnas están casi alineadas. ${d.condition === null ? '' : `El condicionamiento aproximado de R es ${fmt(d.condition, 2)}.`} Resultado: ${d.equation}.`,
      latex: 'X = QR,\\quad R\\hat\\beta = Q^{\\top} y',
    },
    {
      title: 'Predicciones y residuales',
      body: `Cada ŷᵢ es el producto de la fila de X por β. SSE = ${fmt(d.sse, 6)}, SSR = ${fmt(d.ssr, 6)} y SST = ${fmt(d.sst, 6)}.`,
      latex: '\\hat y = X\\hat\\beta,\\quad e = y-\\hat y,\\quad SSE=\\lVert e\\rVert^2',
    },
  ];
  if (d.r2 === null) {
    steps.push({ title: 'Bondad de ajuste', body: 'SST = 0 porque Y no varía. R² y R² ajustado no se calculan.' });
  } else {
    steps.push({
      title: 'Bondad de ajuste',
      body: `R² = 1 − SSE/SST = ${fmt(d.r2, 6)}. ${d.r2Adj === null ? 'R² ajustado no se calcula porque no hay grados de libertad residuales.' : `R² ajustado = ${fmt(d.r2Adj, 6)} con ${d.dfError} grados de libertad del error.`} ${d.f === null ? '' : `Estadístico F = ${fmt(d.f, 4)} con (${d.dfModel}, ${d.dfError}) grados de libertad.`}`,
      latex: 'R^2_{aj}=1-\\frac{SSE/(n-p-1)}{SST/(n-1)}',
    });
  }
  if (d.prediction) {
    const parts = d.prediction.terms.map(term => (
      term.value === null
        ? `intercepto ${fmt(term.product, 4)}`
        : `${term.name}: (${fmt(term.coef, 4)})·(${fmt(term.value, 4)}) = ${fmt(term.product, 4)}`
    )).join('; ');
    steps.push({
      title: 'Predicción de un registro nuevo',
      body: `${parts}. Suma = ${fmt(d.prediction.yHat, 6)}. ${d.prediction.note}`,
      latex: '\\hat y_0 = b_0 + b_1 x_{01} + \\cdots + b_p x_{0p}',
    });
  }
  return steps;
}
