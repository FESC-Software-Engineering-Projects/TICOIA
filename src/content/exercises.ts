import type { Kind, TreeOptions } from '../core/decisionTree';

export type Topic = 'simple' | 'multiple' | 'logistic' | 'tree';

export interface ExerciseQuestion {
  id: string;
  prompt: string;
  hints: string[];
  expected: number | string;
  tolerance?: number;
  solution: string;
}

export interface Exercise {
  id: string;
  topic: Topic;
  code: string;
  title: string;
  statement: string;
  asks: string[];
  formulas: string[];
  steps: { title: string; body: string }[];
  result: string;
  interpretation: string;
  questions: ExerciseQuestion[];
  preset: SimplePreset | MultiplePreset | LogisticPreset | TreePreset;
  /** El enunciado entrega coeficientes ya escritos, distintos de un entrenamiento nuevo. */
  givenModelNote?: string;
}

export interface SimplePreset { topic: 'simple'; rows: string[][]; predict: string }
export interface MultiplePreset { topic: 'multiple'; names: string[]; rows: string[][]; predict: string[] }
export interface LogisticPreset {
  topic: 'logistic';
  names: string[];
  rows: string[][];
  positive: string;
  negative: string;
  threshold: string;
}
export interface TreePreset {
  topic: 'tree';
  names: string[];
  kinds: Kind[];
  rows: string[][];
  options: TreeOptions;
}

const treeOpts = (criterion: TreeOptions['criterion']): TreeOptions => ({
  criterion, maxDepth: 6, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null,
});

