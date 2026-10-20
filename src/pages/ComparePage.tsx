import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ModuleShell, Panel } from '../components/ui/ModuleShell';
import { comparisonRows } from '../content/theory';

const ACCENT = '#38bdf8';

export const ComparePage: React.FC = () => {
  const [target, setTarget] = useState<'numero' | 'clase'>('numero');
  const [count, setCount] = useState<'una' | 'varias'>('una');
  const [shape, setShape] = useState<'lineal' | 'reglas' | 'nose'>('lineal');
  const [probability, setProbability] = useState(false);

  let recommendation = { title: 'Regresión lineal simple', path: '/regresion-simple', why: 'La respuesta es numérica, hay una sola explicativa y la forma que buscas es una recta.' };
  if (target === 'clase' && probability) {
    recommendation = { title: 'Regresión logística', path: '/regresion-logistica', why: 'Necesitas una probabilidad de clase. La logística la estima y el umbral la convierte en una etiqueta.' };
  } else if (target === 'clase' && (shape === 'reglas' || shape === 'nose')) {
    recommendation = { title: 'Árbol de decisión', path: '/arboles', why: 'La respuesta es una clase y te interesan reglas legibles, con variables numéricas o categóricas.' };
  } else if (target === 'clase') {
    recommendation = { title: 'Regresión logística', path: '/regresion-logistica', why: 'Una frontera lineal en la combinación z separa dos clases y además entrega una probabilidad.' };
  } else if (count === 'varias') {
    recommendation = { title: 'Regresión lineal múltiple', path: '/regresion-multiple', why: 'Hay varias explicativas numéricas y la respuesta es un número. Cada coeficiente se lee con las demás fijas.' };
  }

  return (
    <ModuleShell title="Comparación de técnicas" accent={ACCENT} sidebar={<Panel title="Para qué sirve cada una" accent={ACCENT}><p className="text-sm text-white/65 leading-relaxed">Esta pantalla no calcula un modelo ficticio. Resume las diferencias del curso y sugiere por dónde empezar según el tipo de problema.</p></Panel>}>
      <div className="space-y-4">
        <Panel title="Dónde encaja cada técnica" accent={ACCENT}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40">
                  {['', 'Lineal simple', 'Lineal múltiple', 'Logística', 'Árbol'].map(header => <th key={header} className="py-2 pr-3">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(row => (
                  <tr key={row.aspect} className="border-t border-white/5 text-white/75">
                    <th className="py-2 pr-3 text-white">{row.aspect}</th>
                    <td className="pr-3">{row.simple}</td>
                    <td className="pr-3">{row.multiple}</td>
                    <td className="pr-3">{row.logistic}</td>
                    <td>{row.tree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Elegir por el problema" accent={ACCENT}>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <label className="text-white/60">Respuesta
              <select className="mt-1 w-full bg-transparent border border-white/15 rounded-lg px-2 py-2 text-white" value={target} onChange={e => setTarget(e.target.value as 'numero' | 'clase')}>
                <option value="numero">Numérica</option>
                <option value="clase">Una clase</option>
              </select>
            </label>
            <label className="text-white/60">Explicativas
              <select className="mt-1 w-full bg-transparent border border-white/15 rounded-lg px-2 py-2 text-white" value={count} onChange={e => setCount(e.target.value as 'una' | 'varias')}>
                <option value="una">Una</option>
                <option value="varias">Varias</option>
              </select>
            </label>
            <label className="text-white/60">Forma que buscas
              <select className="mt-1 w-full bg-transparent border border-white/15 rounded-lg px-2 py-2 text-white" value={shape} onChange={e => setShape(e.target.value as 'lineal' | 'reglas' | 'nose')}>
                <option value="lineal">Relación lineal</option>
                <option value="reglas">Reglas si-entonces</option>
                <option value="nose">No lo sé</option>
              </select>
            </label>
            <label className="text-white/70 flex items-center gap-2 mt-6">
              <input type="checkbox" checked={probability} onChange={e => setProbability(e.target.checked)} />
              Necesito una probabilidad
            </label>
          </div>
          <div className="mt-4 rounded-xl p-3" style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}33` }}>
            <p className="text-sm font-black text-white">{recommendation.title}</p>
            <p className="text-sm text-white/70 mt-1">{recommendation.why}</p>
            <Link to={recommendation.path} className="inline-block mt-3 text-xs font-black no-underline" style={{ color: ACCENT }}>Abrir el módulo</Link>
          </div>
        </Panel>
      </div>
    </ModuleShell>
  );
};
