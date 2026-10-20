import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { inputClass } from './ModuleShell';

export const DataGrid: React.FC<{
  columns: { label: string; onRename?: (value: string) => void; kind?: React.ReactNode }[];
  rows: string[][];
  accent: string;
  onCell: (row: number, col: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (row: number) => void;
}> = ({ columns, rows, accent, onCell, onAddRow, onRemoveRow }) => (
  <div className="space-y-2">
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-1 text-xs">
        <thead>
          <tr>
            <th className="text-white/30 font-bold w-8">#</th>
            {columns.map((col, j) => (
              <th key={j} className="px-1 font-bold text-left" style={{ color: accent }}>
                {col.onRename ? (
                  <input
                    aria-label={`Nombre de la columna ${j + 1}`}
                    className={inputClass}
                    value={col.label}
                    onChange={e => col.onRename?.(e.target.value)}
                  />
                ) : col.label}
                {col.kind}
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="text-white/30 text-center">{i + 1}</td>
              {columns.map((_, j) => (
                <td key={j} className="px-1">
                  <input
                    aria-label={`Fila ${i + 1}, columna ${j + 1}`}
                    className={inputClass}
                    value={row[j] ?? ''}
                    onChange={e => onCell(i, j, e.target.value)}
                  />
                </td>
              ))}
              <td>
                <button
                  type="button"
                  aria-label={`Eliminar fila ${i + 1}`}
                  onClick={() => onRemoveRow(i)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-rose-300"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={onAddRow}
      className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1.5 rounded-lg"
      style={{ color: accent, background: `${accent}18` }}
    >
      <Plus size={13} /> Agregar fila
    </button>
  </div>
);
