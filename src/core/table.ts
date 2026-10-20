/** Operaciones puras de la tabla editable, comprobadas sin navegador. */

export function addRow(rows: string[][], width: number): string[][] {
  return [...rows, Array.from({ length: width }, () => '')];
}

export function removeRow(rows: string[][], index: number): string[][] {
  if (rows.length <= 1) return rows.map(row => row.slice());
  return rows.filter((_, i) => i !== index).map(row => row.slice());
}

export function updateCell(rows: string[][], row: number, col: number, value: string): string[][] {
  return rows.map((cells, i) => (i === row ? cells.map((cell, j) => (j === col ? value : cell)) : cells.slice()));
}

export function addColumn(rows: string[][], index: number): string[][] {
  return rows.map(row => {
    const next = row.slice();
    next.splice(index, 0, '');
    return next;
  });
}

export function removeColumn(rows: string[][], index: number): string[][] {
  return rows.map(row => row.filter((_, j) => j !== index));
}
