import React, { useState } from 'react';
import { Formula } from '../ui/Formula';
import { Panel } from '../ui/ModuleShell';
import { gradeAnswer } from '../../core/practice';
import type { Step } from '../../core/format';
import type { TheoryBlock } from '../../content/theory';
import type { Exercise, ExerciseQuestion } from '../../content/exercises';

export const TheoryView: React.FC<{ blocks: TheoryBlock[]; accent: string }> = ({ blocks, accent }) => (
  <div className="space-y-3">
    {blocks.map(block => (
      <Panel key={block.title} title={block.title} accent={accent}>
        <div className="space-y-2 text-sm text-white/75 leading-relaxed">
          {block.paragraphs.map(p => <p key={p}>{p}</p>)}
        </div>
        {block.latex?.map(latex => (
          <div key={latex} className="mt-2 overflow-x-auto"><Formula latex={latex} block /></div>
        ))}
      </Panel>
    ))}
  </div>
);

export const StepsView: React.FC<{ steps: Step[]; accent: string }> = ({ steps, accent }) => (
  <div className="space-y-3">
    {steps.map((step, index) => (
      <Panel key={step.title} title={`${index + 1}. ${step.title}`} accent={accent}>
        <p className="text-sm text-white/75 leading-relaxed">{step.body}</p>
        {step.latex && <div className="mt-2 overflow-x-auto"><Formula latex={step.latex} block /></div>}
      </Panel>
    ))}
  </div>
);

export const MetricGrid: React.FC<{ items: { label: string; value: string }[] }> = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {items.map(item => (
      <div key={item.label} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] uppercase tracking-widest text-white/35">{item.label}</p>
        <p className="text-sm font-black text-white break-words">{item.value}</p>
      </div>
    ))}
  </div>
);

