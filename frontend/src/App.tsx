import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/Layout/MainLayout';
import { useSettingsStore } from './stores/settingsStore';
import ollamaService from './services/ollama';

// Configure React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      retry: 1, // Limit retry attempts
    },
  },
});

function App() {
  const theme = useSettingsStore((state) => state.theme);

  // Apply theme to document root for global styling
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Initialize Ollama WebSocket connection
  useEffect(() => {
    ollamaService.connect();
    return () => ollamaService.disconnect(); // Cleanup on unmount
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen overflow-hidden">
        <MainLayout />
      </div>
    </QueryClientProvider>
  );
}

export default App;

