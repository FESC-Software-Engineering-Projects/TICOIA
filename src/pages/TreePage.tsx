import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { ModuleShell, Panel, inputClass } from '../components/ui/ModuleShell';
import { DataGrid } from '../components/ui/DataGrid';
import { GhostButton, HintBanner, SolveButton, ValidationList } from '../components/ui/Chrome';
import { Tabs } from '../components/ui/Formula';
import { TreeDiagram } from '../components/charts/TreeDiagram';
import { CodePanel, ExerciseList, MetricGrid, PlainTable, PracticeForm, StepsView, TheoryView } from '../components/learn/Panels';
import { exercisesByTopic, type TreePreset } from '../content/exercises';
import { treeTheory } from '../content/theory';
import { questionsFromTree } from '../content/liveQuestions';
import { fmt, parseNumberCell } from '../core/format';
import { fitDecisionTree, inferKind, predictOne, type Kind, type TreeOptions, type TreeResult } from '../core/decisionTree';
import { addColumn, addRow, removeColumn, removeRow, updateCell } from '../core/table';
import treeSource from '../core/decisionTree.ts?raw';

const ACCENT = '#fbbf24';
const TABS = [
  { id: 'resultados', label: 'Resultados' },
  { id: 'pasos', label: 'Paso a paso' },
  { id: 'teoria', label: 'Teoría' },
  { id: 'ejercicios', label: 'Ejercicios' },
  { id: 'practicar', label: 'Practicar' },
  { id: 'codigo', label: 'Implementación en código' },
];

const exampleNames = ['Edad', 'Ingreso', 'Estudiante'];
const exampleKinds: Kind[] = ['categorical', 'categorical', 'categorical'];
const exampleRows = [
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
];

const defaultOptions = (): TreeOptions => ({ criterion: 'entropy', maxDepth: 6, minSamplesSplit: 2, minSamplesLeaf: 1, seed: null });

