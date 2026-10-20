import React from 'react';
import {
  CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from 'recharts';

const tip = { background: '#0c1020', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 };

export const ScatterFitChart: React.FC<{
  points: { x: number; y: number }[];
  line?: { x: number; y: number }[];
  accent: string;
  xLabel?: string;
  yLabel?: string;
}> = ({ points, line, accent, xLabel = 'X', yLabel = 'Y' }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="x" type="number" name={xLabel} stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
        <YAxis dataKey="y" type="number" name={yLabel} stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
        <Tooltip contentStyle={tip} />
        <Scatter data={points} dataKey="y" name="Observado" fill={accent} />
        {line && <Line data={line} dataKey="y" name="Recta ajustada" stroke="#34d399" dot={false} strokeWidth={2} />}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

export const ResidualChart: React.FC<{ points: { x: number; y: number }[]; accent: string }> = ({ points, accent }) => (
  <div className="h-56 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="x" type="number" stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
        <YAxis dataKey="y" type="number" stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
        <Tooltip contentStyle={tip} />
        <Line data={[{ x: Math.min(...points.map(p => p.x)), y: 0 }, { x: Math.max(...points.map(p => p.x)), y: 0 }]} dataKey="y" stroke="rgba(255,255,255,0.25)" dot={false} />
        <Scatter data={points} dataKey="y" name="Residual" fill={accent} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

export const ProbabilityChart: React.FC<{
  curve?: { x: number; y: number }[];
  points: { x: number; y: number }[];
  accent: string;
}> = ({ curve, points, accent }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="x" type="number" stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} domain={['auto', 'auto']} />
        <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="rgba(255,255,255,0.35)" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
        <Tooltip contentStyle={tip} />
        {curve && <Line data={curve} dataKey="y" name="Sigmoide" stroke="#34d399" dot={false} strokeWidth={2} />}
        <Scatter data={points} dataKey="y" name="Probabilidad" fill={accent} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
