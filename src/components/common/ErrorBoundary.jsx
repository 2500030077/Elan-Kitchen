import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow mb-3">Something went wrong</p>
        <h1 className="text-3xl font-semibold">This page burnt a little.</h1>
        <p className="mt-3 max-w-md text-muted">An unexpected error occurred while displaying this page. Your saved data is safe.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
          <a className="btn btn-secondary" href="/">Go to homepage</a>
        </div>
      </div>
    );
  }
}
