import React from 'react';
import { Loader2, Play, RotateCcw } from 'lucide-react';

export const ValidationList: React.FC<{ issues: string[] }> = ({ issues }) => {
  const items = issues.filter((v, i, a) => v && a.indexOf(v) === i);
  if (!items.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 space-y-1" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300/80">Revisa estos datos</p>
      <ul className="space-y-1">
        {items.slice(0, 8).map(msg => (
          <li key={msg} className="text-xs text-rose-100/85 leading-snug flex gap-1.5">
            <span className="text-rose-400 shrink-0">•</span>
            <span>{msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SolveButton: React.FC<{ label: string; accent?: string; onClick: () => void }> = ({ label, accent = '#6366f1', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black"
    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: 'white' }}
  >
    <Play size={16} /> {label}
  </button>
);

export const GhostButton: React.FC<{ label: string; onClick: () => void; icon?: React.ReactNode }> = ({ label, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
  >
    {icon ?? <RotateCcw size={13} />} {label}
  </button>
);

export const HintBanner: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent = '#818cf8' }) => (
  <div className="rounded-xl px-3 py-2 text-[11px] leading-relaxed text-white/60" style={{ background: `${accent}14`, border: `1px solid ${accent}33` }}>
    {children}
  </div>
);

export const BusyNote: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-[11px] text-white/40"><Loader2 size={12} className="animate-spin" /> Calculando</span>
);
