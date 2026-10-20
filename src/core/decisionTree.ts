import { fail, fmt, type Fail, type Step } from './format';

export type Criterion = 'gini' | 'entropy';
export type Kind = 'numeric' | 'categorical';

export interface TreeOptions {
  criterion: Criterion;
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  /** Solo se usa si hay empates numéricos entre divisiones. */
  seed: number | null;
}

export interface TreeBranch {
  label: string;
  kind: 'le' | 'gt' | 'eq';
  threshold?: number;
  category?: string;
  child: TreeNode;
}

export interface TreeNode {
  id: number;
  depth: number;
  samples: number;
  counts: Record<string, number>;
  impurity: number;
  prediction: string;
  feature: string | null;
  featureIndex: number | null;
  branches: TreeBranch[];
}

export interface CandidateView {
  feature: string;
  description: string;
  weighted: number;
  gain: number;
  gainRatio: number | null;
}

export interface TraceEntry {
  nodeId: number;
  depth: number;
  samples: number;
  counts: Record<string, number>;
  impurity: number;
  candidates: CandidateView[];
  chosen: string | null;
  stop: string | null;
}

export interface PathStep {
  nodeId: number;
  text: string;
}

export interface TreeFit {
  tree: TreeNode;
  criterion: Criterion;
  trace: TraceEntry[];
  predictions: string[];
  labels: string[];
  confusion: number[][];
  accuracy: number | null;
  steps: Step[];
  interpretation: string[];
}

export type TreeResult = { ok: true; fit: TreeFit } | Fail;

