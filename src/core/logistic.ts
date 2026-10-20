import { fail, fmt, formatEquation, mean, type Fail, type Step } from './format';
import { solveSystem } from './linalg';

export function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

export function logit(p: number): number {
  const clipped = Math.min(1 - 1e-15, Math.max(1e-15, p));
  return Math.log(clipped / (1 - clipped));
}

export interface Confusion {
  vp: number;
  vn: number;
  fp: number;
  fn: number;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
  f1: number | null;
}

export function confusionFromBinary(actualPositive: boolean[], predictedPositive: boolean[]): Confusion {
  let vp = 0, vn = 0, fp = 0, fn = 0;
  for (let i = 0; i < actualPositive.length; i++) {
    const a = actualPositive[i];
    const p = predictedPositive[i];
    if (a && p) vp += 1;
    else if (!a && !p) vn += 1;
    else if (!a && p) fp += 1;
    else fn += 1;
  }
  const total = vp + vn + fp + fn;
  const accuracy = total ? (vp + vn) / total : null;
  const precision = vp + fp > 0 ? vp / (vp + fp) : null;
  const recall = vp + fn > 0 ? vp / (vp + fn) : null;
  const specificity = vn + fp > 0 ? vn / (vn + fp) : null;
  const f1 = precision !== null && recall !== null && precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : null;
  return { vp, vn, fp, fn, accuracy, precision, recall, specificity, f1 };
}

export interface LogisticIteration {
  iteration: number;
  beta: number[];
  logLik: number;
  gradNorm: number;
  delta: number[] | null;
}

export interface LogisticFit {
  n: number;
  names: string[];
  intercept: number;
  coefficients: number[];
  equation: string;
  probabilities: number[];
  linear: number[];
  logLoss: number;
  logLik: number;
  nullLogLik: number | null;
  mcfadden: number | null;
  iterations: LogisticIteration[];
  converged: boolean;
  oddsRatios: { name: string; or: number }[];
  steps: Step[];
}

export type LogisticResult = { ok: true; fit: LogisticFit } | Fail;

export interface LogisticOptions {
  maxIter?: number;
  tol?: number;
}

function designRow(x: number[]): number[] {
  return [1, ...x];
}

function linearPredictor(beta: number[], x: number[]): number {
  let z = beta[0];
  for (let j = 0; j < x.length; j++) z += beta[j + 1] * x[j];
  return z;
}

export function logLikelihood(y: number[], probabilities: number[]): number {
  let ll = 0;
  for (let i = 0; i < y.length; i++) {
    const p = Math.min(1 - 1e-15, Math.max(1e-15, probabilities[i]));
    ll += y[i] === 1 ? Math.log(p) : Math.log(1 - p);
  }
  return ll;
}

export function meanLogLoss(y: number[], probabilities: number[]): number {
  return -logLikelihood(y, probabilities) / y.length;
}

/** Aplica un modelo ya dado. No entrena: sirve para separar el ejemplo manual del ajuste real. */
export function applyLogistic(beta: number[], predictors: number[][], y: number[] | null) {
  const linear = predictors.map(row => linearPredictor(beta, row));
  const probabilities = linear.map(sigmoid);
  const ll = y ? logLikelihood(y, probabilities) : null;
  return { linear, probabilities, logLik: ll, logLoss: y ? meanLogLoss(y, probabilities) : null };
}

export function classifyProbability(probability: number, threshold: number, positive: string, negative: string): string {
  return probability >= threshold ? positive : negative;
}

