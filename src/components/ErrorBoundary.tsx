'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/error-logger';
import { I18nContext } from '@/i18n/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // The language of the page (a class component cannot call the useT() hook)
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, { errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      const t = this.context?.t ?? ((key: string) => key);

      return this.props.fallback || (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 m-4">
          <span className="text-6xl mb-6">⚠️</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {t('common.errorTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 font-medium">
            {t('common.errorDesc')}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
