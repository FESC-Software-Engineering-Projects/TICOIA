import React from 'react';
import type { TreeNode } from '../../core/decisionTree';
import { fmt } from '../../core/format';

export const TreeDiagram: React.FC<{ node: TreeNode; active: number[]; accent: string }> = ({ node, active, accent }) => {
  const onPath = active.includes(node.id);
  const leaf = node.branches.length === 0;
  return (
    <div className="flex flex-col items-center min-w-[9rem]">
      <div
        className="rounded-xl px-3 py-2 text-center w-full"
        style={{
          background: onPath ? `${accent}22` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${onPath ? accent : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/35">{leaf ? 'Hoja' : 'Pregunta'}</p>
        <p className="text-xs font-black text-white">{leaf ? node.prediction : node.feature}</p>
        <p className="text-[10px] text-white/50 mt-1">
          {Object.entries(node.counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </p>
        <p className="text-[10px] text-white/35">n = {node.samples} · impureza {fmt(node.impurity, 3)}</p>
      </div>
      {node.branches.length > 0 && (
        <div className="flex gap-3 mt-3 items-start">
          {node.branches.map(branch => (
            <div key={branch.label} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-white/55 text-center max-w-[9rem]">{branch.label}</span>
              <TreeDiagram node={branch.child} active={active} accent={accent} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
