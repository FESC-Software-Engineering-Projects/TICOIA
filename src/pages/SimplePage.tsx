import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ModuleShell, Panel, inputClass } from '../components/ui/ModuleShell';
import { DataGrid } from '../components/ui/DataGrid';
import { GhostButton, HintBanner, SolveButton, ValidationList } from '../components/ui/Chrome';
import { Tabs } from '../components/ui/Formula';
import { ResidualChart, ScatterFitChart } from '../components/charts/FitChart';
import { CodePanel, ExerciseList, MetricGrid, PlainTable, PracticeForm, StepsView, TheoryView } from '../components/learn/Panels';
import { exercisesByTopic, type SimplePreset } from '../content/exercises';
import { simpleTheory } from '../content/theory';
import { questionsFromSimple } from '../content/liveQuestions';
import { fmt, parseNumberCell } from '../core/format';
import { fitSimpleLinear, seriesForChart, type SimpleResult } from '../core/simpleLinear';
import { addRow, removeRow, updateCell } from '../core/table';
import simpleSource from '../core/simpleLinear.ts?raw';

const ACCENT = '#818cf8';
const TABS = [
  { id: 'resultados', label: 'Resultados' },
  { id: 'pasos', label: 'Paso a paso' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'practicar', label: 'Practicar' },
  { id: 'codigo', label: 'Implementación en código' },
];

const example: string[][] = [['1', '2'], ['2', '3'], ['3', '5'], ['4', '4'], ['5', '6']];

