/**
 * Verificación matemática de regresión lineal, múltiple, logística y árboles.
 * Ejecutar: npm test
 */
import { fisherUpperP, studentTTwoSidedP } from '../src/core/distributions';
import { entropy, fitDecisionTree, gini, impurityOf, predictOne } from '../src/core/decisionTree';
import { addColumn, addRow, removeColumn, removeRow, updateCell } from '../src/core/table';
import { applyLogistic, fitLogistic, metricsAtThreshold, sigmoid } from '../src/core/logistic';
import { leastSquares } from '../src/core/linalg';
import { fitMultiple } from '../src/core/multipleLinear';
import { exercises } from '../src/content/exercises';
import { fitSimpleLinear, seriesForChart } from '../src/core/simpleLinear';

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(ok ? 'OK  ' : 'FAIL', msg);
  if (!ok) failed += 1;
};
const near = (a: number, b: number, tol = 1e-4) => Math.abs(a - b) <= tol;

// ── Distribuciones: t crítico aproximado y F del documento ──────────────────
const pT = studentTTwoSidedP(3.182, 3);
check(pT !== null && near(pT, 0.05, 0.004), `t(3.182, gl=3) ≈ 0.05 (p=${pT})`);
const pF = fisherUpperP(19, 2, 2);
check(pF !== null && near(pF, 0.05, 0.006), `F(19; 2, 2) ≈ 0.05 (p=${pF})`);

// ── Regresión simple: ejercicios 2.1, 2.2 y 2.3 ─────────────────────────────
const e21 = fitSimpleLinear([1, 2, 3, 4, 5], [2, 3, 5, 4, 6], 6);
check(e21.ok && near(e21.fit.slope, 0.9) && near(e21.fit.intercept, 1.3), '2.1 pendiente 0.9 e intercepto 1.3');
check(e21.ok && near(e21.fit.sse, 1.9) && near(e21.fit.ssr, 8.1) && near(e21.fit.sst, 10), '2.1 SSE, SSR y SST');
check(e21.ok && e21.fit.r2 !== null && near(e21.fit.r2, 0.81) && e21.fit.correlation !== null && near(e21.fit.correlation, 0.9), '2.1 R² y r');
check(e21.ok && e21.fit.prediction !== null && near(e21.fit.prediction.yHat, 6.7), '2.1 predicción en x=6');
check(e21.ok && e21.fit.points[2].residual !== undefined && near(e21.fit.points[2].yHat, 4), '2.1 ajustado del tercer punto');
check(e21.ok && e21.fit.tSlope !== null && e21.fit.tSlope > 3.18 && e21.fit.pSlope !== null && e21.fit.pSlope < 0.05, '2.1 la pendiente es significativa al 5%');
check(e21.ok && e21.fit.steps.some(step => step.body.includes('0.9') || step.body.includes('0.900')), '2.1 los pasos usan los datos calculados');

const e22 = fitSimpleLinear([2, 4, 6, 8, 10], [50, 60, 70, 85, 95], 7);
check(e22.ok && near(e22.fit.slope, 5.75) && near(e22.fit.intercept, 37.5), '2.2 recta 37.5 + 5.75x');
check(e22.ok && e22.fit.r2 !== null && near(e22.fit.r2, 0.99436, 1e-4), '2.2 R²');
check(e22.ok && e22.fit.prediction !== null && near(e22.fit.prediction.yHat, 77.75), '2.2 predicción con 7 horas');
if (e22.ok) {
  const hours = (90 - e22.fit.intercept) / e22.fit.slope;
  check(near(hours, 9.1304, 1e-3), '2.2 horas para 90 unidades');
}

const e23 = fitSimpleLinear([1, 2, 3, 4, 5], [10, 8, 7, 4, 1], 3.5);
check(e23.ok && near(e23.fit.slope, -2.2) && near(e23.fit.intercept, 12.6), '2.3 pendiente negativa');
check(e23.ok && e23.fit.r2 !== null && near(e23.fit.r2, 0.968, 1e-3), '2.3 R²');
check(e23.ok && e23.fit.correlation !== null && near(e23.fit.correlation, -0.98387, 1e-3), '2.3 correlación negativa');
check(e23.ok && e23.fit.prediction !== null && near(e23.fit.prediction.yHat, 4.9), '2.3 demanda en precio 3.5');
const absurd = fitSimpleLinear([1, 2, 3, 4, 5], [10, 8, 7, 4, 1], 6);
check(absurd.ok && absurd.fit.prediction !== null && absurd.fit.prediction.yHat < 0 && absurd.fit.prediction.extrapolation, '2.3 extrapolación a precio 6');

