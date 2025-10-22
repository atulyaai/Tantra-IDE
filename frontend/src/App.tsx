import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/Layout/MainLayout.js';
import { useSettingsStore } from './stores/settingsStore.js';
import ollamaService from './services/ollama.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    // Connect to Ollama WebSocket
    ollamaService.connect();

    return () => {
      ollamaService.disconnect();
    };
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

