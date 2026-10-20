import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';

export const Formula: React.FC<{ latex: string; block?: boolean }> = ({ latex, block = false }) => (
  block ? <BlockMath math={latex} /> : <InlineMath math={latex} />
);

export const Tabs: React.FC<{
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  accent: string;
}> = ({ tabs, value, onChange, accent }) => (
  <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
    {tabs.map(tab => {
      const active = tab.id === value;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{
            background: active ? accent : 'rgba(255,255,255,0.04)',
            color: active ? 'white' : 'rgba(255,255,255,0.55)',
            border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
