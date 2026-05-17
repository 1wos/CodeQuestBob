import { useApp } from './useApp';
import { Navigation } from '../components/ui/Navigation';
import { Landing } from '../screens/Landing';
import { RepoScan } from '../screens/RepoScan';
import { QuestMap } from '../screens/QuestMap';
import { QuestDetail } from '../screens/QuestDetail';
import { Passport } from '../screens/Passport';
import './AppShell.css';

export function AppShell() {
  const { currentScreen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <Landing />;
      case 'repo-scan':
        return <RepoScan />;
      case 'quest-map':
        return <QuestMap />;
      case 'quest-detail':
        return <QuestDetail />;
      case 'passport':
        return <Passport />;
      default:
        return <Landing />;
    }
  };

  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-content">{renderScreen()}</main>
    </div>
  );
}

// Made with Bob
