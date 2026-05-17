import { useApp } from '../../app/useApp';
import type { Screen } from '../../domain/types';
import { Award, Bot, Home, Map, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './Navigation.css';

export function Navigation() {
  const { currentScreen, navigateTo } = useApp();

  const navItems: Array<{ screen: Screen; label: string; icon: LucideIcon }> = [
    { screen: 'landing', label: 'Home', icon: Home },
    { screen: 'repo-scan', label: 'Scan', icon: Search },
    { screen: 'quest-map', label: 'Quests', icon: Map },
    { screen: 'passport', label: 'Passport', icon: Award },
  ];

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <span className="nav-logo" aria-hidden="true">
          <Bot size={20} />
        </span>
        <span className="nav-title">CodeQuest Bob</span>
      </div>
      <div className="nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              className={`nav-item ${currentScreen === item.screen ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={currentScreen === item.screen ? 'page' : undefined}
              onClick={() => navigateTo(item.screen)}
            >
              <Icon size={20} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Made with Bob
