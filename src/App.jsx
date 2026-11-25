import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { RecipeProvider } from './context/RecipeContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';
import Spinner from './components/common/Spinner';

function Boot() {
  const { ready, initError, retryInit } = useApp();
  if (initError) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">We couldn’t start Élan Kitchen</h1>
        <p className="mt-3 max-w-md text-muted">{initError}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={retryInit}>Try again</button>
      </div>
    );
  }
  if (!ready) return <Spinner fullPage label="Preparing your kitchen…" />;
  return (
    <AuthProvider>
      <RecipeProvider>
        <ScrollToTop />
        <AppRoutes />
      </RecipeProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppProvider>
            <Boot />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px', background: '#202620', color: '#FAF8F3' },
                success: { iconTheme: { primary: '#16A34A', secondary: '#FAF8F3' } },
                error: { iconTheme: { primary: '#DC2626', secondary: '#FAF8F3' } },
              }}
            />
          </AppProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}
