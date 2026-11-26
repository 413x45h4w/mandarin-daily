import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, House, MessageCircle, Settings } from 'lucide-react';
import { useApp } from './state';
import { todayKey } from './lib/dates';
import { dayActive } from './lib/stats';

const TITLES: Record<string, string> = {
  '/': 'Today',
  '/words': 'Words',
  '/stats': 'Progress',
  '/talk': 'Conversation',
  '/settings': 'Settings',
  '/about': 'About',
};

export function Layout() {
  const { settings, days } = useApp();
  const { pathname } = useLocation();
  const title = pathname.startsWith('/words/') ? 'Word' : TITLES[pathname] ?? 'Mandarin Daily';
  const practiced = dayActive(days.get(todayKey()));

  useEffect(() => {
    if (!settings.reminderEnabled || !settings.onboarded) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const tick = () => {
      const now = new Date();
      const [hh, mm] = settings.reminderTime.split(':').map(Number);
      const due = now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= (mm || 0));
      const key = todayKey();
      let sent = '';
      try {
        sent = localStorage.getItem('md-reminded') ?? '';
      } catch {
        sent = '';
      }
      if (due && !practiced && sent !== key) {
        try {
          new Notification('Mandarin Daily', { body: 'A short session keeps your streak going.', lang: 'en' });
          localStorage.setItem('md-reminded', key);
        } catch {
          /* browsers can reject the constructor */
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [settings.reminderEnabled, settings.reminderTime, settings.onboarded, practiced]);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <nav className="nav" aria-label="Primary">
        <div className="brand">
          <span className="seal" aria-hidden="true">文</span>
          <div>
            <strong>Mandarin Daily</strong>
            <div className="muted tiny">HSK {settings.level}{settings.track === 'hsk3' ? ' · 3.0' : ''}</div>
          </div>
        </div>
        <NavLink to="/" end><House aria-hidden="true" size={18} /> Today</NavLink>
        <NavLink to="/words"><BookOpen aria-hidden="true" size={18} /> Words</NavLink>
        <NavLink to="/stats"><BarChart3 aria-hidden="true" size={18} /> Progress</NavLink>
        <NavLink to="/talk"><MessageCircle aria-hidden="true" size={18} /> Talk</NavLink>
        <NavLink to="/settings"><Settings aria-hidden="true" size={18} /> Settings</NavLink>
      </nav>
      <div className="main-col">
        <header className="topbar">
          <span className="seal sm" aria-hidden="true">文</span>
          <div>
            <strong>{title}</strong>
            <div className="muted tiny">Mandarin Daily</div>
          </div>
          <NavLink to="/settings" aria-label="Settings" className="icon-btn">
            <Settings aria-hidden="true" size={20} />
          </NavLink>
        </header>
        <main id="main" className="page">
          <Outlet />
        </main>
      </div>
      </div>
  );
}

export function Splash({ label = 'Loading your deck…' }: { label?: string }) {
  return (
    <div className="splash">
      <span className="seal" aria-hidden="true">文</span>
      <p>{label}</p>
    </div>
  );
}
