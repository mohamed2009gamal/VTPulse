import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { NavLink, useHistory, Switch, Route } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../services/api';
import Overview from './Overview';
import Messages from './Messages';
import Analytics from './Analytics';
import Blogs from './Blogs';
import Archive from './Archive';
import Settings from './Settings';
import './Dashboard.css';

const navItems = [
  { to: '/dashboard', label: 'Overview', exact: true },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/analytics', label: 'Analytics' },
  { to: '/dashboard/blogs', label: 'Blogs' },
  { to: '/dashboard/archive', label: 'Archive' },
  { to: '/dashboard/settings', label: 'Settings' }
];

export default function DashboardLayout() {
  const { currentTheme } = useTheme();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('adminEmail') || '');

  const checkAuth = useCallback(async () => {
    try {
      const data = await apiCall('/auth/status');

      if (!data?.logged || !data?.email) {
        localStorage.removeItem('adminEmail');
        history.push('/admin');
        return;
      }

      localStorage.setItem('adminEmail', data.email);
      setAdminEmail(data.email);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem('adminEmail');
      history.push('/admin');
    }
  }, [history]);

  useEffect(() => {
    checkAuth();
    const interval = window.setInterval(checkAuth, 60000);
    return () => window.clearInterval(interval);
  }, [checkAuth]);

  useEffect(() => {
    const previous = document.title;
    document.title = 'VenomTech Dashboard';
    return () => {
      document.title = previous;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiCall('/auth/admin/logout', {
        method: 'POST'
      });
    } catch (err) {
      // ignore logout failures and still clear local state
    }

    localStorage.removeItem('adminEmail');
    history.push('/admin');
  };

  const adminLabel = useMemo(() => adminEmail || 'admin@venomtech.local', [adminEmail]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-card">
          <div className="dashboard-loading-ring" />
          <div>
            <strong>Preparing dashboard</strong>
            <p>Checking session and loading live panels.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">VT</div>
          <div>
            <p className="dashboard-brand-kicker">Control center</p>
            <h2 className="dashboard-title">VenomTech Dashboard</h2>
          </div>
        </div>

        <div className="dashboard-session-card">
          <span className="dashboard-session-label">Signed in as</span>
          <strong className="dashboard-session-email">{adminLabel}</strong>
          <span className="dashboard-live-chip">
            <span className="dashboard-live-dot" />
            Live data enabled
          </span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              exact={item.exact}
              className="nav-link"
              activeClassName="active"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-sidebar-note">
            <span className="dashboard-sidebar-note-label">Theme</span>
            <strong>{currentTheme?.accentColor ? 'Synced with site' : 'Default'}</strong>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Switch>
          <Route exact path="/dashboard" component={Overview} />
          <Route path="/dashboard/messages" component={Messages} />
          <Route path="/dashboard/analytics" component={Analytics} />
          <Route path="/dashboard/blogs" component={Blogs} />
          <Route path="/dashboard/archive" component={Archive} />
          <Route path="/dashboard/settings" component={Settings} />
        </Switch>
      </main>
    </div>
  );
}
