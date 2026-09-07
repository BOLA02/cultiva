import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Cultiva UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-error">
      <div className="fatal-mark">!</div>
      <h1>We couldn’t display this page.</h1>
      <p>The problem has been contained. Reload the page or return to the Cultiva home page.</p>
      <div><button onClick={() => window.location.reload()}>Reload page</button><a href="/">Return home</a></div>
      {import.meta.env.DEV && <pre>{this.state.error.message}</pre>}
    </main>;
  }
}
