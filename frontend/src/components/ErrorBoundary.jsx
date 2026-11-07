import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      const isKm = true;
      return (
        <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none">
          {/* Subtle Ambient Background */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
            {/* Top Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
              {isKm ? 'មានបញ្ហាបច្ចេកទេសមួយចំនួន' : 'Something went wrong'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              {isKm 
                ? 'កម្មវិធីបានជួបប្រទះបញ្ហាមិនរំពឹងទុក។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីដំណើរការឡើងវិញ។' 
                : 'The application encountered an unexpected issue. Please click below to reload.'}
            </p>

            {/* Error detail (collapsed or small) */}
            {this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-left font-mono text-[11px] text-rose-300 break-words overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isKm ? 'ដំណើរការឡើងវិញ' : 'Reload App'}</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 active:scale-95 transition cursor-pointer"
                title={isKm ? 'សម្អាតទិន្នន័យចាស់ ហើយចូលថ្មី' : 'Clear cache & reset'}
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>{isKm ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
