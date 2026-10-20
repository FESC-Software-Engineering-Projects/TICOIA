import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleShell, Panel } from '../components/ui/ModuleShell';
import { PracticeForm } from '../components/learn/Panels';
import { exercises, type Topic } from '../content/exercises';

const ACCENT = '#fb7185';
const paths: Record<Topic, string> = {
  simple: '/regresion-simple',
  multiple: '/regresion-multiple',
  logistic: '/regresion-logistica',
  tree: '/arboles',
};

export const LabPage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | 'todos'>('todos');
  const [id, setId] = useState(exercises[0].id);
  const visible = useMemo(() => exercises.filter(item => topic === 'todos' || item.topic === topic), [topic]);
  const current = visible.find(item => item.id === id) ?? visible[0];

  return (
    <ModuleShell
      title="Laboratorio"
      accent={ACCENT}
      sidebar={(
        <Panel title="Ejercicio" accent={ACCENT}>
          <label className="text-[10px] text-white/40">Tema
            <select className="mt-1 w-full bg-transparent border border-white/15 rounded-lg px-2 py-2 text-white text-sm" value={topic} onChange={e => setTopic(e.target.value as Topic | 'todos')}>
              <option value="todos">Los cuatro</option>
              <option value="simple">Regresión simple</option>
              <option value="multiple">Regresión múltiple</option>
              <option value="logistic">Regresión logística</option>
              <option value="tree">Árboles</option>
            </select>
          </label>
          <div className="mt-3 space-y-1">
            {visible.map(item => (
              <button key={item.id} type="button" onClick={() => setId(item.id)} className="w-full text-left px-2 py-2 rounded-lg text-xs" style={{ background: current?.id === item.id ? `${ACCENT}22` : 'transparent', color: 'white' }}>
                {item.code} {item.title}
              </button>
            ))}
          </div>
        </Panel>
      )}
    >
      {current && (
        <div className="space-y-3">
          <Panel title={`${current.code} · ${current.title}`} accent={ACCENT}>
            <p className="text-sm text-white/75 leading-relaxed">{current.statement}</p>
            <p className="text-xs text-white/45 mt-2">Resuelve con los datos del enunciado. La comprobación compara tu número o tu clase con el resultado verificado; pulsar el botón no marca la respuesta como correcta.</p>
            {current.givenModelNote && <p className="text-xs text-amber-200/80 mt-2">{current.givenModelNote}</p>}
            <button
              type="button"
              className="mt-3 px-3 py-2 rounded-xl text-xs font-black"
              style={{ background: ACCENT }}
              onClick={() => navigate(paths[current.topic], { state: { preset: current.preset, notice: current.givenModelNote ?? '' } })}
            >
              Cargar los datos en la calculadora
            </button>
          </Panel>
          <PracticeForm
            key={current.id}
            accent={ACCENT}
            questions={current.questions}
            solution={current.steps.map((step, index) => `${index + 1}. ${step.title}. ${step.body}`).join('\n\n') + `\n\n${current.result}\n\n${current.interpretation}`}
          />
        </div>
      )}
    </ModuleShell>
  );
};