check(!fitSimpleLinear([2, 2, 2], [1, 2, 3]).ok, 'X constante se rechaza');
check(!fitSimpleLinear([1], [2]).ok, 'un solo dato se rechaza');
check(!fitSimpleLinear([1, 2], [1, Number.NaN]).ok, 'NaN se rechaza');

const chartAfit = fitSimpleLinear([1, 2, 3], [1, 2, 4]);
const chartBfit = fitSimpleLinear([1, 2, 3, 8], [1, 2, 4, 9]);
check(
  chartAfit.ok && chartBfit.ok && seriesForChart(chartAfit.fit).points.length === 3 && seriesForChart(chartBfit.fit).points.length === 4,
  'la serie de la gráfica cambia con los datos',
);

// ── Regresión múltiple: ejercicios 3.1, 3.2 y 3.3 ───────────────────────────
const e31 = fitMultiple(
  [[1, 2], [2, 1], [3, 4], [4, 3], [5, 5]],
  [3, 4, 8, 9, 11],
  ['x1', 'x2'],
  [6, 4],
);
check(e31.ok && near(e31.fit.intercept, 1 / 3, 1e-6), '3.1 intercepto 1/3');
check(e31.ok && near(e31.fit.coefficients[1].value, 29 / 18, 1e-6), '3.1 b1 = 29/18');
check(e31.ok && near(e31.fit.coefficients[2].value, 11 / 18, 1e-6), '3.1 b2 = 11/18');
check(e31.ok && near(e31.fit.sse, 0.555555, 1e-3) && e31.fit.r2 !== null && near(e31.fit.r2, 0.98792, 1e-4), '3.1 SSE y R²');
check(e31.ok && e31.fit.r2Adj !== null && near(e31.fit.r2Adj, 0.97585, 1e-3), '3.1 R² ajustado');
check(e31.ok && e31.fit.prediction !== null && near(e31.fit.prediction.yHat, 12.4444, 1e-3), '3.1 predicción (6, 4)');
check(e31.ok && e31.fit.coefficients[1].vif !== null && near(e31.fit.coefficients[1].vif, 2.7778, 1e-2), '3.1 VIF ≈ 2.78');
check(e31.ok && e31.fit.rows.every((row, i) => near(row.yHat + row.residual, [3, 4, 8, 9, 11][i], 1e-8)), '3.1 y = ŷ + e');

const e32 = fitMultiple(
  [[1, 0], [2, 1], [3, 0], [4, 1], [5, 1]],
  [20, 35, 30, 45, 55],
  ['experiencia', 'profesional'],
  [6, 1],
);
check(e32.ok && near(e32.fit.intercept, 13) && near(e32.fit.coefficients[1].value, 6) && near(e32.fit.coefficients[2].value, 10), '3.2 coeficientes 13, 6 y 10');
check(e32.ok && e32.fit.r2 !== null && near(e32.fit.r2, 720 / 730, 1e-6), '3.2 R²');
check(e32.ok && e32.fit.prediction !== null && near(e32.fit.prediction.yHat, 59), '3.2 profesional con 6 años');
const tec = fitMultiple([[1, 0], [2, 1], [3, 0], [4, 1], [5, 1]], [20, 35, 30, 45, 55], ['experiencia', 'profesional'], [6, 0]);
check(tec.ok && tec.fit.prediction !== null && near(tec.fit.prediction.yHat, 49), '3.2 técnico con 6 años');

const e33 = fitMultiple(
  [[1, 2], [2, 4], [3, 3], [3, 5], [4, 4], [5, 6]],
  [7, 11, 10, 13, 13, 18],
  ['horas', 'talleres'],
  [6, 5],
);
check(e33.ok && near(e33.fit.coefficients[1].value, 10 / 9, 1e-6), '3.3 b1 = 10/9');
check(e33.ok && near(e33.fit.coefficients[2].value, 29 / 18, 1e-6), '3.3 b2 = 29/18');
check(e33.ok && near(e33.fit.intercept, 20 / 9, 1e-6), '3.3 intercepto 20/9');
check(e33.ok && e33.fit.r2 !== null && near(e33.fit.r2, 0.98448, 1e-4), '3.3 R²');
check(e33.ok && e33.fit.prediction !== null && near(e33.fit.prediction.yHat, 16.9444, 1e-3), '3.3 predicción');

