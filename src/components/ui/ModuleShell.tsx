import React, { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  unit?: string;
  accent: string;
  sidebar: ReactNode;
  children: ReactNode;
  sidebarBasisRem?: number;
}

export const ModuleShell: React.FC<Props> = ({
  title,
  unit = 'Inteligencia artificial',
  accent,
  sidebar,
  children,
  sidebarBasisRem = 24,
}) => {
  const basis = Math.min(48, Math.max(18, sidebarBasisRem));
  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #060810 0%, #0d1020 45%, #0a0e1a 75%, #050810 100%)' }}
    >
      <header
        className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(6,8,16,0.7)', backdropFilter: 'blur(12px)' }}
      >
        <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold shrink-0">
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Panel principal</span>
        </Link>
        <h1 className="text-sm font-extrabold text-white text-center truncate min-w-0 flex-1">{title}</h1>
        <div className="text-xs text-white/25 font-semibold shrink-0 hidden sm:block w-36 text-right">{unit}</div>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-5 px-3 sm:px-4 md:px-5 py-4 md:py-5 lg:min-h-0 lg:overflow-hidden">
        <aside
          className="@container/sidebar w-full flex flex-col gap-4 max-h-[min(72vh,44rem)] lg:max-h-none overflow-y-auto lg:shrink-0 lg:min-w-[18rem] lg:w-[clamp(18rem,var(--ia-sidebar),min(42rem,46vw))]"
          style={{ ['--ia-sidebar' as string]: `${basis}rem`, scrollbarWidth: 'thin', scrollbarColor: `${accent}40 transparent` }}
        >
          {sidebar}
        </aside>
        <main className="flex-1 min-w-0 lg:min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${accent}40 transparent` }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export const glass: CSSProperties = {
  background: 'rgba(8,10,20,0.88)',
  border: '1px solid rgba(255,255,255,0.07)',
};

export const inputClass =
  'bg-transparent border border-white/15 rounded-lg text-white text-center text-sm font-mono py-1.5 px-2 outline-none focus:border-indigo-400 transition-colors w-full';

export const Panel: React.FC<{ title?: string; children: ReactNode; accent?: string; className?: string }> = ({
  title, children, accent = '#818cf8', className = '',
}) => (
  <section className={`rounded-2xl p-4 ${className}`} style={glass}>
    {title && <h3 className="text-[11px] font-black tracking-widest uppercase mb-3" style={{ color: accent }}>{title}</h3>}
    {children}
  </section>
);
