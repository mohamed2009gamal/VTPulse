import React, { useEffect, useState, createContext, useContext } from 'react';
import { Switch, Route, Link, useRouteMatch, useHistory } from 'react-router-dom';
import Overview from './Overview';
import Messages from './Messages';
import Analytics from './Analytics';
import Settings from './Settings';
import Blogs from './Blogs';
import './Dashboard.css';

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export default function DashboardLayout() {
  const { path, url } = useRouteMatch();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('dashboardTheme') || 'dark'
  );

  const themes = {
    dark: {
      backgroundColor: '#000',
      color: 'white',
      sidebarBg: '#111',
      sidebarBorder: '#333',
      cardBg: '#1a1a1a',
      inputBg: '#000',
      inputBorder: '#333',
      buttonBg: '#7e22ce',
      accentColor: '#7e22ce',
      textSecondary: '#888'
    },
    light: {
      backgroundColor: '#f5f5f5',
      color: '#333',
      sidebarBg: '#fff',
      sidebarBorder: '#ddd',
      cardBg: '#fff',
      inputBg: '#fff',
      inputBorder: '#ccc',
      buttonBg: '#7e22ce',
      accentColor: '#7e22ce',
      textSecondary: '#666'
    }
  };

  const currentTheme = themes[theme];

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('dashboardTheme', newTheme);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/dashboard/overview', {
          credentials: 'include'
        });

        if (res.status === 401) {
          const data = await res.json();
          if (data.error === 'Session expired') {
            setSessionExpired(true);
            setTimeout(() => history.push('/admin'), 2000);
          } else {
            history.push('/admin');
          }
        } else {
          setLoading(false);
        }
      } catch {
        history.push('/admin');
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, [history]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Clear stored admin info on logout
      localStorage.removeItem('adminEmail');
    } catch (err) {
      console.error(err);
    }
    history.push('/admin');
  };

  if (loading) {
    return (
      <div className={`loading-${theme}`}>
        Loading...
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentTheme }}>
      <div className={`dashboard-${theme}`}>
        {/* Sidebar */}
        <aside className={`sidebar-${theme}`}>
          <h2 style={{ marginBottom: '30px', color: currentTheme.accentColor }}>
            Dashboard
          </h2>

          {/* ✅ SIDE LIST */}
          <nav className={`nav-${theme}`}>
            <Link to={`${url}`} className={`nav-link-${theme}`}>Overview</Link>
            <Link to={`${url}/messages`} className={`nav-link-${theme}`}>Messages</Link>
            <Link to={`${url}/analytics`} className={`nav-link-${theme}`}>Analytics</Link>
            <Link to={`${url}/settings`} className={`nav-link-${theme}`}>Settings</Link>
            <Link to={`${url}/blogs`} className={`nav-link-${theme}`}>Blogs</Link>
                      <button
            onClick={handleLogout}
            className={`logout-btn-${theme}`}
          >
            Logout
          </button>
          </nav>


        </aside>

        {/* Main */}
        <main className={`main-content-${theme}`}>
          <h1 className={`main-title-${theme}`}>
            Portfolio Admin Dashboard
          </h1>
          <Switch>
            <Route exact path={path} component={Overview} />
            <Route path={`${path}/messages`} component={Messages} />
            <Route path={`${path}/analytics`} component={Analytics} />
            <Route path={`${path}/settings`} component={Settings} />
            <Route path={`${path}/blogs`} component={Blogs} />
          </Switch>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}


