'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">&#9888;&#65039;</p>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This page encountered an error. Try refreshing.</p>
            <button onClick={() => this.setState({ hasError: false })} className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