const singular = fitMultiple([[1, 2], [2, 4], [3, 6], [4, 8]], [1, 2, 3, 4], ['a', 'b']);
check(!singular.ok, 'columnas colineales se rechazan');
const constant = fitMultiple([[1, 5], [2, 5], [3, 5], [4, 5]], [1, 2, 3, 4], ['a', 'b']);
check(!constant.ok, 'columna constante se rechaza');
const qr = leastSquares([[1, 1], [1, 2], [1, 3]], [1, 2, 3]);
check(qr.ok && near(qr.beta[0], 0, 1e-8) && near(qr.beta[1], 1, 1e-8), 'QR recupera la recta y = x');

// ── Logística ────────────────────────────────────────────────────────────────
check(near(sigmoid(0), 0.5) && sigmoid(2) > 0.8 && sigmoid(-2) < 0.2, 'sigmoide');
const given = applyLogistic([-4, 0.8], [[3], [5], [7]], [0, 1, 1]);
check(near(given.probabilities[0], 0.1680, 1e-3), '4.1 p(x=3)');
check(near(given.probabilities[1], 0.5, 1e-8), '4.1 p(x=5)');
check(near(given.probabilities[2], 0.8320, 1e-3), '4.1 p(x=7)');
check(given.logLik !== null && near(given.logLik, -1.0609, 1e-3), '4.1 log-verosimilitud');
const cls41 = metricsAtThreshold([0, 1, 1], given.probabilities, 0.5);
check(!('ok' in cls41) && cls41.classes.join(',') === '0,1,1', '4.1 clasificación con umbral 0.5');

const e42 = fitLogistic([[1], [2], [3], [4], [5], [6]], [0, 0, 1, 0, 1, 1], ['sesiones']);
check(e42.ok && e42.fit.iterations[0]?.delta !== null && near(e42.fit.iterations[0].delta![0], -2.8, 1e-6) && near(e42.fit.iterations[0].delta![1], 0.8, 1e-6), '4.2 primer paso de Newton (−2.8, 0.8)');
check(e42.ok && near(e42.fit.intercept, -4.2491, 1e-3) && near(e42.fit.coefficients[0], 1.2140, 1e-3), '4.2 coeficientes finales');
if (e42.ok) {
  const m = metricsAtThreshold([0, 0, 1, 0, 1, 1], e42.fit.probabilities, 0.5);
  check(!('ok' in m) && m.confusion.accuracy !== null && near(m.confusion.accuracy, 2 / 3, 1e-6), '4.2 exactitud 2/3');
  check(!('ok' in m) && m.confusion.vp === 2 && m.confusion.fn === 1 && m.confusion.fp === 1 && m.confusion.vn === 2, '4.2 matriz de confusión');
  check(e42.fit.mcfadden !== null && near(e42.fit.mcfadden, 0.4042, 1e-3), '4.2 pseudo-R² de McFadden');
}
check(!fitLogistic([[1], [2], [3]], [1, 1, 1], ['x']).ok, 'una sola clase se rechaza');
check(!metricsAtThreshold([0, 1], [0.2, 0.8], 1.2).ok, 'umbral fuera de (0, 1) se rechaza');

const x43 = [[2, 1], [3, 3], [4, 2], [5, 4], [6, 3], [7, 6], [3, 6], [8, 2]];
const y43 = [0, 0, 0, 1, 1, 1, 1, 0];
const given43 = applyLogistic([-7, 0.8, 0.6], x43, y43);
check(near(given43.probabilities[5], 0.9002, 1e-3), '4.3 probabilidad del estudiante 6');
check(given43.logLoss !== null && near(given43.logLoss, 0.5682, 1e-3), '4.3 entropía cruzada media');
const m05 = metricsAtThreshold(y43, given43.probabilities, 0.5);
const m03 = metricsAtThreshold(y43, given43.probabilities, 0.3);
check(!('ok' in m05) && m05.confusion.accuracy === 0.5 && m05.confusion.recall === 0.25, '4.3 métricas con umbral 0.5');
check(!('ok' in m03) && m03.confusion.accuracy === 0.75 && m03.confusion.recall === 0.75, '4.3 métricas con umbral 0.3');
const pred43 = applyLogistic([-7, 0.8, 0.6], [[6, 4]], null);
check(near(pred43.probabilities[0], 0.5498, 1e-3), '4.3 predicción (6, 4)');