export function entropy(counts: Record<string, number>, n: number): number {
  if (n <= 0) return 0;
  let h = 0;
  for (const c of Object.values(counts)) {
    if (c <= 0) continue;
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

export function gini(counts: Record<string, number>, n: number): number {
  if (n <= 0) return 0;
  let s = 0;
  for (const c of Object.values(counts)) {
    const p = c / n;
    s += p * p;
  }
  return 1 - s;
}

export function impurityOf(labels: string[], criterion: Criterion): number {
  const counts: Record<string, number> = {};
  for (const label of labels) counts[label] = (counts[label] ?? 0) + 1;
  return criterion === 'gini' ? gini(counts, labels.length) : entropy(counts, labels.length);
}

function countsOf(labels: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const label of labels) counts[label] = (counts[label] ?? 0) + 1;
  return counts;
}

function majority(labels: string[], order: string[]): string {
  const counts = countsOf(labels);
  let best = order[0] ?? labels[0];
  let bestN = -1;
  for (const label of order) {
    const n = counts[label] ?? 0;
    if (n > bestN) {
      best = label;
      bestN = n;
    }
  }
  return best;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RawSplit {
  feature: number;
  weighted: number;
  gain: number;
  gainRatio: number | null;
  description: string;
  groups: { label: string; kind: TreeBranch['kind']; threshold?: number; category?: string; indices: number[] }[];
}

export function fitDecisionTree(
  rows: string[][],
  y: string[],
  names: string[],
  kinds: Kind[],
  options: TreeOptions,
): TreeResult {
  const errors = validateTree(rows, y, names, kinds, options);
  if (errors.length) return fail(errors);

  const order: string[] = [];
  for (const label of y) if (!order.includes(label)) order.push(label);
  const trace: TraceEntry[] = [];
  let nextId = 1;
  const rng = options.seed === null ? null : mulberry32(options.seed);

  const build = (indices: number[], depth: number, usedCategorical: Set<number>): TreeNode => {
    const labels = indices.map(i => y[i]);
    const counts = countsOf(labels);
    const impurity = options.criterion === 'gini' ? gini(counts, labels.length) : entropy(counts, labels.length);
    const node: TreeNode = {
      id: nextId++,
      depth,
      samples: indices.length,
      counts,
      impurity,
      prediction: majority(labels, order),
      feature: null,
      featureIndex: null,
      branches: [],
    };

    const entry: TraceEntry = {
      nodeId: node.id,
      depth,
      samples: node.samples,
      counts,
      impurity,
      candidates: [],
      chosen: null,
      stop: null,
    };
    trace.push(entry);

    const pure = Object.keys(counts).length <= 1;
    if (pure) entry.stop = 'El nodo es puro: todos los registros son de la misma clase.';
    else if (depth >= options.maxDepth) entry.stop = 'Se alcanzó la profundidad máxima.';
    else if (indices.length < options.minSamplesSplit) entry.stop = 'No hay suficientes observaciones para dividir este nodo.';
    else {
      const splits = collectSplits(indices, usedCategorical);
      entry.candidates = splits.map(split => ({
        feature: names[split.feature],
        description: split.description,
        weighted: split.weighted,
        gain: split.gain,
        gainRatio: split.gainRatio,
      }));
      const usable = splits.filter(split => split.gain > 1e-12);
      if (!usable.length) {
        entry.stop = 'Ninguna división reduce la impureza. El nodo se queda como hoja.';
      } else {
        const bestScore = Math.min(...usable.map(s => s.weighted));
        let tied = usable.filter(s => Math.abs(s.weighted - bestScore) <= 1e-9);
        tied = [...tied].sort((a, b) => a.feature - b.feature || a.description.localeCompare(b.description, 'es'));
        const chosen = rng && tied.length > 1 ? tied[Math.floor(rng() * tied.length)] : tied[0];
        node.feature = names[chosen.feature];
        node.featureIndex = chosen.feature;
        entry.chosen = `${names[chosen.feature]}: ${chosen.description}`;
        const nextUsed = new Set(usedCategorical);
        if (kinds[chosen.feature] === 'categorical') nextUsed.add(chosen.feature);
        node.branches = chosen.groups.map(group => ({
          label: group.label,
          kind: group.kind,
          threshold: group.threshold,
          category: group.category,
          child: build(group.indices, depth + 1, nextUsed),
        }));
      }
    }
    return node;
  };

  const collectSplits = (indices: number[], usedCategorical: Set<number>): RawSplit[] => {
    const parentLabels = indices.map(i => y[i]);
    const parentImp = options.criterion === 'gini' ? gini(countsOf(parentLabels), indices.length) : entropy(countsOf(parentLabels), indices.length);
    const splits: RawSplit[] = [];
    for (let f = 0; f < names.length; f++) {
      if (kinds[f] === 'categorical') {
        if (usedCategorical.has(f)) continue;
        const groups = new Map<string, number[]>();
        for (const i of indices) {
          const key = rows[i][f];
          const list = groups.get(key) ?? [];
          list.push(i);
          groups.set(key, list);
        }
        if (groups.size < 2) continue;
        if ([...groups.values()].some(g => g.length < options.minSamplesLeaf)) continue;
        const weighted = weightedImpurity([...groups.values()], parentImp);
        const splitInfo = splitInformation([...groups.values()].map(g => g.length), indices.length);
        splits.push({
          feature: f,
          weighted: weighted.weighted,
          gain: weighted.gain,
          gainRatio: splitInfo > 1e-12 ? weighted.gain / splitInfo : null,
          description: `un hijo por cada valor (${[...groups.keys()].join(', ')})`,
          groups: [...groups.entries()].map(([category, idxs]) => ({
            label: `${names[f]} = ${category}`,
            kind: 'eq' as const,
            category,
            indices: idxs,
          })),
        });
      } else {
        const values = [...new Set(indices.map(i => asNumber(rows[i][f])))].sort((a, b) => a - b);
        for (let t = 0; t < values.length - 1; t++) {
          const threshold = (values[t] + values[t + 1]) / 2;
          const left = indices.filter(i => asNumber(rows[i][f]) <= threshold);
          const right = indices.filter(i => asNumber(rows[i][f]) > threshold);
          if (left.length < options.minSamplesLeaf || right.length < options.minSamplesLeaf) continue;
          const weighted = weightedImpurity([left, right], parentImp);
          splits.push({
            feature: f,
            weighted: weighted.weighted,
            gain: weighted.gain,
            gainRatio: null,
            description: `${names[f]} ≤ ${fmt(threshold, 4)} (impureza ponderada ${fmt(weighted.weighted, 5)})`,
            groups: [
              { label: `${names[f]} ≤ ${fmt(threshold, 4)}`, kind: 'le', threshold, indices: left },
              { label: `${names[f]} > ${fmt(threshold, 4)}`, kind: 'gt', threshold, indices: right },
            ],
          });
        }
      }
    }
    return splits;
  };

  const weightedImpurity = (groups: number[][], parentImp: number) => {
    const total = groups.reduce((acc, g) => acc + g.length, 0);
    let weighted = 0;
    for (const group of groups) {
      const labels = group.map(i => y[i]);
      const imp = options.criterion === 'gini' ? gini(countsOf(labels), labels.length) : entropy(countsOf(labels), labels.length);
      weighted += (group.length / total) * imp;
    }
    return { weighted, gain: parentImp - weighted };
  };

  const tree = build(rows.map((_, i) => i), 0, new Set());
  const predictions = rows.map(row => predictOne(tree, row, names).label);
  const confusion = order.map(actual => order.map(predicted => predictions.filter((pred, i) => y[i] === actual && pred === predicted).length));
  const correct = predictions.filter((pred, i) => pred === y[i]).length;
  const accuracy = y.length ? correct / y.length : null;
  const steps = buildSteps(options, trace, accuracy);
  const interpretation = [
    options.criterion === 'gini'
      ? 'El árbol eligió, en cada nodo, la división con menor índice de Gini ponderado. Gini = 1 − Σ p². No es la entropía y no usa logaritmos.'
      : 'El árbol eligió, en cada nodo, la división con mayor ganancia de información. La entropía es H = −Σ p log₂ p. La razón de ganancia se muestra como dato adicional y no decide el corte, igual que en ID3.',
    'Las variables categóricas abren una rama por valor. Las numéricas prueban umbrales en el punto medio de valores consecutivos y se quedan con el de menor impureza ponderada.',
    accuracy === null ? 'No hay registros para evaluar.' : `En los datos de entrenamiento la exactitud es ${fmt(accuracy * 100, 2)} %. Un árbol que acierta todo el entrenamiento puede estar memorizando ruido si las hojas tienen muy pocos casos.`,
  ];

  return { ok: true, fit: { tree, criterion: options.criterion, trace, predictions, labels: order, confusion, accuracy, steps, interpretation } };
}

function splitInformation(sizes: number[], total: number): number {
  let h = 0;
  for (const size of sizes) {
    if (size <= 0) continue;
    const p = size / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function validateTree(rows: string[][], y: string[], names: string[], kinds: Kind[], options: TreeOptions): string[] {
  const errors: string[] = [];
  if (names.length === 0) errors.push('Agrega al menos una variable explicativa.');
  if (rows.length < 2) errors.push('Se necesitan al menos dos registros para entrenar un árbol.');
  if (rows.length !== y.length) errors.push('La columna de clase no coincide con el número de filas.');
  if (rows.some(row => row.length !== names.length || row.some(cell => !cell.trim()))) {
    errors.push('Hay celdas vacías. Completa todas las variables y la clase.');
  }
  if (y.some(label => !label.trim())) errors.push('Hay clases vacías.');
  const classes = new Set(y.map(v => v.trim()));
  if (classes.size < 2) errors.push('La variable objetivo tiene una sola clase. El árbol no tiene nada que separar.');
  for (let j = 0; j < names.length; j++) {
    if (kinds[j] === 'numeric') {
      const values = rows.map(row => asNumber(row[j]));
      if (values.some(v => !Number.isFinite(v))) {
        errors.push(`La columna ${names[j]} está marcada como numérica, pero contiene texto. Márcala como categórica o corrige el valor.`);
      }
    }
  }
  if (!(options.maxDepth >= 1)) errors.push('La profundidad máxima debe ser al menos 1.');
  if (!(options.minSamplesSplit >= 2)) errors.push('El mínimo de observaciones para dividir debe ser al menos 2.');
  if (!(options.minSamplesLeaf >= 1)) errors.push('El mínimo de observaciones por hoja debe ser al menos 1.');
  return errors;
}

function asNumber(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

export function predictOne(tree: TreeNode, row: string[], names: string[]): { label: string; path: PathStep[]; warning: string | null } {
  const path: PathStep[] = [];
  let node = tree;
  let warning: string | null = null;
  while (node.branches.length && node.featureIndex !== null) {
    const feature = node.featureIndex;
    const value = row[feature];
    const numeric = node.branches.some(b => b.kind === 'le' || b.kind === 'gt');
    let next: TreeBranch | undefined;
    if (numeric) {
      const x = Number(String(value).trim().replace(',', '.'));
      if (!Number.isFinite(x)) {
        warning = `${names[feature]} no es numérica en este registro. Se devuelve la clase mayoritaria del nodo actual.`;
        break;
      }
      next = node.branches.find(b => (b.kind === 'le' ? x <= (b.threshold ?? 0) : x > (b.threshold ?? 0)));
      path.push({
        nodeId: node.id,
        text: `${names[feature]} = ${fmt(x, 4)} ${next?.kind === 'le' ? 'cumple' : 'no cumple'} «${next?.label ?? ''}».`,
      });
    } else {
      next = node.branches.find(b => b.category === value);
      if (!next) {
        warning = `El valor «${value}» de ${names[feature]} no apareció en el entrenamiento. Se devuelve la clase mayoritaria del nodo actual.`;
        path.push({ nodeId: node.id, text: warning });
        break;
      }
      path.push({ nodeId: node.id, text: `Se sigue la rama «${next.label}».` });
    }
    if (!next) break;
    node = next.child;
  }
  path.push({
    nodeId: node.id,
    text: `Hoja con ${node.samples} ${node.samples === 1 ? 'registro' : 'registros'}. Clase asignada: ${node.prediction}. Distribución: ${Object.entries(node.counts).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
  });
  return { label: node.prediction, path, warning };
}

function buildSteps(options: TreeOptions, trace: TraceEntry[], accuracy: number | null): Step[] {
  const root = trace[0];
  const steps: Step[] = [
    {
      title: 'Impureza de la raíz',
      body: root
        ? `La raíz tiene ${root.samples} registros (${Object.entries(root.counts).map(([k, v]) => `${k}: ${v}`).join(', ')}). ${options.criterion === 'gini' ? 'Gini' : 'Entropía'} = ${fmt(root.impurity, 5)}.`
        : 'No hay raíz.',
      latex: options.criterion === 'gini' ? 'G=1-\\sum_c p_c^2' : 'H=-\\sum_c p_c\\log_2 p_c',
    },
  ];
  if (root) {
    const top = [...root.candidates].sort((a, b) => a.weighted - b.weighted).slice(0, 6);
    steps.push({
      title: 'Divisiones evaluadas en la raíz',
      body: top.length
        ? top.map(c => `${c.feature} — ${c.description}: impureza ponderada ${fmt(c.weighted, 5)}, ganancia ${fmt(c.gain, 5)}${c.gainRatio === null ? '' : `, razón de ganancia ${fmt(c.gainRatio, 5)}`}`).join(' · ')
        : 'No hubo divisiones válidas.',
      latex: options.criterion === 'gini'
        ? 'G_{div}=\\sum_v \\frac{|S_v|}{|S|}G(S_v)'
        : 'GI(S,A)=H(S)-\\sum_v \\frac{|S_v|}{|S|}H(S_v)',
    });
    steps.push({
      title: 'Corte elegido',
      body: root.chosen
        ? `Se elige ${root.chosen}. El criterio de parada configurado es profundidad ≤ ${options.maxDepth}, mínimo para dividir ${options.minSamplesSplit} y mínimo por hoja ${options.minSamplesLeaf}.`
        : root.stop ?? 'La raíz no se dividió.',
    });
  }
  const later = trace.filter(entry => entry.depth > 0 && (entry.chosen || entry.stop)).slice(0, 8);
  if (later.length) {
    steps.push({
      title: 'Nodos siguientes',
      body: later.map(entry => `Nodo ${entry.nodeId} (profundidad ${entry.depth}, n=${entry.samples}): ${entry.chosen ?? entry.stop}`).join(' · '),
    });
  }
  steps.push({
    title: 'Evaluación en el entrenamiento',
    body: accuracy === null
      ? 'No hay métricas.'
      : `Exactitud de entrenamiento = ${fmt(accuracy, 4)}. La matriz de confusión compara la clase real con la hoja a la que llega cada registro. No es una estimación del desempeño con datos nuevos.`,
  });
  return steps;
}

export function inferKind(values: string[]): Kind {
  if (!values.length) return 'categorical';
  return values.every(value => /^-?\d+(?:[.,]\d+)?$/.test(value.trim())) ? 'numeric' : 'categorical';
}