export function fitLogistic(
  predictors: number[][],
  y: number[],
  names: string[],
  options: LogisticOptions = {},
): LogisticResult {
  const maxIter = options.maxIter ?? 40;
  const tol = options.tol ?? 1e-8;
  const errors: string[] = [];
  const n = y.length;
  const p = names.length;
  if (predictors.length !== n) errors.push('Cada fila debe tener las variables explicativas y la clase.');
  if (n < p + 1) errors.push(`Hay ${n} filas y ${p + 1} coeficientes. Hace falta al menos un dato más que coeficientes para un ajuste identificable.`);
  if (predictors.some(row => row.length !== p || row.some(v => !Number.isFinite(v)))) {
    errors.push('Hay celdas vacías o no numéricas en las variables explicativas.');
  }
  if (y.some(v => v !== 0 && v !== 1)) errors.push('La clase debe codificarse como 0 o 1 antes de entrenar.');
  const positives = y.filter(v => v === 1).length;
  if (y.length && (positives === 0 || positives === y.length)) {
    errors.push('La variable objetivo tiene una sola clase. La regresión logística necesita las dos clases en los datos de entrenamiento.');
  }
  for (let j = 0; j < p; j++) {
    const col = predictors.map(row => row[j]);
    if (col.every(v => v === col[0])) {
      errors.push(`La variable ${names[j]} es constante. Elimínala: no aporta información para separar las clases.`);
    }
  }
  if (errors.length) return fail([...new Set(errors)]);

  const k = p + 1;
  let beta = new Array<number>(k).fill(0);
  const history: LogisticIteration[] = [];
  let converged = false;
  let singularAt: number | null = null;

  for (let iter = 0; iter < maxIter; iter++) {
    const linear = predictors.map(row => linearPredictor(beta, row));
    const prob = linear.map(sigmoid);
    const ll = logLikelihood(y, prob);
    const gradient = new Array<number>(k).fill(0);
    const hessian = Array.from({ length: k }, () => new Array<number>(k).fill(0));
    for (let i = 0; i < n; i++) {
      const row = designRow(predictors[i]);
      const w = prob[i] * (1 - prob[i]);
      const resid = y[i] - prob[i];
      for (let a = 0; a < k; a++) {
        gradient[a] += row[a] * resid;
        for (let b = 0; b < k; b++) hessian[a][b] += w * row[a] * row[b];
      }
    }
    const gradNorm = Math.sqrt(gradient.reduce((acc, g) => acc + g * g, 0));
    if (gradNorm < tol) {
      history.push({ iteration: iter, beta: beta.slice(), logLik: ll, gradNorm, delta: null });
      converged = true;
      break;
    }
    const delta = solveSystem(hessian, gradient);
    if (!delta) {
      history.push({ iteration: iter, beta: beta.slice(), logLik: ll, gradNorm, delta: null });
      singularAt = iter;
      break;
    }
    const next = beta.map((b, i) => b + delta[i]);
    if (next.some(v => !Number.isFinite(v) || Math.abs(v) > 50)) {
      history.push({ iteration: iter, beta: beta.slice(), logLik: ll, gradNorm, delta });
      singularAt = iter;
      break;
    }
    history.push({ iteration: iter, beta: beta.slice(), logLik: ll, gradNorm, delta });
    beta = next;
    const step = Math.max(...delta.map(v => Math.abs(v)));
    if (step < tol) {
      const linear2 = predictors.map(row => linearPredictor(beta, row));
      const prob2 = linear2.map(sigmoid);
      history.push({
        iteration: iter + 1,
        beta: beta.slice(),
        logLik: logLikelihood(y, prob2),
        gradNorm: 0,
        delta: null,
      });
      converged = true;
      break;
    }
  }

  if (!converged) {
    const last = history[history.length - 1];
    return fail([
      singularAt !== null
        ? 'El método de Newton-Raphson se detuvo porque la matriz de información es singular o los coeficientes se disparan. Suele ocurrir con separación perfecta o con variables colineales. Agrega datos que no separen las clases de forma exacta, o quita una variable redundante.'
        : `El entrenamiento no convergió en ${maxIter} iteraciones (última log-verosimilitud ${last ? fmt(last.logLik, 4) : '—'}). Prueba con más datos o revisa si una variable separa las clases por completo.`,
    ]);
  }

  const linear = predictors.map(row => linearPredictor(beta, row));
  const probabilities = linear.map(sigmoid);
  const logLik = logLikelihood(y, probabilities);
  const pBar = mean(y);
  const nullLogLik = y.reduce((acc, yi) => acc + (yi === 1 ? Math.log(pBar) : Math.log(1 - pBar)), 0);
  const mcfadden = nullLogLik === 0 ? null : 1 - logLik / nullLogLik;
  const equation = `logit(p) = ${formatEquation(beta[0], names.map((name, j) => ({ coef: beta[j + 1], name }))).replace('ŷ = ', '')}`;
  const oddsRatios = names.map((name, j) => ({ name, or: Math.exp(beta[j + 1]) }));

  const steps = buildSteps(names, history, beta, equation, oddsRatios, logLik, nullLogLik, mcfadden);

  return {
    ok: true,
    fit: {
      n,
      names,
      intercept: beta[0],
      coefficients: beta.slice(1),
      equation,
      probabilities,
      linear,
      logLoss: -logLik / n,
      logLik,
      nullLogLik,
      mcfadden,
      iterations: history,
      converged,
      oddsRatios,
      steps,
    },
  };
}

