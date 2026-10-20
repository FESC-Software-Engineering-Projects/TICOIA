import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { ModuleShell, Panel, inputClass } from '../components/ui/ModuleShell';
import { DataGrid } from '../components/ui/DataGrid';
import { GhostButton, HintBanner, SolveButton, ValidationList } from '../components/ui/Chrome';
import { Tabs } from '../components/ui/Formula';
import { ProbabilityChart } from '../components/charts/FitChart';
import { CodePanel, ExerciseList, MetricGrid, PlainTable, PracticeForm, StepsView, TheoryView } from '../components/learn/Panels';
import { exercisesByTopic, type LogisticPreset } from '../content/exercises';
import { logisticTheory } from '../content/theory';
import { questionsFromLogistic } from '../content/liveQuestions';
import { fmt, parseNumberCell } from '../core/format';
import { applyLogistic, fitLogistic, metricsAtThreshold, sigmoid, type LogisticResult } from '../core/logistic';
import { addColumn, addRow, removeColumn, removeRow, updateCell } from '../core/table';
import logisticSource from '../core/logistic.ts?raw';

const ACCENT = '#c084fc';
const TABS = [
  { id: 'resultados', label: 'Resultados' },
  { id: 'pasos', label: 'Paso a paso' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'practicar', label: 'Practicar' },
  { id: 'codigo', label: 'Implementación en código' },
];

const exampleNames = ['Sesiones'];
const exampleRows = [['1', '0'], ['2', '0'], ['3', '1'], ['4', '0'], ['5', '1'], ['6', '1']];

function readTable(names: string[], rows: string[][], positive: string, negative: string, predict: string[]) {
  const errors: string[] = [];
  const p = names.length;
  if (!positive.trim() || !negative.trim() || positive.trim() === negative.trim()) {
    errors.push('Define dos etiquetas distintas para la clase positiva y la negativa.');
  }
  const X: number[][] = [];
  const y: number[] = [];
  rows.forEach((row, index) => {
    if (row.every(cell => !cell.trim())) {
      errors.push(`La fila ${index + 1} está vacía.`);
      return;
    }
    const values = row.slice(0, p).map(parseNumberCell);
    const label = (row[p] ?? '').trim();
    if (values.some(v => v === null)) errors.push(`La fila ${index + 1} tiene una explicativa vacía o no numérica.`);
    else if (label !== positive.trim() && label !== negative.trim()) errors.push(`La fila ${index + 1} tiene la clase «${label || 'vacía'}», que no es ${positive} ni ${negative}.`);
    else { X.push(values as number[]); y.push(label === positive.trim() ? 1 : 0); }
  });
  const x0 = predict.map(parseNumberCell);
  const wants = predict.some(cell => cell.trim());
  if (wants && x0.some(v => v === null)) errors.push('El registro nuevo está incompleto.');
  return { errors, X, y, x0: wants && x0.every((v): v is number => v !== null) ? x0 : null };
}

