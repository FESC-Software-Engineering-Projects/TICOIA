export interface TheoryBlock {
  title: string;
  paragraphs: string[];
  latex?: string[];
}

export const simpleTheory: TheoryBlock[] = [
  {
    title: 'Qué estima',
    paragraphs: [
      'La regresión lineal simple estima una variable numérica Y a partir de una sola variable explicativa X. Sirve cuando la relación media se puede resumir con una recta: notas y horas de estudio, demanda y precio, o productividad y capacitación.',
      'X es la variable independiente. Y es la variable dependiente, la que se quiere predecir. El modelo de cada observación es yi = β0 + β1 xi + εi.',
    ],
    latex: ['y_i = \\beta_0 + \\beta_1 x_i + \\varepsilon_i'],
  },
  {
    title: 'Intercepto, pendiente y mínimos cuadrados',
    paragraphs: [
      'β0 es el intercepto: el valor esperado de Y cuando X vale 0. β1 es la pendiente: cuánto cambia el valor esperado de Y si X aumenta una unidad.',
      'Los datos no caen exactos sobre una recta. El método de mínimos cuadrados ordinarios elige b0 y b1 para que la suma de errores al cuadrado sea la menor posible. El residual de una observación es ei = yi − ŷi.',
    ],
    latex: [
      'b_1 = \\frac{S_{xy}}{S_{xx}}, \\quad b_0 = \\bar y - b_1\\bar x',
      'S_{xx} = \\sum (x_i-\\bar x)^2, \\quad S_{xy} = \\sum (x_i-\\bar x)(y_i-\\bar y)',
    ],
  },
  {
    title: 'SST, SSR, SSE, R² y correlación',
    paragraphs: [
      'SST mide la variabilidad total de Y alrededor de su media. SSR es la parte que la recta acompaña. SSE es lo que queda en los residuales. Con intercepto se cumple SST = SSR + SSE.',
      'R² = SSR/SST dice qué fracción de la variabilidad de Y queda explicada por la recta. Vale 1 si el ajuste es perfecto y 0 si la recta no mejora a la media. La correlación r tiene el signo de la pendiente y mide la asociación lineal. R² = r² en la regresión simple.',
    ],
    latex: ['SST = \\sum (y_i-\\bar y)^2,\\ SSR = \\sum (\\hat y_i-\\bar y)^2,\\ SSE = \\sum e_i^2', 'R^2 = 1 - \\frac{SSE}{SST}, \\quad r = \\frac{S_{xy}}{\\sqrt{S_{xx}S_{yy}}}'],
  },
  {
    title: 'Supuestos y límites',
    paragraphs: [
      'La lectura clásica supone que la media de Y es lineal en X, que los errores tienen varianza constante, que no están correlacionados entre sí y, para las pruebas t, que son aproximadamente normales.',
      'La recta no justifica causas: una pendiente positiva no demuestra que X produzca Y. Extrapolaciones fuera del rango observado pueden dar valores imposibles, como una demanda negativa. Un dato atípico mueve la recta porque el criterio eleva el error al cuadrado.',
    ],
  },
];

export const multipleTheory: TheoryBlock[] = [
  {
    title: 'Varias variables explicativas',
    paragraphs: [
      'La regresión lineal múltiple estima una Y numérica con varias variables x1, …, xp. Cada coeficiente βj, con j ≥ 1, es el cambio esperado en Y cuando xj aumenta una unidad y las demás variables se quedan fijas.',
    ],
    latex: ['y_i = \\beta_0 + \\beta_1 x_{i1} + \\cdots + \\beta_p x_{ip} + \\varepsilon_i'],
  },
  {
    title: 'Forma matricial y mínimos cuadrados',
    paragraphs: [
      'Las n ecuaciones se escriben y = Xβ + ε. La matriz de diseño X tiene una columna de unos y una columna por cada variable explicativa. β es el vector de coeficientes.',
      'El criterio sigue siendo minimizar la suma de residuales al cuadrado. Esta aplicación no invierte XᵀX a ciegas: resuelve el problema con la factorización QR de Householder. Si las columnas son dependientes, el sistema es singular y no se inventan coeficientes.',
    ],
    latex: ['\\hat\\beta = \\arg\\min_\\beta \\lVert X\\beta - y \\rVert_2'],
  },
  {
    title: 'R², R² ajustado y residuales',
    paragraphs: [
      'R² se interpreta igual que en la recta simple, siempre que SST no sea cero. R² ajustado descuenta el número de variables: agregar una columna que casi no aporta no debería mejorar el resumen.',
      'El residual de cada fila es la diferencia entre lo observado y lo predicho. Un patrón curvo en los residuales sugiere que una recta en varias dimensiones no basta.',
    ],
    latex: ['R^2_{aj} = 1 - \\frac{SSE/(n-p-1)}{SST/(n-1)}'],
  },
  {
    title: 'Interpretación y multicolinealidad',
    paragraphs: [
      'No se lee un coeficiente como “la importancia” de la variable si las unidades o la escala cambian. Se lee como efecto parcial, con las demás fijas.',
      'La multicolinealidad aparece cuando una explicativa es casi una combinación de las otras. El VIF grande avisa de que el coeficiente está inestable. La colinealidad exacta detiene el cálculo.',
    ],
  },
];