export const PlainTable: React.FC<{ headers: string[]; rows: (string | number)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto custom-scrollbar">
    <table className="w-full text-xs">
      <thead>
        <tr className="text-white/40">
          {headers.map(header => <th key={header} className="text-left font-bold py-1 pr-3">{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-white/5 text-white/80">
            {row.map((cell, j) => <td key={j} className="py-1 pr-3 font-mono">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ExerciseList: React.FC<{
  items: Exercise[];
  accent: string;
  onLoad: (exercise: Exercise) => void;
}> = ({ items, accent, onLoad }) => {
  const [open, setOpen] = useState(items[0]?.id ?? '');
  const current = items.find(item => item.id === open) ?? items[0];
  if (!current) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(item.id)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: item.id === current.id ? accent : 'rgba(255,255,255,0.04)', color: 'white' }}
          >
            {item.code} {item.title}
          </button>
        ))}
      </div>
      <Panel title={`${current.code} · ${current.title}`} accent={accent}>
        <p className="text-sm text-white/75 leading-relaxed">{current.statement}</p>
        <ul className="mt-3 space-y-1 text-sm text-white/70">
          {current.asks.map(ask => <li key={ask}>• {ask}</li>)}
        </ul>
        {current.givenModelNote && <p className="mt-3 text-xs text-amber-200/80 leading-relaxed">{current.givenModelNote}</p>}
        <div className="mt-3 space-y-2">
          {current.formulas.map(latex => <Formula key={latex} latex={latex} block />)}
        </div>
        <div className="mt-4 space-y-3">
          {current.steps.map(step => (
            <div key={step.title}>
              <p className="text-xs font-black text-white">{step.title}</p>
              <p className="text-sm text-white/70 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-bold text-white">{current.result}</p>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">{current.interpretation}</p>
        <button
          type="button"
          onClick={() => onLoad(current)}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-black"
          style={{ background: accent, color: 'white' }}
        >
          Cargar estos datos en la calculadora
        </button>
      </Panel>
    </div>
  );
};

export const PracticeForm: React.FC<{
  questions: ExerciseQuestion[];
  accent: string;
  solution: string;
}> = ({ questions, accent, solution }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Record<string, { correct: boolean; feedback: string }>>({});
  const [hints, setHints] = useState<Record<string, number>>({});
  const [showSolution, setShowSolution] = useState(false);

  const checkOne = (question: ExerciseQuestion) => {
    const graded = gradeAnswer(question.expected, answers[question.id] ?? '', question.tolerance);
    setReports(prev => ({ ...prev, [question.id]: graded }));
  };

  const checkAll = () => {
    const next: typeof reports = {};
    for (const question of questions) next[question.id] = gradeAnswer(question.expected, answers[question.id] ?? '', question.tolerance);
    setReports(next);
  };

  return (
    <div className="space-y-3">
      {questions.map(question => {
        const report = reports[question.id];
        const shown = question.hints.slice(0, hints[question.id] ?? 0);
        return (
          <Panel key={question.id} accent={accent}>
            <p className="text-sm font-bold text-white">{question.prompt}</p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                aria-label={question.prompt}
                value={answers[question.id] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                className="flex-1 bg-transparent border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
              <button type="button" onClick={() => checkOne(question)} className="px-3 py-2 rounded-lg text-xs font-black" style={{ background: accent }}>
                Comprobar
              </button>
              <button
                type="button"
                onClick={() => setHints(prev => ({ ...prev, [question.id]: Math.min(question.hints.length, (prev[question.id] ?? 0) + 1) }))}
                className="px-3 py-2 rounded-lg text-xs font-bold text-white/70"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Pista
              </button>
            </div>
            {shown.map(hint => <p key={hint} className="mt-2 text-xs text-white/55">Pista: {hint}</p>)}
            {report && (
              <p className="mt-2 text-xs leading-relaxed" style={{ color: report.correct ? '#6ee7b7' : '#fda4af' }}>{report.feedback}</p>
            )}
          </Panel>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={checkAll} className="px-4 py-2 rounded-xl text-xs font-black" style={{ background: accent }}>
          Comprobar todas
        </button>
        <button type="button" onClick={() => setShowSolution(v => !v)} className="px-4 py-2 rounded-xl text-xs font-bold text-white/80" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          {showSolution ? 'Ocultar solución' : 'Ver solución paso a paso'}
        </button>
      </div>
      {showSolution && <Panel title="Solución" accent={accent}><p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{solution}</p></Panel>}
    </div>
  );
};

export const CodePanel: React.FC<{
  source: string;
  accent: string;
  guide: { name: string; role: string; input: string; output: string }[];
  deps: string;
  relation: string;
  onRun: () => string;
}> = ({ source, accent, guide, deps, relation, onRun }) => {
  const [output, setOutput] = useState('');
  return (
    <div className="space-y-3">
      <Panel title="Qué hace cada función" accent={accent}>
        <div className="space-y-3">
          {guide.map(item => (
            <div key={item.name}>
              <p className="text-sm font-black text-white">{item.name}</p>
              <p className="text-sm text-white/70">{item.role}</p>
              <p className="text-xs text-white/45">Entrada: {item.input}</p>
              <p className="text-xs text-white/45">Salida: {item.output}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/50">Dependencias: {deps}</p>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">{relation}</p>
      </Panel>
      <Panel title="Demostración con la tabla actual" accent={accent}>
        <p className="text-xs text-white/50 mb-2">Se ejecuta el mismo algoritmo de la calculadora. No se evalúa código escrito en el navegador.</p>
        <button type="button" onClick={() => setOutput(onRun())} className="px-4 py-2 rounded-xl text-xs font-black" style={{ background: accent }}>
          Ejecutar demostración
        </button>
        {output && <pre className="mt-3 text-xs text-emerald-100/90 whitespace-pre-wrap font-mono">{output}</pre>}
      </Panel>
      <Panel title="Código fuente que usa la calculadora" accent={accent}>
        <pre className="text-[11px] leading-relaxed text-white/75 overflow-auto max-h-[32rem] custom-scrollbar font-mono">{source}</pre>
      </Panel>
    </div>
  );
};