export const TreePage: React.FC = () => {
  const location = useLocation();
  const [names, setNames] = useState(exampleNames.slice());
  const [kinds, setKinds] = useState<Kind[]>(exampleKinds.slice());
  const [rows, setRows] = useState(exampleRows.map(row => row.slice()));
  const [options, setOptions] = useState<TreeOptions>(defaultOptions());
  const [seedText, setSeedText] = useState('');
  const [predict, setPredict] = useState(['Joven', 'Bajo', 'Sí']);
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState('resultados');
  const [issues, setIssues] = useState<string[]>([]);
  const [result, setResult] = useState<TreeResult | null>(null);
  const [notice, setNotice] = useState('');

  const touch = (next: string[][]) => { setRows(next); setResult(null); };

  useEffect(() => {
    const state = location.state as { preset?: TreePreset; notice?: string } | null;
    if (state?.preset?.topic === 'tree') {
      setNames(state.preset.names.slice());
      setKinds(state.preset.kinds.slice());
      setRows(state.preset.rows.map(row => row.slice()));
      setOptions(state.preset.options);
      setSeedText(state.preset.options.seed === null ? '' : String(state.preset.options.seed));
      setPredict(state.preset.rows[0]?.slice(0, state.preset.names.length) ?? []);
      setNotice(state.notice ?? '');
      setResult(null);
      setTab('resultados');
    }
  }, [location.state]);

  const solve = () => {
    const errors: string[] = [];
    if (names.some(name => !name.trim())) errors.push('Cada variable necesita un nombre.');
    const features = rows.map(row => row.slice(0, names.length));
    const y = rows.map(row => (row[names.length] ?? '').trim());
    const resolved = names.map((_, index) => kinds[index] ?? inferKind(features.map(row => row[index] ?? '')));
    let seed: number | null = null;
    if (seedText.trim()) {
      const parsed = parseNumberCell(seedText);
      if (parsed === null || !Number.isInteger(parsed)) errors.push('La semilla debe ser un entero. Déjala vacía para desempatar siempre de la misma forma.');
      else seed = parsed;
    }
    const opts = { ...options, seed };
    if (errors.length) { setIssues(errors); setResult(null); return; }
    const trained = fitDecisionTree(features, y, names, resolved, opts);
    setIssues(trained.ok ? [] : trained.errors);
    setResult(trained);
    setTab('resultados');
  };

  const fit = result?.ok ? result.fit : null;
  const activePath = fit ? predictOne(fit.tree, rows[selected]?.slice(0, names.length) ?? predict, names) : null;
  const manual = fit ? predictOne(fit.tree, predict, names) : null;

  return (
    <ModuleShell
      title="Árboles de decisión"
      accent={ACCENT}
      sidebarBasisRem={34}
      sidebar={(
        <>
          <Panel title="Criterios de parada" accent={ACCENT}>
            <label className="text-[10px] text-white/40 block mb-2">Criterio
              <select className={`${inputClass} mt-1`} value={options.criterion} onChange={e => { setOptions({ ...options, criterion: e.target.value as TreeOptions['criterion'] }); setResult(null); }}>
                <option value="entropy">Entropía (ganancia)</option>
                <option value="gini">Gini</option>
              </select>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] text-white/40">Profundidad
                <input className={`${inputClass} mt-1`} value={options.maxDepth} onChange={e => setOptions({ ...options, maxDepth: Number(e.target.value) })} />
              </label>
              <label className="text-[10px] text-white/40">Mín. para dividir
                <input className={`${inputClass} mt-1`} value={options.minSamplesSplit} onChange={e => setOptions({ ...options, minSamplesSplit: Number(e.target.value) })} />
              </label>
              <label className="text-[10px] text-white/40">Mín. por hoja
                <input className={`${inputClass} mt-1`} value={options.minSamplesLeaf} onChange={e => setOptions({ ...options, minSamplesLeaf: Number(e.target.value) })} />
              </label>
            </div>
            <label className="text-[10px] text-white/40 block mt-2">Semilla (solo si hay empate)
              <input className={`${inputClass} mt-1`} value={seedText} onChange={e => { setSeedText(e.target.value); setResult(null); }} placeholder="Vacía = determinista" />
            </label>
          </Panel>
          <Panel title="Tabla" accent={ACCENT}>
            <div className="flex gap-2 mb-2">
              <button type="button" className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: ACCENT, background: `${ACCENT}18` }} onClick={() => {
                if (names.length >= 8) return;
                setNames([...names, `x${names.length + 1}`]);
                setKinds([...kinds, 'categorical']);
                setRows(addColumn(rows, names.length));
                setPredict([...predict, '']);
                setResult(null);
              }}><Plus size={12} className="inline" /> Variable</button>
              <button type="button" className="text-[11px] font-bold text-white/60" onClick={() => {
                if (names.length <= 1) return;
                setNames(names.slice(0, -1));
                setKinds(kinds.slice(0, -1));
                setRows(removeColumn(rows, names.length - 1));
                setPredict(predict.slice(0, -1));
                setResult(null);
              }}><Trash2 size={12} className="inline" /> Quitar última</button>
            </div>
            <DataGrid
              accent={ACCENT}
              columns={[
                ...names.map((name, index) => ({
                  label: name,
                  onRename: (value: string) => setNames(names.map((item, j) => j === index ? value : item)),
                  kind: (
                    <select
                      className="mt-1 w-full text-[10px] bg-transparent text-white/50"
                      value={kinds[index]}
                      onChange={e => {
                        const next = kinds.slice();
                        next[index] = e.target.value as Kind;
                        setKinds(next);
                        setResult(null);
                      }}
                    >
                      <option value="categorical">Categórica</option>
                      <option value="numeric">Numérica</option>
                    </select>
                  ),
                })),
                { label: 'Clase' },
              ]}
              rows={rows}
              onCell={(r, c, value) => touch(updateCell(rows, r, c, value))}
              onAddRow={() => touch(addRow(rows, names.length + 1))}
              onRemoveRow={index => touch(removeRow(rows, index))}
            />
          </Panel>
          <SolveButton label="Entrenar árbol" accent={ACCENT} onClick={solve} />
          <GhostButton label="Cargar clientes e ID3" onClick={() => {
            setNames(exampleNames.slice()); setKinds(exampleKinds.slice()); setRows(exampleRows.map(r => r.slice()));
            setOptions(defaultOptions()); setPredict(['Joven', 'Bajo', 'Sí']); setResult(null); setNotice(''); setIssues([]);
          }} />
          <ValidationList issues={issues} />
          {notice && <HintBanner accent="#fbbf24">{notice}</HintBanner>}
        </>
      )}
    >
      <div className="space-y-4">
        <Tabs tabs={TABS} value={tab} onChange={setTab} accent={ACCENT} />
        {tab === 'resultados' && (fit ? (
          <div className="space-y-3">
            <MetricGrid items={[
              { label: 'Criterio', value: fit.criterion === 'gini' ? 'Gini' : 'Entropía' },
              { label: 'Raíz', value: fit.tree.feature ?? 'Hoja' },
              { label: 'Exactitud', value: fit.accuracy === null ? '—' : fmt(fit.accuracy, 4) },
              { label: 'Clases', value: fit.labels.join(', ') },
            ]} />
            <Panel title="Árbol entrenado" accent={ACCENT}>
              <div className="overflow-x-auto custom-scrollbar pb-2">
                <TreeDiagram node={fit.tree} active={(manual ?? activePath)?.path.map(step => step.nodeId) ?? []} accent={ACCENT} />
              </div>
            </Panel>
            <Panel title="Matriz de confusión" accent={ACCENT}>
              <PlainTable
                headers={['Real \\ Predicho', ...fit.labels]}
                rows={fit.labels.map((label, i) => [label, ...fit.confusion[i]])}
              />
            </Panel>
            <Panel title="Predicciones de entrenamiento" accent={ACCENT}>
              <PlainTable
                headers={['#', ...names, 'Real', 'Predicha']}
                rows={rows.map((row, i) => [i + 1, ...row.slice(0, names.length), row[names.length], fit.predictions[i]])}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {rows.map((_, i) => (
                  <button key={i} type="button" onClick={() => setSelected(i)} className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: selected === i ? ACCENT : 'rgba(255,255,255,0.05)', color: 'white' }}>
                    Fila {i + 1}
                  </button>
                ))}
              </div>
              {activePath && (
                <ol className="mt-3 space-y-1 text-sm text-white/75">
                  {activePath.path.map(step => <li key={step.text}>{step.text}</li>)}
                </ol>
              )}
            </Panel>
            <Panel title="Registro nuevo" accent={ACCENT}>
              <div className="grid grid-cols-2 gap-2">
                {names.map((name, index) => (
                  <label key={name + index} className="text-[10px] text-white/40">{name}
                    <input className={`${inputClass} mt-1`} value={predict[index] ?? ''} onChange={e => {
                      const next = predict.slice();
                      next[index] = e.target.value;
                      setPredict(next);
                    }} />
                  </label>
                ))}
              </div>
              {manual && (
                <div className="mt-3 text-sm text-white/80">
                  <p className="font-black">Clase: {manual.label}</p>
                  {manual.warning && <p className="text-amber-200/80 text-xs mt-1">{manual.warning}</p>}
                  <ol className="mt-2 space-y-1 text-white/70">{manual.path.map(step => <li key={step.text}>{step.text}</li>)}</ol>
                </div>
              )}
            </Panel>
            <Panel title="Interpretación" accent={ACCENT}>
              {fit.interpretation.map(line => <p key={line} className="text-sm text-white/75 mb-2">{line}</p>)}
            </Panel>
          </div>
        ) : <Panel accent={ACCENT}><p className="text-sm text-white/60">Entrena el árbol con la tabla de la izquierda. El dibujo corresponde a ese entrenamiento.</p></Panel>)}
        {tab === 'pasos' && (fit ? <StepsView steps={fit.steps} accent={ACCENT} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">Los cortes comparados aparecen después de entrenar.</p></Panel>)}
        {tab === 'teoria' && <TheoryView blocks={treeTheory} accent={ACCENT} />}
        {tab === 'ejercicios' && (
          <ExerciseList
            accent={ACCENT}
            items={exercisesByTopic('tree')}
            onLoad={exercise => {
              const preset = exercise.preset as TreePreset;
              setNames(preset.names.slice());
              setKinds(preset.kinds.slice());
              setRows(preset.rows.map(row => row.slice()));
              setOptions(preset.options);
              setPredict(preset.rows[0].slice(0, preset.names.length));
              setNotice(exercise.givenModelNote ?? '');
              setResult(null);
              setTab('resultados');
            }}
          />
        )}
        {tab === 'practicar' && (fit ? <PracticeForm accent={ACCENT} questions={questionsFromTree(fit)} solution={fit.steps.map((s, i) => `${i + 1}. ${s.title}. ${s.body}`).join('\n\n')} /> : <Panel accent={ACCENT}><p className="text-sm text-white/60">Entrena el árbol para comprobar la raíz, el umbral y las clases.</p></Panel>)}
        {tab === 'codigo' && (
          <CodePanel
            accent={ACCENT}
            source={treeSource}
            deps="Ninguna librería de aprendizaje automático. El árbol se construye en decisionTree.ts."
            relation="La entropía y el Gini están en funciones distintas. El dibujo recorre el objeto que devuelve fitDecisionTree; no es un esquema fijo."
            guide={[
              { name: 'entropy / gini', role: 'Miden la mezcla de clases de un nodo.', input: 'Conteos y tamaño.', output: 'Un número: 0 si el nodo es puro.' },
              { name: 'fitDecisionTree', role: 'Prueba divisiones y se detiene según profundidad y tamaños.', input: 'Tabla, clases, tipos de variable y opciones.', output: 'Árbol, traza, predicciones y matriz de confusión.' },
              { name: 'predictOne', role: 'Recorre la raíz hasta una hoja.', input: 'Árbol y valores de un registro.', output: 'Clase y explicación de cada rama.' },
            ]}
            onRun={() => {
              const features = rows.map(row => row.slice(0, names.length));
              const y = rows.map(row => (row[names.length] ?? '').trim());
              const ran = fitDecisionTree(features, y, names, kinds, { ...options, seed: seedText.trim() ? Number(seedText) : null });
              if (!ran.ok) return ran.errors.join('\n');
              return `Raíz: ${ran.fit.tree.feature ?? 'hoja'}\nExactitud: ${ran.fit.accuracy}\nPrimera predicción: ${ran.fit.predictions[0]}`;
            }}
          />
        )}
      </div>
    </ModuleShell>
  );
};