export const logisticTheory: TheoryBlock[] = [
  {
    title: 'Clasificación, no una recta de probabilidades',
    paragraphs: [
      'La regresión logística estima la probabilidad de una clase binaria. Una recta de mínimos cuadrados sobre 0 y 1 puede dar valores menores que 0 o mayores que 1, que no son probabilidades. La logística comprime la combinación lineal con la función sigmoide.',
    ],
    latex: ['p = \\sigma(z) = \\frac{1}{1+e^{-z}}, \\quad z = \\beta_0 + \\beta_1 x_1 + \\cdots + \\beta_p x_p'],
  },
  {
    title: 'Momios, umbral y pérdida',
    paragraphs: [
      'El logaritmo de los momios es z = ln(p/(1−p)). El coeficiente βj es el cambio en ese logaritmo cuando xj aumenta una unidad. La razón de momios es e^{βj}.',
      'La clase predicha no es la probabilidad: se compara p con un umbral τ. Con τ = 0.5 se predice la clase positiva si p es al menos 0.5. Bajar el umbral aumenta la sensibilidad y puede aumentar los falsos positivos.',
      'Los coeficientes se estiman maximizando la verosimilitud. La pérdida que se minimiza es la logarítmica, también llamada entropía cruzada. No existe la misma solución cerrada de los mínimos cuadrados.',
    ],
    latex: ['\\ell(\\beta) = \\sum \\left[y_i\\ln p_i + (1-y_i)\\ln(1-p_i)\\right]'],
  },
  {
    title: 'Matriz de confusión',
    paragraphs: [
      'Con las clases reales y las predichas se cuentan verdaderos positivos, falsos negativos, falsos positivos y verdaderos negativos.',
      'La exactitud es la proporción de aciertos. La precisión mira, entre los predichos positivos, cuántos lo eran. La sensibilidad mira, entre los positivos reales, cuántos se detectaron. La especificidad hace lo mismo con la clase negativa.',
    ],
    latex: ['\\text{Exactitud}=\\frac{VP+VN}{N},\\quad \\text{Precisión}=\\frac{VP}{VP+FP},\\quad \\text{Sensibilidad}=\\frac{VP}{VP+FN}'],
  },
];

export const treeTheory: TheoryBlock[] = [
  {
    title: 'Preguntas sucesivas',
    paragraphs: [
      'Un árbol de decisión clasifica siguiendo preguntas. La raíz contiene todos los registros y hace la primera pregunta. Cada respuesta abre una rama hacia un nodo interno o hacia una hoja. La hoja asigna la clase mayoritaria de los registros que llegaron allí.',
    ],
  },
  {
    title: 'Entropía y ganancia',
    paragraphs: [
      'La entropía de Shannon mide la mezcla de clases: H = −Σ pc log2(pc). Vale 0 en un nodo puro y 1 cuando dos clases están empatadas.',
      'La ganancia de información es la entropía del nodo menos el promedio ponderado de la entropía de los hijos. ID3 elige la pregunta con mayor ganancia. La razón de ganancia divide esa ganancia entre la entropía de la propia partición, para no premiar atributos con demasiados valores distintos. En este software el criterio «entropía» selecciona por ganancia, y muestra la razón de ganancia solo como información.',
    ],
    latex: ['H(S) = -\\sum_c p_c \\log_2 p_c', 'GI(S,A) = H(S) - \\sum_v \\frac{|S_v|}{|S|} H(S_v)'],
  },
  {
    title: 'Índice de Gini',
    paragraphs: [
      'El índice de Gini es G = 1 − Σ pc². También vale 0 en un nodo puro, pero en un empate de dos clases vale 0.5, no 1. No usa logaritmos. CART elige la división con menor Gini ponderado, que es lo mismo que la mayor reducción de Gini.',
      'Entropía y Gini no son intercambiables en la fórmula. Pueden elegir la misma pregunta, como en varios ejercicios del curso, pero el número que se compara es distinto.',
    ],
    latex: ['G(S) = 1 - \\sum_c p_c^2'],
  },
  {
    title: 'Parada, profundidad y sobreajuste',
    paragraphs: [
      'El crecimiento se detiene si el nodo es puro, si se alcanza la profundidad máxima, si no hay suficientes observaciones para dividir o si ninguna hoja hija cumpliría el mínimo de observaciones.',
      'Un árbol que separa perfectamente el entrenamiento puede memorizar ruido. La prepoda limita profundidad y tamaños. Este programa no hace la poda de costo-complejidad de CART después de crecer: el control está en los parámetros antes de entrenar.',
      'Las variables categóricas abren una rama por valor. Las numéricas se parten en un umbral, en el punto medio de dos valores consecutivos, con la pregunta x ≤ t.',
    ],
  },
];

export const comparisonRows: { aspect: string; simple: string; multiple: string; logistic: string; tree: string }[] = [
  { aspect: 'Respuesta', simple: 'Numérica', multiple: 'Numérica', logistic: 'Probabilidad y clase binaria', tree: 'Clase' },
  { aspect: 'Entradas', simple: 'Una variable', multiple: 'Varias variables numéricas', logistic: 'Una o varias variables numéricas', tree: 'Numéricas y categóricas' },
  { aspect: 'Ajuste', simple: 'Mínimos cuadrados', multiple: 'Mínimos cuadrados con QR', logistic: 'Máxima verosimilitud (Newton)', tree: 'Partición por impureza' },
  { aspect: 'Forma', simple: 'Recta', multiple: 'Hiperplano', logistic: 'Frontera lineal en z', tree: 'Reglas si-entonces' },
  { aspect: 'Riesgo principal', simple: 'Extrapolar', multiple: 'Multicolinealidad', logistic: 'Separación perfecta', tree: 'Sobreajuste' },
];
