import { parseNumberCell, type Step } from './format';

export interface Graded {
  correct: boolean;
  feedback: string;
}

/** Compara una respuesta con el valor del modelo. No revela la solución. */
export function gradeAnswer(expected: number | string, raw: string, tolerance = 0.02): Graded {
  const text = raw.trim();
  if (!text) return { correct: false, feedback: 'La casilla está vacía. Escribe un resultado antes de comprobar.' };
  if (typeof expected === 'string') {
    const ok = text.toLocaleLowerCase('es') === expected.toLocaleLowerCase('es');
    return ok
      ? { correct: true, feedback: 'Correcto. Coincide con la clase o el atributo que produce el modelo.' }
      : { correct: false, feedback: 'No coincide con la salida del modelo. Revisa el recorrido desde la raíz o el nombre exacto de la clase, incluidos acentos y mayúsculas solo si cambian la palabra.' };
  }
  const value = parseNumberCell(text);
  if (value === null) {
    return { correct: false, feedback: 'Eso no es un número válido. Usa dígitos y, si hace falta, un punto o una coma decimal.' };
  }
  const scale = Math.max(1, Math.abs(expected));
  const diff = value - expected;
  if (Math.abs(diff) <= Math.max(tolerance, 0.005 * scale)) {
    return { correct: true, feedback: 'Correcto. La diferencia cabe en la tolerancia de redondeo.' };
  }
  if (expected !== 0 && value !== 0 && Math.sign(value) !== Math.sign(expected)) {
    return { correct: false, feedback: 'El signo no coincide. Revisa si la relación es directa o inversa y el orden de la resta en las sumas centradas.' };
  }
  if (Math.abs(diff) <= 0.08 * scale) {
    return { correct: false, feedback: 'Estás cerca. Revisa un redondeo intermedio o si olvidaste dividir entre n al final.' };
  }
  return { correct: false, feedback: 'El valor se aleja del cálculo del modelo. Vuelve a la fórmula de la pista y recalcula las sumas con los datos de la tabla; no sustituyas el resultado por un número fijo.' };
}

export function revealSolution(steps: Step[]): string {
  return steps.map((step, i) => `${i + 1}. ${step.title}. ${step.body}`).join('\n\n');
}
