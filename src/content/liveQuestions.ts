import type { SimpleFit } from '../core/simpleLinear';
import type { MultiFit } from '../core/multipleLinear';
import type { LogisticFit } from '../core/logistic';
import { metricsAtThreshold } from '../core/logistic';
import type { TreeFit } from '../core/decisionTree';
import { fmt } from '../core/format';
import type { ExerciseQuestion } from './exercises';

export function questionsFromSimple(fit: SimpleFit): ExerciseQuestion[] {
  const pred = fit.prediction;
  const items: ExerciseQuestion[] = [
    { id: 'mx', prompt: 'Media de X', hints: ['Suma las X y divide entre n.', `n = ${fit.n}.`], expected: Number(fit.meanX.toFixed(4)), solution: `x̄ = ${fmt(fit.meanX, 4)}.` },
    { id: 'my', prompt: 'Media de Y', hints: ['Suma las Y y divide entre n.'], expected: Number(fit.meanY.toFixed(4)), solution: `ȳ = ${fmt(fit.meanY, 4)}.` },
    { id: 'b1', prompt: 'Pendiente', hints: ['b1 = Sxy / Sxx.', `Sxx = ${fmt(fit.sxx, 4)} y Sxy = ${fmt(fit.sxy, 4)}.`], expected: Number(fit.slope.toFixed(4)), solution: `b1 = ${fmt(fit.slope, 4)}.` },
    { id: 'b0', prompt: 'Intercepto', hints: ['b0 = ȳ − b1 x̄.'], expected: Number(fit.intercept.toFixed(4)), solution: `b0 = ${fmt(fit.intercept, 4)}.` },
  ];
  if (fit.r2 !== null) {
    items.push({ id: 'r2', prompt: 'R²', hints: ['R² = 1 − SSE/SST.', `SSE = ${fmt(fit.sse, 4)} y SST = ${fmt(fit.sst, 4)}.`], expected: Number(fit.r2.toFixed(4)), solution: `R² = ${fmt(fit.r2, 4)}.` });
  }
  if (pred) {
    items.push({ id: 'pred', prompt: `Predicción para X = ${fmt(pred.x, 4)}`, hints: ['ŷ = b0 + b1 x.'], expected: Number(pred.yHat.toFixed(4)), solution: `ŷ = ${fmt(pred.yHat, 4)}.` });
  }
  return items;
}

export function questionsFromMultiple(fit: MultiFit): ExerciseQuestion[] {
  const items: ExerciseQuestion[] = fit.coefficients.map((coef, i) => ({
    id: `b${i}`,
    prompt: i === 0 ? 'Intercepto' : `Coeficiente de ${coef.name}`,
    hints: [i === 0 ? 'Es b0 en ŷ = b0 + b1 x1 + …' : `Es el efecto parcial de ${coef.name}, con las demás variables fijas.`],
    expected: Number(coef.value.toFixed(4)),
    solution: `${coef.name} = ${fmt(coef.value, 4)}.`,
  }));
  if (fit.r2 !== null) {
    items.push({ id: 'r2', prompt: 'R²', hints: ['1 − SSE/SST.', `SSE = ${fmt(fit.sse, 4)} y SST = ${fmt(fit.sst, 4)}.`], expected: Number(fit.r2.toFixed(4)), solution: `R² = ${fmt(fit.r2, 4)}.` });
  }
  if (fit.prediction) {
    items.push({
      id: 'pred',
      prompt: 'Predicción del registro nuevo',
      hints: ['Suma el intercepto y cada coeficiente por el valor nuevo.'],
      expected: Number(fit.prediction.yHat.toFixed(4)),
      solution: `ŷ = ${fmt(fit.prediction.yHat, 4)}.`,
    });
  }
  return items;
}

export function questionsFromLogistic(fit: LogisticFit, y: number[], threshold: number): ExerciseQuestion[] {
  const metrics = metricsAtThreshold(y, fit.probabilities, threshold);
  const items: ExerciseQuestion[] = [
    { id: 'b0', prompt: 'Intercepto estimado', hints: ['Sale de Newton-Raphson, no de una fórmula cerrada de mínimos cuadrados.'], expected: Number(fit.intercept.toFixed(4)), solution: `β0 = ${fmt(fit.intercept, 4)}.` },
  ];
  fit.names.forEach((name, i) => {
    items.push({
      id: `b${i}`,
      prompt: `Coeficiente de ${name}`,
      hints: ['Acompaña a esa variable dentro de z, antes de la sigmoide.'],
      expected: Number(fit.coefficients[i].toFixed(4)),
      solution: `${name} = ${fmt(fit.coefficients[i], 4)}.`,
    });
  });
  items.push({
    id: 'p0',
    prompt: 'Probabilidad estimada del primer registro',
    hints: ['Calcula z con los coeficientes y aplica 1/(1+e^{−z}).'],
    expected: Number(fit.probabilities[0].toFixed(4)),
    solution: `p1 = ${fmt(fit.probabilities[0], 4)}.`,
  });
  if (!('ok' in metrics) && metrics.confusion.accuracy !== null) {
    items.push({
      id: 'acc',
      prompt: `Exactitud con umbral ${fmt(threshold, 2)}`,
      hints: ['Cuenta aciertos y divide entre el número de filas. La clase predicha es 1 solo si p ≥ umbral.'],
      expected: Number(metrics.confusion.accuracy.toFixed(4)),
      solution: `Exactitud = ${fmt(metrics.confusion.accuracy, 4)}.`,
    });
  }
  return items;
}

export function questionsFromTree(fit: TreeFit): ExerciseQuestion[] {
  const root = fit.tree;
  const threshold = root.branches.find(b => b.threshold !== undefined)?.threshold;
  const items: ExerciseQuestion[] = [
    {
      id: 'root',
      prompt: 'Variable usada en la raíz',
      hints: [`El criterio activo es ${fit.criterion === 'gini' ? 'Gini' : 'entropía'}.`, 'Se elige la división de menor impureza ponderada.'],
      expected: root.feature ?? root.prediction,
      solution: root.feature ? `La raíz pregunta por ${root.feature}.` : 'La raíz ya es una hoja.',
    },
  ];
  if (threshold !== undefined) {
    items.push({
      id: 'th',
      prompt: 'Umbral numérico de la raíz',
      hints: ['Es el punto medio entre dos valores consecutivos de la variable elegida.'],
      expected: Number(threshold.toFixed(4)),
      solution: `Umbral = ${fmt(threshold, 4)}.`,
    });
  }
  items.push({
    id: 'y1',
    prompt: 'Clase predicha del primer registro',
    hints: ['Sigue las ramas con los valores de la primera fila.'],
    expected: fit.predictions[0],
    solution: `La primera fila llega a la clase ${fit.predictions[0]}.`,
  });
  if (fit.accuracy !== null) {
    items.push({
      id: 'acc',
      prompt: 'Exactitud de entrenamiento',
      hints: ['Aciertos dividido entre el número de filas. No es un desempeño con datos nuevos.'],
      expected: Number(fit.accuracy.toFixed(4)),
      solution: `Exactitud = ${fmt(fit.accuracy, 4)}.`,
    });
  }
  return items;
}