export const LogisticPage: React.FC = () => {
  const location = useLocation();
  const [names, setNames] = useState(exampleNames.slice());
  const [rows, setRows] = useState(exampleRows.map(row => row.slice()));
  const [positive, setPositive] = useState('1');
  const [negative, setNegative] = useState('0');
  const [threshold, setThreshold] = useState('0.5');
  const [predict, setPredict] = useState(['4']);
  const [tab, setTab] = useState('resultados');
  const [issues, setIssues] = useState<string[]>([]);
  const [result, setResult] = useState<LogisticResult | null>(null);
  const [notice, setNotice] = useState('');

  const touch = (next: string[][]) => { setRows(next); setResult(null); };

  useEffect(() => {
    const state = location.state as { preset?: LogisticPreset; notice?: string } | null;
    if (state?.preset?.topic === 'logistic') {
      setNames(state.preset.names.slice());
      setRows(state.preset.rows.map(row => row.slice()));
      setPositive(state.preset.positive);
      setNegative(state.preset.negative);
      setThreshold(state.preset.threshold);
      setPredict(state.preset.names.map(() => ''));
      setNotice(state.notice ?? '');
      setResult(null);
      setTab('resultados');
    }
  }, [location.state]);

  const tau = parseNumberCell(threshold);
  const fit = result?.ok ? result.fit : null;
  const metrics = useMemo(() => {
    if (!fit || tau === null) return null;
    const y = rows.map(row => ((row[names.length] ?? '').trim() === positive.trim() ? 1 : 0));
    if (y.length !== fit.probabilities.length) return null;
    const scored = metricsAtThreshold(y, fit.probabilities, tau);
    return 'ok' in scored ? null : { ...scored, y };
  }, [fit, tau, names.length, rows, positive]);

  const solve = () => {
    const parsed = readTable(names, rows, positive, negative, predict);
    const local = [...parsed.errors];
    if (tau === null || !(tau > 0 && tau < 1)) local.push('El umbral debe ser un número entre 0 y 1, sin incluir los extremos.');
    if (local.length) { setIssues(local); setResult(null); return; }
    const trained = fitLogistic(parsed.X, parsed.y, names);
    setIssues(trained.ok ? [] : trained.errors);
    setResult(trained);
    setTab('resultados');
  };

  const curve = fit && names.length === 1 ? Array.from({ length: 40 }, (_, i) => {
    const xs = rows.map(row => parseNumberCell(row[0] ?? '')).filter((v): v is number => v !== null);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const x = min + ((max - min) || 1) * i / 39;
    const z = fit.intercept + fit.coefficients[0] * x;
    return { x, y: sigmoid(z) };
  }) : undefined;
  const probPoints = fit && names.length === 1
    ? rows.map(row => ({ x: parseNumberCell(row[0] ?? '') ?? 0, y: 0 })).map((point, i) => ({ x: point.x, y: fit.probabilities[i] }))
    : fit?.probabilities.map((y, i) => ({ x: i + 1, y })) ?? [];

  const newPrediction = fit ? (() => {
    const parsed = readTable(names, rows, positive, negative, predict);
    if (!parsed.x0) return null;
    const applied = applyLogistic([fit.intercept, ...fit.coefficients], [parsed.x0], null);
    return { probability: applied.probabilities[0], z: applied.linear[0], x: parsed.x0 };
  })() : null;

  return (
    <ModuleShell
      title="Regresión logística"
      accent={ACCENT}
      sidebarBasisRem={32}
      sidebar={(
        <>
          <Panel title="Clases" accent={ACCENT}>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10px] text-white/40">Clase positiva
                <input className={`${inputClass} mt-1`} value={positive} onChange={e => { setPositive(e.target.value); setResult(null); }} />
              </label>
              <label className="text-[10px] text-white/40">Clase negativa
                <input className={`${inputClass} mt-1`} value={negative} onChange={e => { setNegative(e.target.value); setResult(null); }} />
              </label>
            </div>
            <label className="text-[10px] text-white/40 block mt-2">Umbral
              <input className={`${inputClass} mt-1`} value={threshold} onChange={e => setThreshold(e.target.value)} aria-label="Umbral de clasificación" />
            </label>
            <p className="text-[11px] text-white/40 mt-2">Cambiar el umbral no vuelve a entrenar: solo cambia la clase asignada a cada probabilidad.</p>
          </Panel>
          <Panel title="Datos" accent={ACCENT}>
            <div className="flex gap-2 mb-2">
              <button type="button" className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: ACCENT, background: `${ACCENT}18` }} onClick={() => {
                if (names.length >= 6) return;
                setNames([...names, `x${names.length + 1}`]);
                setRows(addColumn(rows, names.length));
                setPredict([...predict, '']);
                setResult(null);
              }}><Plus size={12} className="inline" /> Variable</button>
              <button type="button" className="text-[11px] font-bold text-white/60" onClick={() => {
                if (names.length <= 1) return;
                setNames(names.slice(0, -1));
                setRows(removeColumn(rows, names.length - 1));
                setPredict(predict.slice(0, -1));
                setResult(null);
              }}><Trash2 size={12} className="inline" /> Quitar última</button>
            </div>
            <DataGrid
              accent={ACCENT}
              columns={[...names.map((name, index) => ({ label: name, onRename: (value: string) => setNames(names.map((item, j) => j === index ? value : item)) })), { label: 'Clase' }]}
              rows={rows}
              onCell={(r, c, value) => touch(updateCell(rows, r, c, value))}
              onAddRow={() => touch(addRow(rows, names.length + 1))}
              onRemoveRow={index => touch(removeRow(rows, index))}
            />
          </Panel>
          <Panel title="Registro nuevo" accent={ACCENT}>
            {names.map((name, index) => (
              <label key={name + index} className="text-[10px] text-white/40 block mb-2">{name}
                <input className={`${inputClass} mt-1`} value={predict[index] ?? ''} onChange={e => {
                  const next = predict.slice();
                  next[index] = e.target.value;
                  setPredict(next);
                }} />
              </label>
            ))}
          </Panel>
          <SolveButton label="Entrenar por máxima verosimilitud" accent={ACCENT} onClick={solve} />
          <GhostButton label="Cargar sesiones y aprobación" onClick={() => {
            setNames(exampleNames.slice()); setRows(exampleRows.map(r => r.slice())); setPredict(['4']);
            setPositive('1'); setNegative('0'); setThreshold('0.5'); setResult(null); setNotice(''); setIssues([]);
          }} />
          <ValidationList issues={issues} />
          {notice && <HintBanner accent="#fbbf24">{notice}</HintBanner>}
        </>
      )}
    >
      <div className="space-y-4">
        <Tabs tabs={TABS} value={tab} onChange={setTab} accent={ACCENT} />
        {tab === 'resultados' && (fit && tau !== null && !(tau > 0 && tau < 1) ? (
          <Panel accent={ACCENT}><p className="text-sm text-rose-200">El umbral debe ser un número entre 0 y 1, sin incluir 0 ni 1. Las probabilidades del entrenamiento se conservan; corrige el umbral para ver las clases.</p></Panel>
        ) : fit && metrics && tau !== null ? (
          <div className="space-y-3">
            <Panel title="Modelo entrenado" accent={ACCENT}><p className="text-lg font-black text-white">{fit.equation}</p></Panel>
            <MetricGrid items={[
              { label: 'Intercepto', value: fmt(fit.intercept, 4) },
              ...fit.names.map((name, i) => ({ label: name, value: fmt(fit.coefficients[i], 4) })),
              { label: 'Pérdida logarítmica', value: fmt(fit.logLoss, 4) },
              { label: 'Log-verosimilitud', value: fmt(fit.logLik, 4) },
              { label: 'McFadden', value: fit.mcfadden === null ? '—' : fmt(fit.mcfadden, 4) },
              { label: 'Umbral', value: fmt(tau, 2) },
              { label: 'Exactitud', value: metrics.confusion.accuracy === null ? '—' : fmt(metrics.confusion.accuracy, 4) },
              { label: 'Precisión', value: metrics.confusion.precision === null ? 'No definida' : fmt(metrics.confusion.precision, 4) },
              { label: 'Sensibilidad', value: metrics.confusion.recall === null ? 'No definida' : fmt(metrics.confusion.recall, 4) },
              { label: 'Especificidad', value: metrics.confusion.specificity === null ? 'No definida' : fmt(metrics.confusion.specificity, 4) },
            ]} />
            <Panel title="Probabilidad y clase de cada fila" accent={ACCENT}>
              <PlainTable
                headers={['z', 'Probabilidad', 'Clase predicha', 'Clase real']}
                rows={fit.probabilities.map((p, i) => [fmt(fit.linear[i], 4), fmt(p, 4), metrics.classes[i] === 1 ? positive : negative, metrics.y[i] === 1 ? positive : negative])}
              />
            </Panel>
            <Panel title="Matriz de confusión" accent={ACCENT}>
              <PlainTable
                headers={['', `Predicho ${positive}`, `Predicho ${negative}`]}
                rows={[
                  [`Real ${positive}`, metrics.confusion.vp, metrics.confusion.fn],
                  [`Real ${negative}`, metrics.confusion.fp, metrics.confusion.vn],
                ]}
              />
            </Panel>
            <Panel title={names.length === 1 ? 'Sigmoide' : 'Probabilidad por registro'} accent={ACCENT}>
              <ProbabilityChart curve={curve} points={probPoints} accent={ACCENT} />
            </Panel>
            <Panel title="Razones de momios" accent={ACCENT}>
              <p className="text-sm text-white/70">{fit.oddsRatios.map(item => `${item.name}: ${fmt(item.or, 4)}`).join(' · ') || 'Sin variables.'}</p>
              <p className="text-xs text-white/45 mt-2">Cada valor es e elevado al coeficiente. Multiplica los momios cuando esa variable aumenta una unidad y las demás no cambian.</p>
            </Panel>
            {newPrediction && (
              <Panel title="Registro nuevo" accent={ACCENT}>
                <p className="text-sm text-white/80">z = {fmt(newPrediction.z, 4)}. Probabilidad de {positive}: {fmt(newPrediction.probability, 4)}. Clase: {newPrediction.probability >= tau ? positive : negative}.</p>
                <p className="text-xs text-white/45 mt-2">La contribución de cada variable es su coeficiente por su valor, dentro de z. La sigmoide después no reparte esa suma en partes que se puedan leer como probabilidades separadas.</p>
              </Panel>
            )}
          </div>
        ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Entrena el modelo. Los coeficientes salen de Newton-Raphson sobre estos datos, no de un ejemplo guardado.</p></Panel>)}
        {tab === 'pasos' && (fit ? <StepsView steps={fit.steps} accent={ACCENT} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">El procedimiento de optimización aparece después de entrenar.</p></Panel>)}
        {tab === 'teoria' && <TheoryView blocks={logisticTheory} accent={ACCENT} />}
        {tab === 'ejercicios' && (
          <ExerciseList
            accent={ACCENT}
            items={exercisesByTopic('logistic')}
            onLoad={exercise => {
              const preset = exercise.preset as LogisticPreset;
              setNames(preset.names.slice());
              setRows(preset.rows.map(row => row.slice()));
              setPositive(preset.positive);
              setNegative(preset.negative);
              setThreshold(preset.threshold);
              setPredict(preset.names.map(() => ''));
              setNotice(exercise.givenModelNote ?? '');
              setResult(null);
              setTab('resultados');
            }}
          />
        )}
        {tab === 'practicar' && (fit && tau !== null ? (
          <PracticeForm
            accent={ACCENT}
            questions={questionsFromLogistic(fit, metrics?.y ?? [], tau)}
            solution={fit.steps.map((s, i) => `${i + 1}. ${s.title}. ${s.body}`).join('\n\n')}
          />
        ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Entrena primero. Las respuestas se comparan con el modelo ajustado y con el umbral actual.</p></Panel>)}
        {tab === 'codigo' && (
          <CodePanel
            accent={ACCENT}
            source={logisticSource}
            deps="solveSystem, en linalg.ts, invierte el paso de Newton. No hay librería de optimización."
            relation="sigmoid, logLikelihood y fitLogistic son las funciones de la calculadora. applyLogistic solo evalúa un modelo ya escrito, como en los ejercicios 4.1 y 4.3, y no se presenta como entrenamiento."
            guide={[
              { name: 'sigmoid', role: 'Convierte la combinación lineal en una probabilidad entre 0 y 1.', input: 'Un número z.', output: 'σ(z).' },
              { name: 'fitLogistic', role: 'Maximiza la verosimilitud con Newton-Raphson desde β = 0.', input: 'Explicativas numéricas y clases 0/1.', output: 'Coeficientes, probabilidades e historial de iteraciones.' },
              { name: 'metricsAtThreshold', role: 'Asigna clases y arma la matriz de confusión.', input: 'Probabilidades y umbral.', output: 'Exactitud, precisión, sensibilidad y especificidad.' },
            ]}
            onRun={() => {
              const parsed = readTable(names, rows, positive, negative, predict);
              if (parsed.errors.length) return parsed.errors.join('\n');
              const ran = fitLogistic(parsed.X, parsed.y, names);
              if (!ran.ok) return ran.errors.join('\n');
              return `${ran.fit.equation}\nPérdida = ${fmt(ran.fit.logLoss, 4)}\nIteraciones registradas = ${ran.fit.iterations.length}`;
            }}
          />
        )}
      </div>
    </ModuleShell>
  );
};