// ── Árboles ──────────────────────────────────────────────────────────────────
check(near(entropy({ Sí: 5, No: 5 }, 10), 1), '5.1 entropía de la raíz');
check(near(gini({ Sí: 3, No: 5 }, 8), 0.46875), '5.2 Gini de la raíz');
check(impurityOf(['a', 'a'], 'gini') === 0 && impurityOf(['a', 'b'], 'entropy') === 1, 'impureza de nodo puro y de empate');

const rows51 = [
  ['Joven', 'Alto', 'No'],
  ['Joven', 'Alto', 'Sí'],
  ['Adulto', 'Bajo', 'No'],
  ['Adulto', 'Bajo', 'No'],
  ['Adulto', 'Bajo', 'Sí'],
  ['Joven', 'Bajo', 'Sí'],
  ['Joven', 'Bajo', 'No'],
  ['Adulto', 'Alto', 'Sí'],
  ['Joven', 'Alto', 'No'],
  ['Adulto', 'Bajo', 'Sí'],
];
const y51 = ['No', 'No', 'Sí', 'Sí', 'Sí', 'Sí', 'No', 'No', 'No', 'Sí'];
const t51 = fitDecisionTree(rows51, y51, ['Edad', 'Ingreso', 'Estudiante'], ['categorical', 'categorical', 'categorical'], {
  criterion: 'entropy', maxDepth: 6, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
});
check(t51.ok && t51.fit.tree.feature === 'Ingreso', '5.1 la raíz es Ingreso');
check(t51.ok && t51.fit.accuracy === 1, '5.1 exactitud de entrenamiento 100%');
if (t51.ok) {
  const a = predictOne(t51.fit.tree, ['Joven', 'Bajo', 'Sí'], ['Edad', 'Ingreso', 'Estudiante']);
  const b = predictOne(t51.fit.tree, ['Adulto', 'Alto', 'Sí'], ['Edad', 'Ingreso', 'Estudiante']);
  check(a.label === 'Sí' && a.path.length >= 2, '5.1 joven de ingreso bajo estudiante compra');
  check(b.label === 'No', '5.1 adulto de ingreso alto no compra');
  const ingreso = t51.fit.trace[0].candidates.find(c => c.feature === 'Ingreso');
  check(ingreso !== undefined && near(ingreso.gain, 0.60999, 1e-3), '5.1 ganancia de Ingreso');
}

const rows52 = [
  ['1.2', 'Arriendo'],
  ['1.5', 'Propia'],
  ['1.8', 'Arriendo'],
  ['2.4', 'Arriendo'],
  ['3.0', 'Propia'],
  ['3.5', 'Arriendo'],
  ['4.2', 'Propia'],
  ['5.0', 'Propia'],
];
const y52 = ['Sí', 'Sí', 'No', 'Sí', 'No', 'No', 'No', 'No'];
const t52 = fitDecisionTree(rows52, y52, ['Ingreso', 'Vivienda'], ['numeric', 'categorical'], {
  criterion: 'gini', maxDepth: 6, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
});
check(t52.ok && t52.fit.tree.branches.some(b => b.kind === 'le' && b.threshold !== undefined && near(b.threshold, 2.7, 1e-8)), '5.2 raíz Ingreso ≤ 2.7');
if (t52.ok) {
  check(predictOne(t52.fit.tree, ['2.0', 'Arriendo'], ['Ingreso', 'Vivienda']).label === 'No', '5.2 ingreso 2.0 → No mora');
  check(predictOne(t52.fit.tree, ['2.2', 'Arriendo'], ['Ingreso', 'Vivienda']).label === 'Sí', '5.2 ingreso 2.2 → Mora');
  check(predictOne(t52.fit.tree, ['3.2', 'Propia'], ['Ingreso', 'Vivienda']).label === 'No', '5.2 ingreso 3.2 → No mora');
  check(t52.fit.accuracy === 1, '5.2 árbol completo acierta el entrenamiento');
}
const pruned = fitDecisionTree(rows52, y52, ['Ingreso', 'Vivienda'], ['numeric', 'categorical'], {
  criterion: 'gini', maxDepth: 1, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
});
check(pruned.ok && pruned.fit.accuracy !== null && near(pruned.fit.accuracy, 0.875), '5.2 poda a profundidad 1 acierta 7/8');
check(!fitDecisionTree([['a'], ['a']], ['Sí', 'Sí'], ['x'], ['categorical'], {
  criterion: 'gini', maxDepth: 3, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
}).ok, 'una sola clase no entrena el árbol');