function readTable(rows: string[][], predict: string) {
  const errors: string[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  rows.forEach((row, index) => {
    const x = parseNumberCell(row[0] ?? '');
    const y = parseNumberCell(row[1] ?? '');
    if ((row[0] ?? '').trim() === '' && (row[1] ?? '').trim() === '') {
      errors.push(`La fila ${index + 1} está vacía. Complétala o elimínala.`);
      return;
    }
    if (x === null || y === null) errors.push(`La fila ${index + 1} tiene un valor vacío o no numérico.`);
    else { xs.push(x); ys.push(y); }
  });
  let x0: number | null = null;
  if (predict.trim()) {
    x0 = parseNumberCell(predict);
    if (x0 === null) errors.push('El X de la predicción no es un número.');
  }
  return { errors, xs, ys, x0 };
}

export const SimplePage: React.FC = () => {
  const location = useLocation();
  const [rows, setRows] = useState(example.map(row => row.slice()));
  const [predict, setPredict] = useState('6');
  const [tab, setTab] = useState('resultados');
  const [issues, setIssues] = useState<string[]>([]);
  const [result, setResult] = useState<SimpleResult | null>(null);
  const [notice, setNotice] = useState('');

  const touch = (next: string[][]) => {
    setRows(next);
    setResult(null);
  };

  useEffect(() => {
    const preset = (location.state as { preset?: SimplePreset; notice?: string } | null)?.preset;
    if (preset?.topic === 'simple') {
      setRows(preset.rows.map(row => row.slice()));
      setPredict(preset.predict);
      setNotice((location.state as { notice?: string }).notice ?? '');
      setResult(null);
      setIssues([]);
      setTab('resultados');
    }
  }, [location.state]);

  const solve = () => {
    const parsed = readTable(rows, predict);
    if (parsed.errors.length) {
      setIssues(parsed.errors);
      setResult(null);
      return;
    }
    const fit = fitSimpleLinear(parsed.xs, parsed.ys, parsed.x0);
    setIssues(fit.ok ? [] : fit.errors);
    setResult(fit);
    setTab('resultados');
  };

  const fit = result?.ok ? result.fit : null;
  const chart = fit ? seriesForChart(fit) : null;

  return (
    <ModuleShell
      title="Regresión lineal simple"
      accent={ACCENT}
      sidebarBasisRem={26}
      sidebar={(
        <>
          <Panel title="Datos" accent={ACCENT}>
            <HintBanner accent={ACCENT}>Escribe tus propias parejas (X, Y). El ejemplo de horas y nota solo aparece hasta que lo cambies.</HintBanner>
            <div className="mt-3">
              <DataGrid
                accent={ACCENT}
                columns={[{ label: 'X' }, { label: 'Y' }]}
                rows={rows}
                onCell={(r, c, value) => touch(updateCell(rows, r, c, value))}
                onAddRow={() => touch(addRow(rows, 2))}
                onRemoveRow={index => touch(removeRow(rows, index))}
              />
            </div>
          </Panel>
          <Panel title="Predicción" accent={ACCENT}>
            <label className="text-[10px] uppercase tracking-widest text-white/35">Nuevo valor de X</label>
            <input className={`${inputClass} mt-1`} value={predict} onChange={e => { setPredict(e.target.value); setResult(null); }} aria-label="Valor de X para predecir" />
          </Panel>
          <SolveButton label="Calcular recta" accent={ACCENT} onClick={solve} />
          <GhostButton label="Cargar horas y nota" onClick={() => { setRows(example.map(r => r.slice())); setPredict('6'); setResult(null); setNotice(''); setIssues([]); }} />
          <GhostButton label="Vaciar tabla" onClick={() => { setRows([['', ''], ['', '']]); setPredict(''); setResult(null); setIssues([]); }} />
          <ValidationList issues={issues} />
          {notice && <HintBanner accent="#fbbf24">{notice}</HintBanner>}
        </>
      )}
    >
      <div className="space-y-4">
        <Tabs tabs={TABS} value={tab} onChange={setTab} accent={ACCENT} />
        {tab === 'resultados' && (
          fit && chart ? (
            <div className="space-y-3">
              <Panel title="Ecuación" accent={ACCENT}>
                <p className="text-lg font-black text-white">{fit.equation}</p>
                <div className="mt-3"><MetricGrid items={[
                  { label: 'n', value: String(fit.n) },
                  { label: 'Media X', value: fmt(fit.meanX) },
                  { label: 'Media Y', value: fmt(fit.meanY) },
                  { label: 'Sxx', value: fmt(fit.sxx) },
                  { label: 'Sxy', value: fmt(fit.sxy) },
                  { label: 'Syy', value: fmt(fit.syy) },
                  { label: 'Pendiente', value: fmt(fit.slope) },
                  { label: 'Intercepto', value: fmt(fit.intercept) },
                  { label: 'SSE', value: fmt(fit.sse) },
                  { label: 'SSR', value: fmt(fit.ssr) },
                  { label: 'SST', value: fmt(fit.sst) },
                  { label: 'R²', value: fit.r2 === null ? 'No definido' : fmt(fit.r2) },
                  { label: 'Correlación', value: fit.correlation === null ? 'No definida' : fmt(fit.correlation) },
                  { label: 'ECM', value: fit.mse === null ? '—' : fmt(fit.mse) },
                  { label: 's', value: fit.sigma === null ? 'n−2 = 0' : fmt(fit.sigma) },
                ]} /></div>
              </Panel>
              <Panel title="Observaciones, predicciones y residuales" accent={ACCENT}>
                <PlainTable
                  headers={['X', 'Y', 'Ŷ', 'Residual', 'Residual²']}
                  rows={fit.points.map(p => [fmt(p.x), fmt(p.y), fmt(p.yHat), fmt(p.residual), fmt(p.squared)])}
                />
              </Panel>
              {fit.prediction && (
                <Panel title="Predicción nueva" accent={ACCENT}>
                  <p className="text-sm text-white/80">Para X = {fmt(fit.prediction.x)}, Ŷ = {fmt(fit.prediction.yHat)}.{fit.prediction.extrapolation ? ' Está fuera del rango observado.' : ' Está dentro del rango observado.'}</p>
                </Panel>
              )}
              <Panel title="Dispersión y recta" accent={ACCENT}>
                <ScatterFitChart points={chart.points} line={chart.line} accent={ACCENT} />
              </Panel>
              <Panel title="Residuales" accent={ACCENT}>
                <ResidualChart points={chart.residuals} accent={ACCENT} />
              </Panel>
              <Panel title="Interpretación" accent={ACCENT}>
                <div className="space-y-2 text-sm text-white/75">{fit.interpretation.map(line => <p key={line}>{line}</p>)}</div>
              </Panel>
            </div>
          ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Modifica la tabla y pulsa Calcular recta. Los números de esta pantalla salen de ese cálculo.</p></Panel>
        )}
        {tab === 'pasos' && (fit ? <StepsView steps={fit.steps} accent={ACCENT} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">Calcula primero para ver el procedimiento con tus números.</p></Panel>)}
        {tab === 'teoria' && <TheoryView blocks={simpleTheory} accent={ACCENT} />}
        {tab === 'ejercicios' && (
          <ExerciseList
            accent={ACCENT}
            items={exercisesByTopic('simple')}
            onLoad={exercise => {
              const preset = exercise.preset as SimplePreset;
              setRows(preset.rows.map(row => row.slice()));
              setPredict(preset.predict);
              setNotice(exercise.givenModelNote ?? '');
              setResult(null);
              setIssues([]);
              setTab('resultados');
            }}
          />
        )}
        {tab === 'practicar' && (
          fit ? (
            <PracticeForm
              accent={ACCENT}
              questions={questionsFromSimple(fit)}
              solution={fit.steps.map((step, i) => `${i + 1}. ${step.title}. ${step.body}`).join('\n\n')}
            />
          ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Calcula la recta. Después, en esta pestaña, responde sin copiar los resultados: la comprobación usa el modelo, no el botón.</p></Panel>
        )}
        {tab === 'codigo' && (
          <CodePanel
            accent={ACCENT}
            source={simpleSource}
            deps="Ninguna librería de modelos. Solo aritmética de JavaScript."
            relation="b1 = Sxy/Sxx y b0 = ȳ − b1 x̄ están en fitSimpleLinear. La gráfica usa la misma pendiente e intercepto, no una recta dibujada aparte."
            guide={[
              { name: 'fitSimpleLinear', role: 'Ajusta la recta, los residuales, R² y la predicción.', input: 'Vectores X e Y y, si se pide, un x nuevo.', output: 'SimpleFit o una lista de errores.' },
              { name: 'seriesForChart', role: 'Arma los puntos y la recta que ve el estudiante.', input: 'El ajuste ya calculado.', output: 'Series para la dispersión y los residuales.' },
            ]}
            onRun={() => {
              const parsed = readTable(rows, predict);
              if (parsed.errors.length) return parsed.errors.join('\n');
              const ran = fitSimpleLinear(parsed.xs, parsed.ys, parsed.x0);
              if (!ran.ok) return ran.errors.join('\n');
              return `${ran.fit.equation}\nR² = ${ran.fit.r2 === null ? 'no definido' : fmt(ran.fit.r2)}\nSSE = ${fmt(ran.fit.sse)}`;
            }}
          />
        )}
      </div>
    </ModuleShell>
  );
};
