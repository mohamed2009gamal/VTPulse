import React, { useEffect, useState } from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';

/**
 * A route wrapper that checks the server for a valid admin session before
 * rendering the given component. If the check fails the user is redirected
 * back to the login page (/admin).
 *
 * This prevents client code from simply navigating to /dashboard via
 * history.push or manual URL entry when the server considers the session
 * invalid. It also avoids showing dashboard UI while the check is in progress.
 *
 * The component will re-verify whenever the location changes so that a
 * logout event or manual navigation triggers a fresh check.
 */
export default function ProtectedRoute({ component: Component, ...rest }) {
  const [authenticated, setAuthenticated] = useState(null); // null = unknown
  const location = useLocation();

  const verify = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/status', {
        credentials: 'include'
      });
      const data = await res.json();
      const serverOk = res.ok && data.logged;
      if (serverOk && data.email) {
        localStorage.setItem('adminEmail', data.email);
        setAuthenticated(true);
      } else {
        localStorage.removeItem('adminEmail');
        setAuthenticated(false);
      }
    } catch (err) {
      console.error('auth check failed', err);
      setAuthenticated(false);
      localStorage.removeItem('adminEmail');
    }
  };

  useEffect(() => {
    // run a check whenever the route attempts to render
    verify();
  }, [location.pathname]);

  // while we're waiting, render a simple placeholder
  if (authenticated === null) {
    return <div className="loading-screen">Checking authentication...</div>;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        authenticated ? <Component {...props} /> : <Redirect to="/admin" />
      }
    />
  );
}
