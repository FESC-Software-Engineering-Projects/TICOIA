import { studentTTwoSidedP } from './distributions';
import { fail, fmt, formatEquation, mean, sum, type Fail, type Step } from './format';

export interface SimplePoint {
  x: number;
  y: number;
  yHat: number;
  residual: number;
  squared: number;
}

export interface SimpleFit {
  n: number;
  meanX: number;
  meanY: number;
  sumX: number;
  sumY: number;
  sumXY: number;
  sumX2: number;
  sumY2: number;
  sxx: number;
  sxy: number;
  syy: number;
  intercept: number;
  slope: number;
  equation: string;
  points: SimplePoint[];
  sse: number;
  ssr: number;
  sst: number;
  r2: number | null;
  correlation: number | null;
  mse: number | null;
  sigma2: number | null;
  sigma: number | null;
  seSlope: number | null;
  seIntercept: number | null;
  tSlope: number | null;
  tIntercept: number | null;
  pSlope: number | null;
  pIntercept: number | null;
  df: number;
  prediction: null | {
    x: number;
    yHat: number;
    extrapolation: boolean;
  };
  steps: Step[];
  interpretation: string[];
}

export type SimpleResult = { ok: true; fit: SimpleFit } | Fail;

export function fitSimpleLinear(xs: number[], ys: number[], x0?: number | null): SimpleResult {
  const errors: string[] = [];
  if (xs.length !== ys.length) errors.push('Las columnas X e Y no tienen la misma cantidad de valores.');
  if (xs.length < 2) errors.push('Se necesitan al menos dos observaciones completas para trazar una recta.');
  if (xs.some(v => !Number.isFinite(v)) || ys.some(v => !Number.isFinite(v))) {
    errors.push('Hay valores vacíos, no numéricos o infinitos. Corrige la tabla antes de calcular.');
  }
  if (errors.length) return fail(errors);

  const n = xs.length;
  const sumX = sum(xs);
  const sumY = sum(ys);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const sxx = sumX2 - (sumX * sumX) / n;
  const sxy = sumXY - (sumX * sumY) / n;
  const syy = sumY2 - (sumY * sumY) / n;

  if (Math.abs(sxx) < 1e-12) {
    return fail([
      'La variable X es constante, así que Sxx = 0 y la pendiente no está definida. Usa valores de X que no sean todos iguales.',
    ]);
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const points: SimplePoint[] = xs.map((x, i) => {
    const yHat = intercept + slope * x;
    const residual = ys[i] - yHat;
    return { x, y: ys[i], yHat, residual, squared: residual * residual };
  });
  const sse = sum(points.map(p => p.squared));
  const ssr = slope * sxy;
  const sst = syy;
  const r2 = Math.abs(sst) < 1e-12 ? null : 1 - sse / sst;
  const correlation = Math.abs(sxx) < 1e-12 || Math.abs(syy) < 1e-12 ? null : sxy / Math.sqrt(sxx * syy);

  const df = n - 2;
  let sigma2: number | null = null;
  let sigma: number | null = null;
  let mse: number | null = null;
  let seSlope: number | null = null;
  let seIntercept: number | null = null;
  let tSlope: number | null = null;
  let tIntercept: number | null = null;
  let pSlope: number | null = null;
  let pIntercept: number | null = null;
  if (df > 0) {
    sigma2 = sse / df;
    sigma = Math.sqrt(sigma2);
    mse = sse / n;
    seSlope = Math.sqrt(sigma2 / sxx);
    seIntercept = Math.sqrt(sigma2 * (1 / n + (meanX * meanX) / sxx));
    tSlope = seSlope > 0 ? slope / seSlope : null;
    tIntercept = seIntercept > 0 ? intercept / seIntercept : null;
    pSlope = tSlope === null ? null : studentTTwoSidedP(tSlope, df);
    pIntercept = tIntercept === null ? null : studentTTwoSidedP(tIntercept, df);
  }

  let prediction: SimpleFit['prediction'] = null;
  if (x0 !== null && x0 !== undefined) {
    if (!Number.isFinite(x0)) {
      return fail(['El valor de X para predecir no es un número finito.']);
    }
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    prediction = {
      x: x0,
      yHat: intercept + slope * x0,
      extrapolation: x0 < xmin - 1e-9 || x0 > xmax + 1e-9,
    };
  }

  const equation = formatEquation(intercept, [{ coef: slope, name: 'x' }]);
  const steps = buildSteps({
    n, sumX, sumY, meanX, meanY, sumXY, sumX2, sumY2, sxx, sxy, syy, slope, intercept, equation,
    sse, ssr, sst, r2, correlation, prediction, sigma2, seSlope, tSlope, df,
  });

  const interpretation: string[] = [];
  interpretation.push(
    slope >= 0
      ? `La pendiente ${fmt(slope)} indica que, por cada unidad adicional de X, el valor esperado de Y cambia en +${fmt(slope)}.`
      : `La pendiente ${fmt(slope)} indica que, por cada unidad adicional de X, el valor esperado de Y cambia en ${fmt(slope)} (relación inversa).`,
  );
  interpretation.push(
    `El intercepto ${fmt(intercept)} es el valor esperado de Y cuando X = 0. Si 0 está fuera del rango observado, es solo un parámetro de ajuste.`,
  );
  if (r2 === null) {
    interpretation.push('Y no varía (SST = 0), así que R² y la correlación no se interpretan.');
  } else {
    interpretation.push(`El modelo explica el ${fmt(r2 * 100, 2)} % de la variabilidad de Y (R² = ${fmt(r2)}).`);
  }
  if (correlation !== null) {
    const mag = Math.abs(correlation);
    const fuerza = mag >= 0.9 ? 'muy fuerte' : mag >= 0.7 ? 'fuerte' : mag >= 0.4 ? 'moderada' : 'débil';
    interpretation.push(
      `La correlación es ${fmt(correlation)}: asociación lineal ${fuerza} y ${correlation >= 0 ? 'positiva' : 'negativa'}.`,
    );
  }
  if (prediction?.extrapolation) {
    interpretation.push(
      `La predicción en X = ${fmt(prediction.x)} cae fuera del rango observado [${fmt(Math.min(...xs))}, ${fmt(Math.max(...xs))}]. Es una extrapolación y debe leerse con cautela.`,
    );
  }

  return {
    ok: true,
    fit: {
      n, meanX, meanY, sumX, sumY, sumXY, sumX2, sumY2, sxx, sxy, syy,
      intercept, slope, equation, points, sse, ssr, sst, r2, correlation,
      mse, sigma2, sigma, seSlope, seIntercept, tSlope, tIntercept, pSlope, pIntercept, df,
      prediction, steps, interpretation,
    },
  };
}

function buildSteps(d: {
  n: number; sumX: number; sumY: number; meanX: number; meanY: number;
  sumXY: number; sumX2: number; sumY2: number; sxx: number; sxy: number; syy: number;
  slope: number; intercept: number; equation: string; sse: number; ssr: number; sst: number;
  r2: number | null; correlation: number | null;
  prediction: SimpleFit['prediction']; sigma2: number | null; seSlope: number | null;
  tSlope: number | null; df: number;
}): Step[] {
  const steps: Step[] = [
    {
      title: 'Sumas y medias',
      body: `Con n = ${d.n}: Σx = ${fmt(d.sumX, 6)}, Σy = ${fmt(d.sumY, 6)}, Σxy = ${fmt(d.sumXY, 6)}, Σx² = ${fmt(d.sumX2, 6)} y Σy² = ${fmt(d.sumY2, 6)}. Las medias son x̄ = ${fmt(d.sumX, 6)}/${d.n} = ${fmt(d.meanX, 6)} y ȳ = ${fmt(d.sumY, 6)}/${d.n} = ${fmt(d.meanY, 6)}.`,
      latex: '\\bar{x}=\\frac{1}{n}\\sum x_i,\\quad \\bar{y}=\\frac{1}{n}\\sum y_i',
    },
    {
      title: 'Sumas de cuadrados centradas',
      body: `Sxx = ${fmt(d.sumX2, 6)} − (${fmt(d.sumX, 6)})²/${d.n} = ${fmt(d.sxx, 6)}. Sxy = ${fmt(d.sumXY, 6)} − (${fmt(d.sumX, 6)})(${fmt(d.sumY, 6)})/${d.n} = ${fmt(d.sxy, 6)}. Syy = ${fmt(d.sumY2, 6)} − (${fmt(d.sumY, 6)})²/${d.n} = ${fmt(d.syy, 6)}.`,
      latex: 'S_{xx}=\\sum x_i^2-\\frac{(\\sum x_i)^2}{n},\\quad S_{xy}=\\sum x_i y_i-\\frac{(\\sum x_i)(\\sum y_i)}{n}',
    },
    {
      title: 'Pendiente e intercepto',
      body: `b₁ = Sxy / Sxx = ${fmt(d.sxy, 6)} / ${fmt(d.sxx, 6)} = ${fmt(d.slope, 6)}. b₀ = ȳ − b₁ x̄ = ${fmt(d.meanY, 6)} − (${fmt(d.slope, 6)})(${fmt(d.meanX, 6)}) = ${fmt(d.intercept, 6)}. La recta es ${d.equation}.`,
      latex: 'b_1=\\frac{S_{xy}}{S_{xx}},\\quad b_0=\\bar{y}-b_1\\bar{x}',
    },
    {
      title: 'Ajuste y residuales',
      body: `SST = Syy = ${fmt(d.sst, 6)}. SSR = b₁ Sxy = ${fmt(d.ssr, 6)}. SSE = Σ eᵢ² = ${fmt(d.sse, 6)}. Se cumple SST = SSR + SSE, salvo redondeo (${fmt(d.ssr + d.sse, 6)}).`,
      latex: 'SST=SSR+SSE,\\quad R^2=1-\\frac{SSE}{SST}',
    },
  ];
  if (d.r2 === null) {
    steps.push({
      title: 'R² y correlación',
      body: 'SST es cero porque Y no varía. R² y la correlación no están definidos.',
    });
  } else {
    steps.push({
      title: 'R² y correlación',
      body: `R² = 1 − SSE/SST = 1 − ${fmt(d.sse, 6)}/${fmt(d.sst, 6)} = ${fmt(d.r2, 6)}. ${
        d.correlation === null
          ? 'La correlación no se calcula porque Syy = 0.'
          : `r = Sxy / √(Sxx Syy) = ${fmt(d.correlation, 6)}.`
      }`,
      latex: 'r=\\frac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}}',
    });
  }
  if (d.df > 0 && d.sigma2 !== null && d.seSlope !== null && d.tSlope !== null) {
    steps.push({
      title: 'Error típico de la pendiente',
      body: `Con ${d.df} grados de libertad, s² = SSE/(n−2) = ${fmt(d.sigma2, 6)}. EE(b₁) = √(s²/Sxx) = ${fmt(d.seSlope, 6)} y t = b₁/EE(b₁) = ${fmt(d.tSlope, 6)}. El valor p de dos colas sale de la distribución t; no es una tabla fija.`,
      latex: 't=\\frac{b_1}{\\sqrt{s^2/S_{xx}}},\\quad s^2=\\frac{SSE}{n-2}',
    });
  } else {
    steps.push({
      title: 'Varianza del error',
      body: 'Con solo dos observaciones, n−2 = 0 y no hay grados de libertad para estimar s². La recta queda determinada, pero no hay prueba t.',
    });
  }
  if (d.prediction) {
    steps.push({
      title: 'Predicción solicitada',
      body: `Para x = ${fmt(d.prediction.x, 6)}: ŷ = ${fmt(d.intercept, 6)} + (${fmt(d.slope, 6)})(${fmt(d.prediction.x, 6)}) = ${fmt(d.prediction.yHat, 6)}.${
        d.prediction.extrapolation ? ' Este x está fuera del rango de los datos.' : ' Este x está dentro del rango observado.'
      }`,
      latex: '\\hat{y}_0=b_0+b_1 x_0',
    });
  }
  return steps;
}

export function seriesForChart(fit: SimpleFit): { points: { x: number; y: number }[]; line: { x: number; y: number }[]; residuals: { x: number; y: number }[] } {
  const xs = fit.points.map(p => p.x);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const span = max - min || 1;
  const line = [0, 1, 2, 3, 4].map(i => {
    const x = min - span * 0.08 + ((span * 1.16) * i) / 4;
    return { x, y: fit.intercept + fit.slope * x };
  });
  return {
    points: fit.points.map(p => ({ x: p.x, y: p.y })),
    line,
    residuals: fit.points.map(p => ({ x: p.x, y: p.residual })),
  };
}
