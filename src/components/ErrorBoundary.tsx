import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#060810' }}>
          <div className="max-w-lg rounded-2xl p-6" style={{ background: 'rgba(8,10,20,0.9)', border: '1px solid rgba(244,63,94,0.35)' }}>
            <h1 className="text-lg font-black text-white mb-2">La pantalla encontró un error</h1>
            <p className="text-sm text-white/60 mb-4">{this.state.error.message}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#6366f1' }}
              onClick={() => this.setState({ error: null })}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