export const exercises: Exercise[] = [
  {
    id: 'e21',
    topic: 'simple',
    code: '2.1',
    title: 'Horas de estudio y calificación',
    statement: 'Cinco estudiantes reportan las horas de estudio semanal (x) y su calificación en un parcial (y, escala 0–10): (1, 2), (2, 3), (3, 5), (4, 4) y (5, 6).',
    asks: [
      'Ajustar la recta de mínimos cuadrados.',
      'Calcular SSE, SSR, SST, R² y la correlación.',
      'Predecir la nota de quien estudia 6 horas.',
    ],
    formulas: ['b_1 = S_{xy}/S_{xx}', 'b_0 = \\bar y - b_1\\bar x', 'R^2 = SSR/SST'],
    steps: [
      { title: 'Sumas', body: 'n = 5, Σx = 15, Σy = 20, Σxy = 69, Σx² = 55, Σy² = 90. Entonces x̄ = 3 y ȳ = 4.' },
      { title: 'Sumas centradas', body: 'Sxx = 55 − 225/5 = 10. Sxy = 69 − 300/5 = 9. Syy = 90 − 400/5 = 10.' },
      { title: 'Coeficientes', body: 'b1 = 9/10 = 0.9. b0 = 4 − 0.9·3 = 1.3. La recta es ŷ = 1.3 + 0.9x.' },
      { title: 'Ajuste', body: 'SST = 10, SSR = 0.9·9 = 8.1, SSE = 1.9. R² = 0.81 y r = 0.9.' },
      { title: 'Predicción', body: 'En x = 6, ŷ = 1.3 + 0.9·6 = 6.7. Está apenas fuera del rango [1, 5].' },
    ],
    result: 'ŷ = 1.3 + 0.9x. R² = 0.81. Predicción en 6 horas: 6.7.',
    interpretation: 'Cada hora adicional de estudio se asocia con 0.9 puntos más en la nota esperada. El modelo deja sin explicar el 19 % de la variabilidad de las notas. El intercepto 1.3 no debe leerse como una nota real con cero horas, porque ese valor no está en los datos.',
    questions: [
      { id: 'b1', prompt: 'Pendiente b1', hints: ['b1 = Sxy / Sxx.', 'Sxx = 10 y Sxy = 9.'], expected: 0.9, solution: 'b1 = 9/10 = 0.9.' },
      { id: 'b0', prompt: 'Intercepto b0', hints: ['b0 = ȳ − b1 x̄.', 'ȳ = 4, x̄ = 3 y b1 = 0.9.'], expected: 1.3, solution: 'b0 = 4 − 2.7 = 1.3.' },
      { id: 'r2', prompt: 'R²', hints: ['R² = SSR / SST.', 'SSR = 8.1 y SST = 10.'], expected: 0.81, solution: 'R² = 8.1/10 = 0.81.' },
      { id: 'pred', prompt: 'Nota predicha con 6 horas', hints: ['ŷ = b0 + b1 x.', 'Usa 1.3 + 0.9·6.'], expected: 6.7, solution: 'ŷ(6) = 6.7.' },
    ],
    preset: { topic: 'simple', rows: [['1', '2'], ['2', '3'], ['3', '5'], ['4', '4'], ['5', '6']], predict: '6' },
  },
  {
    id: 'e22',
    topic: 'simple',
    code: '2.2',
    title: 'Capacitación y productividad',
    statement: 'Una empresa registra las horas de capacitación mensual (x) de cinco operarios y su productividad (y, unidades por turno): (2, 50), (4, 60), (6, 70), (8, 85) y (10, 95).',
    asks: [
      'Hallar la recta de regresión.',
      'Calcular R².',
      'Predecir la productividad con 7 horas y las horas necesarias para alcanzar 90 unidades.',
    ],
    formulas: ['b_1 = S_{xy}/S_{xx}', 'x = (y - b_0)/b_1'],
    steps: [
      { title: 'Sumas', body: 'Σx = 30, Σy = 360, Σxy = 2390, Σx² = 220, Σy² = 27250. x̄ = 6, ȳ = 72.' },
      { title: 'Sumas centradas', body: 'Sxx = 40, Sxy = 230, Syy = 1330.' },
      { title: 'Recta', body: 'b1 = 230/40 = 5.75. b0 = 72 − 5.75·6 = 37.5. ŷ = 37.5 + 5.75x.' },
      { title: 'Ajuste', body: 'SSR = 1322.5, SSE = 7.5, SST = 1330, R² = 0.99436.' },
      { title: 'Predicciones', body: 'Con 7 horas, ŷ = 77.75. Para ŷ = 90 se despeja x = 52.5/5.75 = 9.1304 horas.' },
    ],
    result: 'ŷ = 37.5 + 5.75x. R² ≈ 0.9944. Con 7 horas se predicen 77.75 unidades. Para 90 unidades hacen falta unas 9.13 horas.',
    interpretation: 'Cada hora extra de capacitación se asocia con 5.75 unidades más por turno. El ajuste es muy alto en estos cinco operarios; con tan pocos datos no conviene tratar el 99 % como una ley general de la planta.',
    questions: [
      { id: 'b1', prompt: 'Pendiente', hints: ['Sxy = 230 y Sxx = 40.'], expected: 5.75, solution: 'b1 = 5.75.' },
      { id: 'b0', prompt: 'Intercepto', hints: ['ȳ = 72 y b1 x̄ = 34.5.'], expected: 37.5, solution: 'b0 = 37.5.' },
      { id: 'r2', prompt: 'R²', hints: ['SSR = 1322.5 y SST = 1330.'], expected: 0.9944, tolerance: 0.001, solution: 'R² = 1322.5/1330 ≈ 0.99436.' },
      { id: 'pred', prompt: 'Productividad predicha con 7 horas', hints: ['ŷ = 37.5 + 5.75·7.'], expected: 77.75, solution: 'ŷ(7) = 77.75.' },
    ],
    preset: { topic: 'simple', rows: [['2', '50'], ['4', '60'], ['6', '70'], ['8', '85'], ['10', '95']], predict: '7' },
  },
  {
    id: 'e23',
    topic: 'simple',
    code: '2.3',
    title: 'Precio y demanda (pendiente negativa)',
    statement: 'Una tienda varía el precio de un producto (x, en miles de pesos) y registra las unidades vendidas por semana (y, en decenas): (1, 10), (2, 8), (3, 7), (4, 4) y (5, 1).',
    asks: [
      'Ajustar la recta.',
      'Calcular R² y la correlación.',
      'Predecir la demanda con precio 3.5 y comentar el precio 6.',
    ],
    formulas: ['b_1 = S_{xy}/S_{xx}', 'r = S_{xy}/\\sqrt{S_{xx}S_{yy}}'],
    steps: [
      { title: 'Sumas', body: 'Σx = 15, Σy = 30, Σxy = 68, Σx² = 55, Σy² = 230. x̄ = 3, ȳ = 6.' },
      { title: 'Sumas centradas', body: 'Sxx = 10, Sxy = −22, Syy = 50.' },
      { title: 'Recta', body: 'b1 = −2.2 y b0 = 12.6. ŷ = 12.6 − 2.2x.' },
      { title: 'Ajuste', body: 'SSR = 48.4, SSE = 1.6, R² = 0.968, r ≈ −0.9839.' },
      { title: 'Predicciones', body: 'En 3.5, ŷ = 4.9 decenas. En 6, ŷ = −0.6: la demanda no puede ser negativa. La recta cruza cero cerca de x = 5.73.' },
    ],
    result: 'ŷ = 12.6 − 2.2x. R² = 0.968. Con precio 3.5 se predicen 4.9 decenas. Con precio 6 el modelo da −0.6, una extrapolación inválida.',
    interpretation: 'Por cada mil pesos que sube el precio, la demanda esperada baja 2.2 decenas. El signo negativo de r coincide con el de la pendiente. El resultado negativo en x = 6 no es una demanda: es el aviso de que la recta salió del rango donde tiene sentido.',
    questions: [
      { id: 'b1', prompt: 'Pendiente', hints: ['Sxy es negativa: −22. Sxx = 10.'], expected: -2.2, solution: 'b1 = −2.2.' },
      { id: 'b0', prompt: 'Intercepto', hints: ['b0 = 6 − (−2.2)·3.'], expected: 12.6, solution: 'b0 = 12.6.' },
      { id: 'r', prompt: 'Correlación r', hints: ['r = Sxy / √(Sxx Syy) y conserva el signo de Sxy.'], expected: -0.9839, tolerance: 0.002, solution: 'r ≈ −0.98387.' },
      { id: 'pred', prompt: 'Demanda predicha con precio 3.5', hints: ['ŷ = 12.6 − 2.2·3.5.'], expected: 4.9, solution: 'ŷ(3.5) = 4.9 decenas.' },
    ],
    preset: { topic: 'simple', rows: [['1', '10'], ['2', '8'], ['3', '7'], ['4', '4'], ['5', '1']], predict: '3.5' },
  },
  {
    id: 'e31',
    topic: 'multiple',
    code: '3.1',
    title: 'Ventas, publicidad y vendedores',
    statement: 'En cinco regiones se registran las ventas y (millones), la publicidad digital x1 (millones) y el número de vendedores x2: (1, 2, 3), (2, 1, 4), (3, 4, 8), (4, 3, 9) y (5, 5, 11).',
    asks: [
      'Estimar intercepto y coeficientes.',
      'Calcular R² y R² ajustado.',
      'Predecir las ventas con x1 = 6 y x2 = 4.',
    ],
    formulas: ['\\hat\\beta \\text{ por mínimos cuadrados}', 'R^2_{aj} = 1 - \\frac{SSE/(n-p-1)}{SST/(n-1)}'],
    steps: [
      { title: 'Sistema centrado', body: 'S11 = S22 = 10, S12 = 8, S1y = 21, S2y = 19 y Syy = 46.' },
      { title: 'Coeficientes', body: 'b1 = 29/18 ≈ 1.6111, b2 = 11/18 ≈ 0.6111 y b0 = 1/3 ≈ 0.3333.' },
      { title: 'Ajuste', body: 'SSR = 45.4444, SSE = 0.5556, R² ≈ 0.9879 y R² ajustado ≈ 0.9758.' },
      { title: 'Predicción', body: 'ŷ(6, 4) = 0.3333 + 1.6111·6 + 0.6111·4 = 12.4444.' },
      { title: 'Colinealidad', body: 'r12 = 0.8 y VIF ≈ 2.78. Es moderado: no impide el cálculo, pero los coeficientes comparten información.' },
    ],
    result: 'ŷ = 0.3333 + 1.6111 x1 + 0.6111 x2. R² ≈ 0.9879. Predicción: 12.4444 millones.',
    interpretation: 'Con los vendedores fijos, un millón más en publicidad se asocia con unos 1.61 millones más de ventas. Un vendedor adicional, con la publicidad fija, se asocia con unos 0.61 millones. Con solo cinco regiones, un coeficiente puede no distinguirse del cero aunque el signo sea el esperado.',
    questions: [
      { id: 'b0', prompt: 'Intercepto', hints: ['b0 = ȳ − b1 x̄1 − b2 x̄2.', 'El valor exacto del documento es 1/3.'], expected: 0.3333, tolerance: 0.01, solution: 'b0 = 1/3 ≈ 0.3333.' },
      { id: 'b1', prompt: 'Coeficiente de la publicidad', hints: ['Resuelve el sistema 10 b1 + 8 b2 = 21 y 8 b1 + 10 b2 = 19.'], expected: 1.6111, tolerance: 0.01, solution: 'b1 = 29/18 ≈ 1.6111.' },
      { id: 'b2', prompt: 'Coeficiente de vendedores', hints: ['b2 = 11/18.'], expected: 0.6111, tolerance: 0.01, solution: 'b2 ≈ 0.6111.' },
      { id: 'pred', prompt: 'Ventas predichas con publicidad 6 y 4 vendedores', hints: ['Suma intercepto + b1·6 + b2·4.'], expected: 12.4444, tolerance: 0.02, solution: 'ŷ = 12.4444.' },
    ],
    preset: {
      topic: 'multiple',
      names: ['Publicidad', 'Vendedores'],
      rows: [['1', '2', '3'], ['2', '1', '4'], ['3', '4', '8'], ['4', '3', '9'], ['5', '5', '11']],
      predict: ['6', '4'],
    },
  },
  {
    id: 'e32',
    topic: 'multiple',
    code: '3.2',
    title: 'Salario, experiencia y formación',
    statement: 'De cinco empleados se conoce el salario mensual y (en cientos de miles de pesos), los años de experiencia x1 y si es profesional (x2 = 1) o técnico (x2 = 0): (1, 0, 20), (2, 1, 35), (3, 0, 30), (4, 1, 45) y (5, 1, 55).',
    asks: [
      'Ajustar el modelo.',
      'Interpretar los coeficientes.',
      'Predecir el salario de un profesional y de un técnico, ambos con 6 años.',
    ],
    formulas: ['y = X\\beta + \\varepsilon', 'b_0 = \\bar y - b_1\\bar x_1 - b_2\\bar x_2'],
    steps: [
      { title: 'Ecuaciones normales', body: '5b0 + 15b1 + 3b2 = 185; 15b0 + 55b1 + 11b2 = 635; 3b0 + 11b1 + 3b2 = 135.' },
      { title: 'Solución', body: 'b1 = 6, b2 = 10 y b0 = 13. ŷ = 13 + 6 x1 + 10 x2.' },
      { title: 'Ajuste', body: 'SST = 730, SSR = 720, SSE = 10, R² ≈ 0.9863 y R² ajustado ≈ 0.9726.' },
      { title: 'Predicciones', body: 'Profesional con 6 años: 13 + 36 + 10 = 59. Técnico con 6 años: 13 + 36 = 49.' },
    ],
    result: 'ŷ = 13 + 6 x1 + 10 x2. Profesional con 6 años: 59. Técnico con 6 años: 49.',
    interpretation: 'Cada año de experiencia se asocia con 6 cientos de miles de pesos más, a igual formación. Ser profesional, a igual experiencia, se asocia con 10 cientos de miles más. x2 es una variable ficticia: solo compara las dos categorías que aparecen en los datos.',
    questions: [
      { id: 'b0', prompt: 'Intercepto', hints: ['Después de eliminar, b0 = 37 − 3·6 − 0.6·10.'], expected: 13, solution: 'b0 = 13.' },
      { id: 'b1', prompt: 'Coeficiente de experiencia', hints: ['La segunda ecuación centrada da b1 = 8 − 0.2 b2.'], expected: 6, solution: 'b1 = 6.' },
      { id: 'b2', prompt: 'Coeficiente de ser profesional', hints: ['b2 sale de 0.8 b2 = 8.'], expected: 10, solution: 'b2 = 10.' },
      { id: 'pred', prompt: 'Salario predicho de un profesional con 6 años', hints: ['ŷ = 13 + 6·6 + 10·1.'], expected: 59, solution: 'ŷ = 59 cientos de miles de pesos.' },
    ],
    preset: {
      topic: 'multiple',
      names: ['Experiencia', 'Profesional'],
      rows: [['1', '0', '20'], ['2', '1', '35'], ['3', '0', '30'], ['4', '1', '45'], ['5', '1', '55']],
      predict: ['6', '1'],
    },
  },
  {
    id: 'e33',
    topic: 'multiple',
    code: '3.3',
    title: 'Calificación final con seis observaciones',
    statement: 'Seis estudiantes tienen horas de estudio x1, talleres entregados x2 y calificación final y (0–20): (1, 2, 7), (2, 4, 11), (3, 3, 10), (3, 5, 13), (4, 4, 13) y (5, 6, 18).',
    asks: [
      'Estimar los coeficientes.',
      'Calcular R².',
      'Predecir la nota de quien estudia 6 horas y entrega 5 talleres.',
    ],
    formulas: ['b_1 = (S_{22}S_{1y} - S_{12}S_{2y})/D', 'D = S_{11}S_{22} - S_{12}^2'],
    steps: [
      { title: 'Sumas centradas', body: 'S11 = 10, S22 = 10, S12 = 8, S1y = 24, S2y = 25, Syy = 68. D = 36.' },
      { title: 'Cramer', body: 'b1 = 40/36 = 10/9 ≈ 1.1111. b2 = 58/36 = 29/18 ≈ 1.6111. b0 = 20/9 ≈ 2.2222.' },
      { title: 'Ajuste', body: 'SSR ≈ 66.9444, SSE ≈ 1.0556, R² ≈ 0.9845 y R² ajustado ≈ 0.9741.' },
      { title: 'Predicción', body: 'ŷ(6, 5) ≈ 16.94 sobre 20.' },
    ],
    result: 'ŷ = 2.2222 + 1.1111 x1 + 1.6111 x2. Predicción ≈ 16.94.',
    interpretation: 'Una hora más de estudio, con los talleres fijos, se asocia con cerca de 1.11 puntos. Un taller más, con las horas fijas, se asocia con cerca de 1.61 puntos. Las dos variables se mueven juntas (correlación 0.8), así que ninguno de los dos coeficientes es “la causa única” de la nota.',
    questions: [
      { id: 'b1', prompt: 'Coeficiente de las horas', hints: ['D = 36 y el numerador de b1 es 40.'], expected: 1.1111, tolerance: 0.01, solution: 'b1 = 10/9 ≈ 1.1111.' },
      { id: 'b2', prompt: 'Coeficiente de los talleres', hints: ['El numerador de b2 es 58.'], expected: 1.6111, tolerance: 0.01, solution: 'b2 = 29/18 ≈ 1.6111.' },
      { id: 'b0', prompt: 'Intercepto', hints: ['b0 = 12 − b1·3 − b2·4.'], expected: 2.2222, tolerance: 0.01, solution: 'b0 = 20/9 ≈ 2.2222.' },
      { id: 'pred', prompt: 'Nota predicha con 6 horas y 5 talleres', hints: ['Sustituye x1 = 6 y x2 = 5 en la ecuación.'], expected: 16.9444, tolerance: 0.03, solution: 'ŷ ≈ 16.94.' },
    ],
    preset: {
      topic: 'multiple',
      names: ['Horas', 'Talleres'],
      rows: [['1', '2', '7'], ['2', '4', '11'], ['3', '3', '10'], ['3', '5', '13'], ['4', '4', '13'], ['5', '6', '18']],
      predict: ['6', '5'],
    },
  },
  {
    id: 'e41',
    topic: 'logistic',
    code: '4.1',
    title: 'Probabilidades, momios y razón de momios',
    statement: 'Un modelo ya escrito estima la probabilidad de aprobar según las horas de estudio: logit(p) = −4 + 0.8x. Se observan además (x, y) = (3, 0), (5, 1) y (7, 1).',
    asks: [
      'Interpretar β1 = 0.8.',
      'Calcular p para 3, 5 y 7 horas.',
      'Clasificar con umbral 0.5 y calcular la log-verosimilitud de lo observado.',
    ],
    formulas: ['p = 1/(1+e^{-z})', 'OR = e^{\\beta_1}', '\\ell = \\sum \\ln P(y_i)'],
    steps: [
      { title: 'Razón de momios', body: 'e^0.8 ≈ 2.2255. Cada hora multiplica los momios de aprobar por 2.2255.' },
      { title: 'Probabilidades', body: 'En x = 3, z = −1.6 y p ≈ 0.1680. En x = 5, z = 0 y p = 0.5. En x = 7, z = 1.6 y p ≈ 0.8320.' },
      { title: 'Clases', body: 'Con umbral 0.5 las clases predichas son 0, 1 y 1. La frontera z = 0 está en x = 5.' },
      { title: 'Verosimilitud', body: 'L ≈ 0.8320·0.5·0.8320 ≈ 0.3461 y ℓ ≈ −1.0609. Este cálculo usa los coeficientes dados; no los estima.' },
    ],
    result: 'p(3) ≈ 0.168, p(5) = 0.5, p(7) ≈ 0.832. Clasificación 0, 1, 1. ℓ ≈ −1.061.',
    interpretation: 'Cinco horas dejan la probabilidad en el umbral. Menos de cinco horas predice no aprobar; cinco o más, aprobar. La log-verosimilitud negativa no significa un modelo inútil: es el logaritmo de un producto de probabilidades menores que 1.',
    givenModelNote: 'El documento no entrena este modelo: entrega logit(p) = −4 + 0.8x. Si cargas los tres puntos en la calculadora, el botón Calcular estimará otros coeficientes por máxima verosimilitud. Las respuestas de este ejercicio corresponden al modelo dado, no a ese reentrenamiento.',
    questions: [
      { id: 'p3', prompt: 'Probabilidad con 3 horas', hints: ['z = −4 + 0.8·3 = −1.6.', 'p = 1/(1+e^1.6).'], expected: 0.168, tolerance: 0.005, solution: 'p ≈ 0.1680.' },
      { id: 'p5', prompt: 'Probabilidad con 5 horas', hints: ['z = 0 y la sigmoide de 0 es 1/2.'], expected: 0.5, solution: 'p = 0.5.' },
      { id: 'p7', prompt: 'Probabilidad con 7 horas', hints: ['z = 1.6. Es 1 − p(3) por la simetría de la sigmoide.'], expected: 0.832, tolerance: 0.005, solution: 'p ≈ 0.8320.' },
      { id: 'or', prompt: 'Razón de momios e^0.8', hints: ['No es la probabilidad. Es el factor que multiplica los momios por cada hora.'], expected: 2.2255, tolerance: 0.02, solution: 'OR ≈ 2.2255.' },
    ],
    preset: {
      topic: 'logistic',
      names: ['Horas'],
      rows: [['3', '0'], ['5', '1'], ['7', '1']],
      positive: '1',
      negative: '0',
      threshold: '0.5',
    },
  },
  {
    id: 'e42',
    topic: 'logistic',
    code: '4.2',
    title: 'Ajuste por máxima verosimilitud (Newton-Raphson)',
    statement: 'Seis estudiantes cursaron x = 1, 2, 3, 4, 5 y 6 sesiones. Aprobaron (1) o no (0) así: 0, 0, 1, 0, 1, 1. Se ajusta logit(p) = β0 + β1 x partiendo de β = (0, 0).',
    asks: [
      'Dar el primer paso de Newton.',
      'Reportar los coeficientes convergidos.',
      'Clasificar con umbral 0.5 y armar la matriz de confusión.',
    ],
    formulas: ['\\beta^{(t+1)} = \\beta^{(t)} + (X^\\top W X)^{-1} X^\\top (y-p)', 'w_i = p_i(1-p_i)'],
    steps: [
      { title: 'Arranque', body: 'Con β = 0, todas las probabilidades valen 0.5. El gradiente es (0, 3.5) y el primer paso es (−2.8, 0.8).' },
      { title: 'Convergencia', body: 'Newton llega a β̂ ≈ (−4.2491, 1.2140). No es un ajuste de mínimos cuadrados.' },
      { title: 'Clasificación', body: 'Con umbral 0.5 las predicciones son 0, 0, 0, 1, 1, 1. Hay VP = 2, FN = 1, FP = 1 y VN = 2. Exactitud = 2/3.' },
      { title: 'Ajuste global', body: 'La log-verosimilitud nula es 6 ln 0.5 ≈ −4.1589. El pseudo-R² de McFadden queda cerca de 0.404.' },
    ],
    result: 'logit(p) ≈ −4.2491 + 1.2140 x. Exactitud con umbral 0.5: 0.6667.',
    interpretation: 'Cada sesión adicional multiplica los momios de aprobar por cerca de 3.37. La frontera de probabilidad 0.5 está alrededor de 3.50 sesiones. Con seis datos, el documento mismo señala que la prueba de la pendiente no alcanza el 5 %: el algoritmo converge, pero la evidencia es débil.',
    questions: [
      { id: 'd0', prompt: 'Primer paso de Newton para el intercepto', hints: ['En β = 0 la matriz XᵀWX es 0.25 XᵀX.', 'El paso del intercepto es −2.8.'], expected: -2.8, tolerance: 0.02, solution: 'δ0 = −2.8.' },
      { id: 'd1', prompt: 'Primer paso de Newton para la pendiente', hints: ['El gradiente de la pendiente es 3.5.'], expected: 0.8, tolerance: 0.02, solution: 'δ1 = 0.8.' },
      { id: 'b0', prompt: 'Intercepto convergido', hints: ['Sigue iterando Newton hasta que el paso sea diminuto. El documento reporta −4.2491.'], expected: -4.2491, tolerance: 0.02, solution: 'β0 ≈ −4.2491.' },
      { id: 'acc', prompt: 'Exactitud con umbral 0.5', hints: ['Cuenta aciertos sobre 6. El documento obtiene 4/6.'], expected: 0.6667, tolerance: 0.02, solution: 'Exactitud = 4/6 ≈ 0.6667.' },
    ],
    preset: {
      topic: 'logistic',
      names: ['Sesiones'],
      rows: [['1', '0'], ['2', '0'], ['3', '1'], ['4', '0'], ['5', '1'], ['6', '1']],
      positive: '1',
      negative: '0',
      threshold: '0.5',
    },
  },
  {
    id: 'e43',
    topic: 'logistic',
    code: '4.3',
    title: 'Clasificación con dos variables y umbral',
    statement: 'Un modelo ya ajustado es logit(p) = −7 + 0.8 x1 + 0.6 x2, con x1 horas de estudio y x2 talleres. Ocho estudiantes: (2, 1, 0), (3, 3, 0), (4, 2, 0), (5, 4, 1), (6, 3, 1), (7, 6, 1), (3, 6, 1) y (8, 2, 0).',
    asks: [
      'Calcular la probabilidad de cada estudiante con el modelo dado.',
      'Comparar los umbrales 0.5 y 0.3.',
      'Predecir para x1 = 6 y x2 = 4.',
    ],
    formulas: ['z = -7 + 0.8 x_1 + 0.6 x_2', 'J = -\\frac{1}{n}\\sum \\ln P(y_i)'],
    steps: [
      { title: 'Probabilidades', body: 'Con el modelo dado, las ocho probabilidades son aproximadamente 0.0082, 0.0573, 0.0691, 0.3543, 0.4013, 0.9002, 0.2689 y 0.6457.' },
      { title: 'Umbral 0.5', body: 'Solo se predicen positivos los casos 6 y 8. Exactitud 0.50, sensibilidad 0.25, especificidad 0.75.' },
      { title: 'Umbral 0.3', body: 'Entran también los casos 4 y 5. Exactitud, precisión, sensibilidad y especificidad quedan en 0.75.' },
      { title: 'Pérdida y predicción', body: 'La entropía cruzada media es aproximadamente 0.5682. Para (6, 4), p ≈ 0.5498 y con umbral 0.5 se predice aprobar.' },
    ],
    result: 'Con τ = 0.5 la exactitud es 0.50. Con τ = 0.3 sube a 0.75. p(6, 4) ≈ 0.5498.',
    interpretation: 'Bajar el umbral no entrena de nuevo el modelo: solo cambia la regla que convierte la probabilidad en clase. En estos ocho estudiantes, 0.3 detecta más aprobados reales sin sumar falsos positivos adicionales. Eso es de este conjunto, no una recomendación universal.',
    givenModelNote: 'Los coeficientes −7, 0.8 y 0.6 vienen dados en el enunciado. Cargar la tabla en la calculadora y pulsar Calcular entrena otro modelo por Newton-Raphson. Las métricas de este ejercicio usan el modelo escrito, no ese reentrenamiento.',
    questions: [
      { id: 'p6', prompt: 'Probabilidad del estudiante 6 (7 horas y 6 talleres)', hints: ['z = −7 + 0.8·7 + 0.6·6 = 2.2.', 'p = 1/(1+e^{−2.2}).'], expected: 0.9002, tolerance: 0.01, solution: 'p ≈ 0.9002.' },
      { id: 'acc05', prompt: 'Exactitud con umbral 0.5', hints: ['Con 0.5 solo dos estudiantes se predicen positivos y uno de ellos está mal.'], expected: 0.5, solution: 'Exactitud = 4/8 = 0.5.' },
      { id: 'acc03', prompt: 'Exactitud con umbral 0.3', hints: ['Ahora los estudiantes 4, 5, 6 y 8 se predicen positivos.'], expected: 0.75, solution: 'Exactitud = 6/8 = 0.75.' },
      { id: 'pred', prompt: 'Probabilidad para 6 horas y 4 talleres', hints: ['z = −7 + 4.8 + 2.4 = 0.2.'], expected: 0.5498, tolerance: 0.01, solution: 'p ≈ 0.5498.' },
    ],
    preset: {
      topic: 'logistic',
      names: ['Horas', 'Talleres'],
      rows: [['2', '1', '0'], ['3', '3', '0'], ['4', '2', '0'], ['5', '4', '1'], ['6', '3', '1'], ['7', '6', '1'], ['3', '6', '1'], ['8', '2', '0']],
      positive: '1',
      negative: '0',
      threshold: '0.5',
    },
  },
  {
    id: 'e51',
    topic: 'tree',
    code: '5.1',
    title: 'ID3 con entropía y ganancia de información',
    statement: 'Diez clientes tienen Edad (Joven o Adulto), Ingreso (Alto o Bajo), Estudiante (Sí o No) y si compraron (Sí o No). Los registros son: Joven/Alto/No/No, Joven/Alto/Sí/No, Adulto/Bajo/No/Sí, Adulto/Bajo/No/Sí, Adulto/Bajo/Sí/Sí, Joven/Bajo/Sí/Sí, Joven/Bajo/No/No, Adulto/Alto/Sí/No, Joven/Alto/No/No y Adulto/Bajo/Sí/Sí.',
    asks: [
      'Elegir la raíz por ganancia de información.',
      'Completar el árbol.',
      'Clasificar a un joven de ingreso bajo y estudiante, y a un adulto de ingreso alto y estudiante.',
    ],
    formulas: ['H = -\\sum p\\log_2 p', 'GI = H(S) - \\sum (|S_v|/|S|) H(S_v)'],
    steps: [
      { title: 'Raíz', body: 'Hay 5 Sí y 5 No, así que H = 1. La ganancia de Ingreso es aproximadamente 0.610, la de Edad 0.278 y la de Estudiante 0.029. La raíz es Ingreso.' },
      { title: 'Ramas', body: 'Ingreso Alto es puro: No compra. En Ingreso Bajo se elige Edad. Adulto compra. En Joven se usa Estudiante: Sí compra y No no compra.' },
      { title: 'Consultas', body: 'Joven, ingreso bajo y estudiante sigue hasta la hoja Compra. Adulto, ingreso alto y estudiante se detiene en Ingreso Alto: No compra.' },
      { title: 'Exactitud', body: 'Las hojas son puras, así que los 10 clientes de entrenamiento se clasifican bien. Eso no estima el desempeño con clientes nuevos.' },
    ],
    result: 'Raíz: Ingreso. Exactitud de entrenamiento: 100 %. Joven/Bajo/Sí → Compra. Adulto/Alto/Sí → No compra.',
    interpretation: 'El ingreso separa mejor la compra que la edad o el hecho de ser estudiante. Dentro del ingreso bajo todavía importa la edad, y solo entre los jóvenes de ingreso bajo la pregunta del estudiante cambia la clase.',
    questions: [
      { id: 'root', prompt: 'Atributo de la raíz', hints: ['Compara las ganancias. Ingreso reduce más la entropía que Edad y que Estudiante.'], expected: 'Ingreso', solution: 'La raíz es Ingreso.' },
      { id: 'gain', prompt: 'Ganancia de información de Ingreso', hints: ['H = 1. La entropía ponderada de Ingreso es aproximadamente 0.390.'], expected: 0.61, tolerance: 0.01, solution: 'GI(Ingreso) ≈ 0.60999.' },
      { id: 'a', prompt: 'Clase de un joven con ingreso bajo que sí es estudiante', hints: ['Ingreso Bajo → Edad Joven → Estudiante Sí.'], expected: 'Sí', solution: 'Compra (Sí).' },
      { id: 'b', prompt: 'Clase de un adulto con ingreso alto que sí es estudiante', hints: ['La primera pregunta ya deja el nodo puro.'], expected: 'No', solution: 'No compra.' },
    ],
    preset: {
      topic: 'tree',
      names: ['Edad', 'Ingreso', 'Estudiante'],
      kinds: ['categorical', 'categorical', 'categorical'],
      rows: [
        ['Joven', 'Alto', 'No', 'No'],
        ['Joven', 'Alto', 'Sí', 'No'],
        ['Adulto', 'Bajo', 'No', 'Sí'],
        ['Adulto', 'Bajo', 'No', 'Sí'],
        ['Adulto', 'Bajo', 'Sí', 'Sí'],
        ['Joven', 'Bajo', 'Sí', 'Sí'],
        ['Joven', 'Bajo', 'No', 'No'],
        ['Adulto', 'Alto', 'Sí', 'No'],
        ['Joven', 'Alto', 'No', 'No'],
        ['Adulto', 'Bajo', 'Sí', 'Sí'],
      ],
      options: treeOpts('entropy'),
    },
  },
  {
    id: 'e52',
    topic: 'tree',
    code: '5.2',
    title: 'CART con índice de Gini y atributo numérico',
    statement: 'Ocho clientes de un banco tienen ingreso mensual (millones), vivienda (Arriendo o Propia) y si cayeron en mora (Sí o No): (1.2, Arriendo, Sí), (1.5, Propia, Sí), (1.8, Arriendo, No), (2.4, Arriendo, Sí), (3.0, Propia, No), (3.5, Arriendo, No), (4.2, Propia, No) y (5.0, Propia, No).',
    asks: [
      'Calcular el Gini de la raíz y elegir la mejor división.',
      'Completar el árbol hasta hojas puras.',
      'Clasificar ingresos de 2.0, 2.2 y 3.2.',
    ],
    formulas: ['G = 1 - \\sum p_c^2', 't = (v_j + v_{j+1})/2'],
    steps: [
      { title: 'Raíz', body: 'Hay 3 Sí y 5 No. Gini = 30/64 = 0.46875. El menor Gini ponderado es 0.1875 en Ingreso ≤ 2.7. Vivienda queda peor (0.4375).' },
      { title: 'Ramas', body: 'Ingreso > 2.7 es hoja No mora. En el lado izquierdo se elige Ingreso ≤ 1.65 (Mora). Entre 1.65 y 2.7 se parte en 2.1: a la izquierda No mora y a la derecha Mora.' },
      { title: 'Consultas', body: '2.0 → No mora. 2.2 → Mora. 3.2 → No mora.' },
      { title: 'Poda', body: 'Si la profundidad máxima es 1, se conserva solo Ingreso ≤ 2.7 y se aciertan 7 de 8 clientes. El cliente 3 queda mal clasificado.' },
    ],
    result: 'Raíz: Ingreso ≤ 2.7. Clases: 2.0 No, 2.2 Sí, 3.2 No. Árbol completo: exactitud 100 % en entrenamiento. Profundidad 1: 87.5 %.',
    interpretation: 'El ingreso separa la mora mejor que el tipo de vivienda. La frontera 2.1 depende de dos clientes y es una señal de sobreajuste. Limitar la profundidad cambia la predicción de algunos casos a cambio de un árbol más estable.',
    questions: [
      { id: 'g', prompt: 'Gini de la raíz', hints: ['G = 1 − (3/8)² − (5/8)².'], expected: 0.46875, tolerance: 0.001, solution: 'G = 0.46875.' },
      { id: 't', prompt: 'Umbral de la raíz', hints: ['Prueba los puntos medios. El menor Gini ponderado está en 2.7.'], expected: 2.7, solution: 'Ingreso ≤ 2.7.' },
      { id: 'a', prompt: 'Clase para ingreso 2.0 (puedes ignorar la vivienda)', hints: ['2.0 ≤ 2.7, no ≤ 1.65, y sí ≤ 2.1.'], expected: 'No', solution: 'No mora.' },
      { id: 'b', prompt: 'Clase para ingreso 2.2', hints: ['2.2 está entre 2.1 y 2.7.'], expected: 'Sí', solution: 'Mora (Sí).' },
    ],
    preset: {
      topic: 'tree',
      names: ['Ingreso', 'Vivienda'],
      kinds: ['numeric', 'categorical'],
      rows: [
        ['1.2', 'Arriendo', 'Sí'],
        ['1.5', 'Propia', 'Sí'],
        ['1.8', 'Arriendo', 'No'],
        ['2.4', 'Arriendo', 'Sí'],
        ['3.0', 'Propia', 'No'],
        ['3.5', 'Arriendo', 'No'],
        ['4.2', 'Propia', 'No'],
        ['5.0', 'Propia', 'No'],
      ],
      options: treeOpts('gini'),
    },
  },
  {
    id: 'e53',
    topic: 'tree',
    code: '5.3',
    title: 'Atributo de tres valores: ganancia y razón de ganancia',
    statement: 'Doce clientes de una empresa de telecomunicaciones tienen Contrato (Mensual, Anual o Bienal), Soporte (Alto o Bajo), Uso (Alto o Bajo) y si abandonan (Sí o No). Hay 5 abandonos y 7 permanencias. El detalle de las doce filas está en la tabla del ejercicio.',
    asks: [
      'Comparar ganancia y razón de ganancia en la raíz.',
      'Completar el árbol con ganancia de información.',
      'Clasificar cuatro clientes nuevos.',
    ],
    formulas: ['RG = GI / SI', 'SI = -\\sum (|S_v|/|S|) \\log_2(|S_v|/|S|)'],
    steps: [
      { title: 'Raíz', body: 'H ≈ 0.9799. Soporte tiene la mayor ganancia (≈ 0.476) y también la mayor razón de ganancia (≈ 0.486). Contrato tiene tres valores y su razón de ganancia baja a ≈ 0.263 aunque su ganancia sea 0.409.' },
      { title: 'Árbol', body: 'Soporte Alto no abandona. En Soporte Bajo se elige Contrato. Mensual abandona, Bienal no. En Anual se usa Uso: Bajo abandona y Alto no.' },
      { title: 'Consultas', body: '(Mensual, Bajo, Alto) abandona. (Mensual, Alto, Bajo) no. (Anual, Bajo, Alto) no. (Bienal, Bajo, Bajo) no.' },
      { title: 'Gini', body: 'El Gini ponderado también elige Soporte en la raíz. Los dos criterios coinciden aquí, pero no usan la misma fórmula.' },
    ],
    result: 'Raíz: Soporte. Exactitud de entrenamiento: 100 %. Los cuatro casos nuevos quedan: Sí, No, No y No.',
    interpretation: 'La razón de ganancia castiga a Contrato por repartir los datos en tres grupos. En este conjunto Soporte gana con los dos criterios. Un árbol con hojas puras acierta todo el entrenamiento; para saber si predice abandonos nuevos haría falta otro conjunto de clientes.',
    questions: [
      { id: 'root', prompt: 'Atributo de la raíz por ganancia', hints: ['Soporte supera a Contrato y a Uso.'], expected: 'Soporte', solution: 'La raíz es Soporte.' },
      { id: 'gain', prompt: 'Ganancia de Soporte', hints: ['H ≈ 0.9799 y la entropía ponderada de Soporte es ≈ 0.5035.'], expected: 0.476, tolerance: 0.01, solution: 'GI ≈ 0.47638.' },
      { id: 'a', prompt: 'Clase de contrato mensual, soporte bajo y uso alto', hints: ['Soporte Bajo y luego Contrato Mensual. La hoja es pura.'], expected: 'Sí', solution: 'Abandona (Sí).' },
      { id: 'b', prompt: 'Clase de contrato anual, soporte bajo y uso alto', hints: ['Soporte Bajo → Contrato Anual → Uso Alto.'], expected: 'No', solution: 'No abandona.' },
    ],
    preset: {
      topic: 'tree',
      names: ['Contrato', 'Soporte', 'Uso'],
      kinds: ['categorical', 'categorical', 'categorical'],
      rows: [
        ['Mensual', 'Bajo', 'Bajo', 'Sí'],
        ['Mensual', 'Bajo', 'Alto', 'Sí'],
        ['Mensual', 'Bajo', 'Bajo', 'Sí'],
        ['Mensual', 'Alto', 'Alto', 'No'],
        ['Mensual', 'Bajo', 'Bajo', 'Sí'],
        ['Anual', 'Bajo', 'Bajo', 'Sí'],
        ['Anual', 'Alto', 'Alto', 'No'],
        ['Anual', 'Bajo', 'Alto', 'No'],
        ['Anual', 'Alto', 'Alto', 'No'],
        ['Bienal', 'Alto', 'Alto', 'No'],
        ['Bienal', 'Bajo', 'Bajo', 'No'],
        ['Bienal', 'Alto', 'Bajo', 'No'],
      ],
      options: treeOpts('entropy'),
    },
  },
];

export function exercisesByTopic(topic: Topic): Exercise[] {
  return exercises.filter(item => item.topic === topic);
}
