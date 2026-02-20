// ==================================================
// FILE: src/components/ErrorBoundary.jsx
// ==================================================

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { darkMode = true } = this.props;
      
      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${
          darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          <div className={`max-w-md w-full rounded-2xl p-8 text-center border ${
            darkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white border-gray-200 shadow-lg'
          }`}>
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              An unexpected error occurred. Don't worry, your data is safe.
            </p>

            {/* Error Details (collapsible in dev) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={`mb-6 text-left rounded-lg p-3 ${
                darkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <summary className="cursor-pointer text-red-400 text-sm font-medium">
                  Technical Details
                </summary>
                <pre className={`mt-2 text-xs overflow-auto max-h-32 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className={`flex-1 px-4 py-3 font-medium rounded-xl transition-colors ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Go to Home
              </button>
            </div>

            {/* Brand */}
            <p className={`mt-8 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent font-bold">
                OVERSOLD
              </span>
              <span>.crypto</span>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
