import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { ModuleShell, Panel, inputClass } from '../components/ui/ModuleShell';
import { DataGrid } from '../components/ui/DataGrid';
import { GhostButton, HintBanner, SolveButton, ValidationList } from '../components/ui/Chrome';
import { Tabs } from '../components/ui/Formula';
import { ResidualChart } from '../components/charts/FitChart';
import { CodePanel, ExerciseList, MetricGrid, PlainTable, PracticeForm, StepsView, TheoryView } from '../components/learn/Panels';
import { exercisesByTopic, type MultiplePreset } from '../content/exercises';
import { multipleTheory } from '../content/theory';
import { questionsFromMultiple } from '../content/liveQuestions';
import { fmt, parseNumberCell } from '../core/format';
import { fitMultiple, type MultiResult } from '../core/multipleLinear';
import { addColumn, addRow, removeColumn, removeRow, updateCell } from '../core/table';
import multipleSource from '../core/multipleLinear.ts?raw';

const ACCENT = '#34d399';
const TABS = [
  { id: 'resultados', label: 'Resultados' },
  { id: 'pasos', label: 'Paso a paso' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'practicar', label: 'Practicar' },
  { id: 'codigo', label: 'Implementación en código' },
];

const exampleNames = ['Publicidad', 'Vendedores'];
const exampleRows = [['1', '2', '3'], ['2', '1', '4'], ['3', '4', '8'], ['4', '3', '9'], ['5', '5', '11']];

function readTable(names: string[], rows: string[][], predict: string[]) {
  const errors: string[] = [];
  const p = names.length;
  if (names.some(name => !name.trim())) errors.push('Todas las variables explicativas necesitan nombre.');
  const X: number[][] = [];
  const y: number[] = [];
  rows.forEach((row, index) => {
    if (row.every(cell => !cell.trim())) {
      errors.push(`La fila ${index + 1} está vacía.`);
      return;
    }
    const values = row.slice(0, p).map(parseNumberCell);
    const target = parseNumberCell(row[p] ?? '');
    if (values.some(v => v === null) || target === null) errors.push(`La fila ${index + 1} está incompleta o no es numérica.`);
    else { X.push(values as number[]); y.push(target); }
  });
  const x0 = predict.map(parseNumberCell);
  const wantsPredict = predict.some(cell => cell.trim());
  if (wantsPredict && x0.some(v => v === null)) errors.push('La predicción nueva tiene un valor vacío o no numérico.');
  return { errors, X, y, x0: wantsPredict && x0.every(v => v !== null) ? x0 as number[] : null };
}

