import { AppProvider } from './app/AppContext';
import { AppShell } from './app/AppShell';

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
