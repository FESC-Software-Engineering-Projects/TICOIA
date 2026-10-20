import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, GitBranch, LineChart, Sigma, Star, Spline } from 'lucide-react';

const BG = ['β', 'σ', 'R²', 'ℓ', 'H', 'G', 'ŷ', 'p', 'ε', 'X', 'τ', 'OR'];

const modules = [
  {
    title: 'Regresión lineal simple',
    text: 'Una recta, mínimos cuadrados y una predicción con tus propios puntos.',
    path: '/regresion-simple',
    accent: '#818cf8',
    glow: 'rgba(129,140,248,0.28)',
    icon: LineChart,
    label: '01',
  },
  {
    title: 'Regresión lineal múltiple',
    text: 'Varias variables, matriz de diseño y coeficientes por factorización QR.',
    path: '/regresion-multiple',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    icon: Sigma,
    label: '02',
  },
  {
    title: 'Regresión logística',
    text: 'Probabilidades, sigmoide, umbral y entrenamiento por máxima verosimilitud.',
    path: '/regresion-logistica',
    accent: '#c084fc',
    glow: 'rgba(192,132,252,0.25)',
    icon: Spline,
    label: '03',
  },
  {
    title: 'Árboles de decisión',
    text: 'Entropía o Gini, ramas reales y el recorrido hasta la hoja.',
    path: '/arboles',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.22)',
    icon: GitBranch,
    label: '04',
  },
];

export const Dashboard: React.FC = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);
  const floats = BG.map((symbol, i) => ({ symbol, x: 4 + (i % 6) * 16, y: 8 + Math.floor(i / 6) * 42, delay: i * 0.4 }));

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #060810 0%, #0d1020 45%, #0a0e1a 75%, #050810 100%)' }}>
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #34d399, transparent)', filter: 'blur(60px)' }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floats.map(item => (
          <span key={item.symbol + item.x} className="absolute font-black text-white" style={{ left: `${item.x}%`, top: `${item.y}%`, opacity: 0.06, fontSize: 22, animation: `number-float 7s ${item.delay}s ease-in-out infinite` }}>{item.symbol}</span>
        ))}
      </div>
      <header className="relative z-10 text-center px-6 pt-8 pb-4" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-[10px] font-bold tracking-widest uppercase" style={{ background: 'rgba(129,140,248,0.14)', border: '1px solid rgba(129,140,248,0.32)', color: '#c7d2fe' }}>
          <Star size={10} /> Ingeniería de Software · Inteligencia Artificial
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #34d399, #c084fc, #818cf8)', backgroundSize: '200%', animation: 'gradient-x 5s ease infinite' }}>
          Regresión y árboles
        </h1>
        <p className="text-white/50 text-sm max-w-xl mx-auto mt-3">
          Introduce tus datos, ejecuta el modelo, revisa cada cuenta y practica con los doce ejercicios del curso.
        </p>
        <div className="flex justify-center gap-8 mt-4 text-center">
          {[['4', 'Modelos'], ['12', 'Ejercicios'], ['QR', 'Mínimos cuadrados'], ['NR', 'Logística']].map(([value, label]) => (
            <div key={label}>
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/35">{label}</div>
            </div>
          ))}
        </div>
      </header>
      <main className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-8 pb-6 max-w-5xl mx-auto">
        {modules.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="rounded-2xl p-5 no-underline block" style={{ background: 'rgba(8,10,20,0.88)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: `0 8px 30px ${item.glow}` }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${item.accent}22` }}>
                  <Icon color={item.accent} size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-widest" style={{ color: item.accent }}>{item.label}</p>
                  <h2 className="text-lg font-extrabold text-white">{item.title}</h2>
                  <p className="text-xs text-white/45 mt-1">{item.text}</p>
                </div>
                <ChevronRight className="ml-auto shrink-0 text-white/30" size={16} />
              </div>
            </Link>
          );
        })}
      </main>
      <div className="relative z-10 flex flex-wrap justify-center gap-3 px-4 pb-8">
        <Link to="/laboratorio" className="px-4 py-2 rounded-full text-xs font-black no-underline text-white" style={{ background: '#6366f1' }}>Laboratorio de práctica</Link>
        <Link to="/comparacion" className="px-4 py-2 rounded-full text-xs font-bold no-underline text-white/80" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>Comparar técnicas</Link>
      </div>
      <footer className="relative z-10 text-center pb-4 text-[10px] text-white/25">FESC · Inteligencia Artificial · 2026</footer>
    </div>
  );
};