export const MultiplePage: React.FC = () => {
  const location = useLocation();
  const [names, setNames] = useState(exampleNames.slice());
  const [rows, setRows] = useState(exampleRows.map(row => row.slice()));
  const [predict, setPredict] = useState(['6', '4']);
  const [tab, setTab] = useState('resultados');
  const [issues, setIssues] = useState<string[]>([]);
  const [result, setResult] = useState<MultiResult | null>(null);
  const [notice, setNotice] = useState('');

  const touchRows = (next: string[][]) => { setRows(next); setResult(null); };

  useEffect(() => {
    const state = location.state as { preset?: MultiplePreset; notice?: string } | null;
    if (state?.preset?.topic === 'multiple') {
      setNames(state.preset.names.slice());
      setRows(state.preset.rows.map(row => row.slice()));
      setPredict(state.preset.predict.slice());
      setNotice(state.notice ?? '');
      setResult(null);
      setIssues([]);
      setTab('resultados');
    }
  }, [location.state]);

  const solve = () => {
    const parsed = readTable(names, rows, predict);
    if (parsed.errors.length) { setIssues(parsed.errors); setResult(null); return; }
    const fit = fitMultiple(parsed.X, parsed.y, names, parsed.x0);
    setIssues(fit.ok ? [] : fit.errors);
    setResult(fit);
    setTab('resultados');
  };

  const fit = result?.ok ? result.fit : null;

  return (
    <ModuleShell
      title="Regresión lineal múltiple"
      accent={ACCENT}
      sidebarBasisRem={32}
      sidebar={(
        <>
          <Panel title="Variables y observaciones" accent={ACCENT}>
            <HintBanner accent={ACCENT}>La última columna es Y. Puedes agregar o quitar variables explicativas; el ajuste usa factorización QR.</HintBanner>
            <div className="mt-3 flex gap-2">
              <button type="button" className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: ACCENT, background: `${ACCENT}18` }} onClick={() => {
                if (names.length >= 8) return;
                const index = names.length;
                setNames([...names, `x${index + 1}`]);
                setRows(addColumn(rows, index));
                setPredict([...predict, '']);
                setResult(null);
              }}><Plus size={12} className="inline" /> Variable</button>
              <button type="button" className="text-[11px] font-bold px-2 py-1 rounded-lg text-white/60" onClick={() => {
                if (names.length <= 1) return;
                const index = names.length - 1;
                setNames(names.slice(0, -1));
                setRows(removeColumn(rows, index));
                setPredict(predict.slice(0, -1));
                setResult(null);
              }}><Trash2 size={12} className="inline" /> Quitar última</button>
            </div>
            <div className="mt-3">
              <DataGrid
                accent={ACCENT}
                columns={[
                  ...names.map((name, index) => ({ label: name, onRename: (value: string) => setNames(names.map((item, j) => j === index ? value : item)) })),
                  { label: 'Y' },
                ]}
                rows={rows}
                onCell={(r, c, value) => touchRows(updateCell(rows, r, c, value))}
                onAddRow={() => touchRows(addRow(rows, names.length + 1))}
                onRemoveRow={index => touchRows(removeRow(rows, index))}
              />
            </div>
          </Panel>
          <Panel title="Registro nuevo" accent={ACCENT}>
            <div className="grid grid-cols-2 gap-2">
              {names.map((name, index) => (
                <label key={name + index} className="text-[10px] text-white/40">
                  {name}
                  <input className={`${inputClass} mt-1`} aria-label={`Predicción ${name}`} value={predict[index] ?? ''} onChange={e => {
                    const next = predict.slice();
                    next[index] = e.target.value;
                    setPredict(next);
                    setResult(null);
                  }} />
                </label>
              ))}
            </div>
          </Panel>
          <SolveButton label="Estimar coeficientes" accent={ACCENT} onClick={solve} />
          <GhostButton label="Cargar ventas" onClick={() => { setNames(exampleNames.slice()); setRows(exampleRows.map(r => r.slice())); setPredict(['6', '4']); setResult(null); setIssues([]); setNotice(''); }} />
          <ValidationList issues={issues} />
          {notice && <HintBanner accent="#fbbf24">{notice}</HintBanner>}
        </>
      )}
    >
      <div className="space-y-4">
        <Tabs tabs={TABS} value={tab} onChange={setTab} accent={ACCENT} />
        {tab === 'resultados' && (fit ? (
          <div className="space-y-3">
            <Panel title="Ecuación" accent={ACCENT}><p className="text-lg font-black text-white">{fit.equation}</p></Panel>
            <MetricGrid items={[
              { label: 'n', value: String(fit.n) },
              { label: 'Variables', value: String(fit.p) },
              { label: 'SSE', value: fmt(fit.sse) },
              { label: 'SSR', value: fmt(fit.ssr) },
              { label: 'SST', value: fmt(fit.sst) },
              { label: 'R²', value: fit.r2 === null ? 'No definido' : fmt(fit.r2) },
              { label: 'R² ajustado', value: fit.r2Adj === null ? 'No definido' : fmt(fit.r2Adj) },
              { label: 'ECM', value: fmt(fit.mse ?? NaN) },
              { label: 'F', value: fit.f === null ? '—' : fmt(fit.f) },
              { label: 'Condición de R', value: fit.condition === null ? '—' : fmt(fit.condition, 2) },
            ]} />
            <Panel title="Coeficientes" accent={ACCENT}>
              <PlainTable
                headers={['Término', 'Estimación', 'EE', 't', 'p', 'VIF']}
                rows={fit.coefficients.map(c => [c.name, fmt(c.value, 4), c.se === null ? '—' : fmt(c.se, 4), c.t === null ? '—' : fmt(c.t, 3), c.p === null ? '—' : fmt(c.p, 4), c.vif === null ? '—' : (c.vif === Infinity ? '∞' : fmt(c.vif, 2))])}
              />
            </Panel>
            <Panel title="Predicciones y residuales" accent={ACCENT}>
              <PlainTable
                headers={['Y', 'Ŷ', 'Residual', 'Residual²']}
                rows={fit.rows.map(row => [fmt(row.y), fmt(row.yHat), fmt(row.residual), fmt(row.squared)])}
              />
            </Panel>
            <Panel title="Residuales contra el valor ajustado" accent={ACCENT}>
              <ResidualChart points={fit.rows.map(row => ({ x: row.yHat, y: row.residual }))} accent={ACCENT} />
            </Panel>
            {fit.prediction && (
              <Panel title="Cómo se arma la predicción" accent={ACCENT}>
                <p className="text-sm text-white/80 mb-2">Ŷ = {fmt(fit.prediction.yHat, 4)}</p>
                <PlainTable
                  headers={['Término', 'Coeficiente', 'Valor', 'Producto', 'Aporte respecto a la media']}
                  rows={fit.prediction.terms.map(term => [term.name, fmt(term.coef, 4), term.value === null ? '—' : fmt(term.value, 4), fmt(term.product, 4), term.centered === null ? '—' : fmt(term.centered, 4)])}
                />
                <p className="mt-2 text-xs text-white/55">{fit.prediction.note}</p>
              </Panel>
            )}
            <Panel title="Interpretación" accent={ACCENT}>
              <div className="space-y-2 text-sm text-white/75">{fit.interpretation.map(line => <p key={line}>{line}</p>)}</div>
            </Panel>
          </div>
        ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Arma la tabla y estima los coeficientes. Si las columnas son dependientes, verás por qué no hay solución.</p></Panel>)}
        {tab === 'pasos' && (fit ? <StepsView steps={fit.steps} accent={ACCENT} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">El paso a paso aparece después de un ajuste válido.</p></Panel>)}
        {tab === 'teoria' && <TheoryView blocks={multipleTheory} accent={ACCENT} />}
        {tab === 'ejercicios' && (
          <ExerciseList
            accent={ACCENT}
            items={exercisesByTopic('multiple')}
            onLoad={exercise => {
              const preset = exercise.preset as MultiplePreset;
              setNames(preset.names.slice());
              setRows(preset.rows.map(row => row.slice()));
              setPredict(preset.predict.slice());
              setNotice(exercise.givenModelNote ?? '');
              setResult(null);
              setTab('resultados');
            }}
          />
        )}
        {tab === 'practicar' && (fit ? <PracticeForm accent={ACCENT} questions={questionsFromMultiple(fit)} solution={fit.steps.map((s, i) => `${i + 1}. ${s.title}. ${s.body}`).join('\n\n')} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">Primero estima el modelo. La práctica compara tus números con ese ajuste.</p></Panel>)}
        {tab === 'codigo' && (
          <CodePanel
            accent={ACCENT}
            source={multipleSource}
            deps="El módulo linalg.ts (QR de Householder). No se usa una librería de álgebra externa."
            relation="La ecuación de la pantalla es el β que devuelve leastSquares. R² y el VIF se calculan con esos mismos coeficientes."
            guide={[
              { name: 'fitMultiple', role: 'Construye X con intercepto, estima β y las métricas.', input: 'Matriz de explicativas, vector Y y nombres.', output: 'Coeficientes, residuales, R², R² ajustado y predicción.' },
              { name: 'leastSquares', role: 'Resuelve mínimos cuadrados sin invertir XᵀX explícitamente.', input: 'Matriz de diseño y vector respuesta.', output: 'β, o un aviso de rango incompleto.' },
            ]}
            onRun={() => {
              const parsed = readTable(names, rows, predict);
              if (parsed.errors.length) return parsed.errors.join('\n');
              const ran = fitMultiple(parsed.X, parsed.y, names, parsed.x0);
              if (!ran.ok) return ran.errors.join('\n');
              return `${ran.fit.equation}\nR² = ${ran.fit.r2 === null ? 'no definido' : fmt(ran.fit.r2)}`;
            }}
          />
        )}
      </div>
    </ModuleShell>
  );
};