const rows53 = [
  ['Mensual', 'Bajo', 'Bajo'],
  ['Mensual', 'Bajo', 'Alto'],
  ['Mensual', 'Bajo', 'Bajo'],
  ['Mensual', 'Alto', 'Alto'],
  ['Mensual', 'Bajo', 'Bajo'],
  ['Anual', 'Bajo', 'Bajo'],
  ['Anual', 'Alto', 'Alto'],
  ['Anual', 'Bajo', 'Alto'],
  ['Anual', 'Alto', 'Alto'],
  ['Bienal', 'Alto', 'Alto'],
  ['Bienal', 'Bajo', 'Bajo'],
  ['Bienal', 'Alto', 'Bajo'],
];
const y53 = ['Sí', 'Sí', 'Sí', 'No', 'Sí', 'Sí', 'No', 'No', 'No', 'No', 'No', 'No'];
const t53 = fitDecisionTree(rows53, y53, ['Contrato', 'Soporte', 'Uso'], ['categorical', 'categorical', 'categorical'], {
  criterion: 'entropy', maxDepth: 6, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
});
check(t53.ok && t53.fit.tree.feature === 'Soporte', '5.3 la raíz es Soporte');
check(t53.ok && t53.fit.accuracy === 1, '5.3 exactitud 100%');
if (t53.ok) {
  const names = ['Contrato', 'Soporte', 'Uso'];
  check(predictOne(t53.fit.tree, ['Mensual', 'Bajo', 'Alto'], names).label === 'Sí', '5.3 caso mensual/bajo/alto');
  check(predictOne(t53.fit.tree, ['Mensual', 'Alto', 'Bajo'], names).label === 'No', '5.3 caso mensual/alto/bajo');
  check(predictOne(t53.fit.tree, ['Anual', 'Bajo', 'Alto'], names).label === 'No', '5.3 caso anual/bajo/alto');
  check(predictOne(t53.fit.tree, ['Bienal', 'Bajo', 'Bajo'], names).label === 'No', '5.3 caso bienal/bajo/bajo');
  const soporte = t53.fit.trace[0].candidates.find(c => c.feature === 'Soporte');
  check(soporte !== undefined && near(soporte.gain, 0.47638, 1e-3), '5.3 ganancia de Soporte');
}

// ── Tabla editable ───────────────────────────────────────────────────────────
let rows = [['1', '2'], ['3', '4']];
rows = addRow(rows, 2);
check(rows.length === 3 && rows[2].every(cell => cell === ''), 'agregar fila');
rows = updateCell(rows, 2, 0, '9');
check(rows[2][0] === '9' && rows[0][0] === '1', 'editar celda');
rows = removeRow(rows, 0);
check(rows.length === 2 && rows[0][0] === '3', 'eliminar fila');
rows = addColumn(rows, 1);
check(rows[0].length === 3 && rows[0][1] === '', 'agregar columna');
rows = removeColumn(rows, 1);
check(rows[0].length === 2, 'eliminar columna');
check(removeRow([['1']], 0).length === 1, 'no se elimina la última fila');
check(exercises.length === 12, 'hay doce ejercicios');
check(['simple', 'multiple', 'logistic', 'tree'].every(topic => exercises.filter(item => item.topic === topic).length === 3), 'tres ejercicios por tema');

if (failed) {
  console.error(`\n${failed} comprobaciones fallaron.`);
  process.exit(1);
}
console.log('\nTodas las comprobaciones pasaron.');
