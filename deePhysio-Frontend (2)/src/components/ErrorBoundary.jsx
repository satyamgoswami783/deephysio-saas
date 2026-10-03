import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-sm">
              <FaExclamationTriangle size={28} />
            </div>
            
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
              This section encountered a temporary display issue. You can reload the page or return to the dashboard.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left overflow-x-auto">
                <p className="text-[10px] font-mono font-bold text-rose-600 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-clinicPrimary text-white rounded-xl text-xs font-bold shadow-md shadow-clinicPrimary/20 hover:bg-clinicPrimaryDark hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FaRedo size={12} /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FaHome size={12} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