function buildSteps(
  names: string[],
  history: LogisticIteration[],
  beta: number[],
  equation: string,
  oddsRatios: { name: string; or: number }[],
  logLik: number,
  nullLogLik: number,
  mcfadden: number | null,
): Step[] {
  const first = history[0];
  const second = history[1];
  const steps: Step[] = [
    {
      title: 'Por qué no hay solución cerrada',
      body: 'La verosimilitud logística no se maximiza con mínimos cuadrados. El gradiente y la matriz de información dependen de las probabilidades, y esas probabilidades dependen de los coeficientes. Por eso se usa Newton-Raphson, empezando en β = 0.',
      latex: '\\ell(\\beta)=\\sum\\left[y_i\\log p_i+(1-y_i)\\log(1-p_i)\\right],\\quad p_i=\\sigma(x_i^{\\top}\\beta)',
    },
  ];
  if (first) {
    steps.push({
      title: 'Iteración inicial',
      body: `Con β = (${first.beta.map(v => fmt(v, 4)).join(', ')}), la log-verosimilitud es ${fmt(first.logLik, 6)} y la norma del gradiente es ${fmt(first.gradNorm, 6)}. ${
        first.delta ? `El paso de Newton es (${first.delta.map(v => fmt(v, 4)).join(', ')}).` : 'No hubo paso porque el gradiente ya era pequeño o la Hessiana no se pudo invertir.'
      }`,
      latex: '\\beta^{(t+1)}=\\beta^{(t)}+(X^{\\top}WX)^{-1}X^{\\top}(y-p),\\quad w_i=p_i(1-p_i)',
    });
  }
  if (second?.delta) {
    steps.push({
      title: 'Segunda iteración',
      body: `β pasa a (${second.beta.map(v => fmt(v, 4)).join(', ')}), con log-verosimilitud ${fmt(second.logLik, 6)} y paso (${second.delta.map(v => fmt(v, 4)).join(', ')}).`,
    });
  }
  const table = history
    .filter(row => row.delta || row.iteration === history.length - 1)
    .slice(0, 8)
    .map(row => `t=${row.iteration}: β=(${row.beta.map(v => fmt(v, 4)).join(', ')}), ℓ=${fmt(row.logLik, 4)}`)
    .join(' · ');
  steps.push({
    title: 'Convergencia',
    body: `${table}. El modelo final es ${equation}. Coeficientes: intercepto ${fmt(beta[0], 4)}${names.map((name, j) => `, ${name} ${fmt(beta[j + 1], 4)}`).join('')}.`,
  });
  steps.push({
    title: 'De la combinación lineal a la clase',
    body: `Para cada fila se calcula z = β₀ + Σ βⱼ xⱼ y p = 1/(1+e^{−z}). La clase se asigna solo después, comparando p con el umbral elegido en la interfaz. Razones de momios: ${oddsRatios.map(o => `${o.name}: e^β = ${fmt(o.or, 4)}`).join('; ') || 'no hay variables explicativas'}. Log-verosimilitud final ${fmt(logLik, 4)}; modelo nulo ${fmt(nullLogLik, 4)}; pseudo-R² de McFadden ${mcfadden === null ? 'no definido' : fmt(mcfadden, 4)}.`,
    latex: '\\sigma(z)=\\frac{1}{1+e^{-z}},\\quad \\hat y=1\\ \\text{si}\\ \\hat p\\ge \\tau',
  });
  return steps;
}

export function metricsAtThreshold(
  y: number[],
  probabilities: number[],
  threshold: number,
): { classes: number[]; confusion: Confusion } | Fail {
  if (!(threshold > 0 && threshold < 1)) {
    return fail(['El umbral debe estar estrictamente entre 0 y 1.']);
  }
  const classes = probabilities.map(p => (p >= threshold ? 1 : 0));
  const confusion = confusionFromBinary(y.map(v => v === 1), classes.map(v => v === 1));
  return { classes, confusion };
}
