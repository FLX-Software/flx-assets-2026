
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Error Boundary für besseres Debugging
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ React Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>❌ Fehler beim Laden der App</h1>
          <p><strong>Fehler:</strong> {this.state.error?.message}</p>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
          <p>Bitte öffne die Browser-Konsole (F12) für mehr Details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('🚀 Starting app...');
console.log('Environment check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌',
});

try {
  console.log('📦 Importing App component...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('📦 Rendering App...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ App rendered');
} catch (error) {
  console.error('❌ FATAL ERROR in index.tsx:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">❌ FATAL ERROR</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">
        ${error instanceof Error ? error.stack : String(error)}
      </pre>
      <p>Bitte öffne die Browser-Konsole (F12) für mehr Details.</p>
    </div>
  `;
}

// Register Service Worker for PWA (basic implementation)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
