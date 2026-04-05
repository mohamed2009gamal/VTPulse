import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { FaGithub, FaGooglePlusG } from 'react-icons/fa';
import { apiCall, BACKEND_BASE } from './services/api';
import './styles/AdminLogin.css';

const defaultProviders = {
  google: false,
  github: false
};

function FormFeedback({ feedback }) {
  if (!feedback?.message) {
    return null;
  }

  return (
    <div
      className={`admin-auth-feedback ${
        feedback.type === 'success' ? 'admin-auth-feedback-success' : ''
      }`}
      role={feedback.type === 'error' ? 'alert' : 'status'}
    >
      {feedback.message}
    </div>
  );
}

function SocialIcons({ providers, onGoogleLogin, onGithubLogin }) {
  return (
    <div className="social-icons">
      <a
        href="#google-auth"
        className={`icon ${providers.google ? '' : 'disabled'}`.trim()}
        onClick={(event) => {
          event.preventDefault();
          onGoogleLogin();
        }}
        aria-label={providers.google ? 'Sign in with Google' : 'Google sign-in unavailable'}
        title={providers.google ? 'Sign in with Google' : 'Google sign-in unavailable'}
      >
        <FaGooglePlusG aria-hidden="true" />
      </a>

      <a
        href="#github-auth"
        className={`icon ${providers.github ? '' : 'disabled'}`.trim()}
        onClick={(event) => {
          event.preventDefault();
          onGithubLogin();
        }}
        aria-label={providers.github ? 'Sign in with GitHub' : 'GitHub sign-in unavailable'}
        title={providers.github ? 'Sign in with GitHub' : 'GitHub sign-in unavailable'}
      >
        <FaGithub aria-hidden="true" />
      </a>
    </div>
  );
}

export default function Admin() {
  const history = useHistory();
  const location = useLocation();
  const [providers, setProviders] = useState(defaultProviders);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState({ type: '', message: '' });
  const [registerFeedback, setRegisterFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    document.body.classList.add('admin-auth-body');

    return () => {
      document.body.classList.remove('admin-auth-body');
    };
  }, []);

  useEffect(() => {
    setIsRegistering(location.pathname === '/register');
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const [authResult, providerResult] = await Promise.allSettled([
        apiCall('/auth/status'),
        apiCall('/auth/providers')
      ]);

      if (!mounted) {
        return;
      }

      if (providerResult.status === 'fulfilled') {
        setProviders({
          google: Boolean(providerResult.value?.google),
          github: Boolean(providerResult.value?.github)
        });
      }

      if (
        authResult.status === 'fulfilled' &&
        authResult.value?.logged &&
        authResult.value?.email
      ) {
        localStorage.setItem('adminEmail', authResult.value.email);
        history.replace('/dashboard');
        return;
      }

      localStorage.removeItem('adminEmail');
      setCheckingSession(false);
    };

    bootstrap().catch(() => {
      if (!mounted) {
        return;
      }

      localStorage.removeItem('adminEmail');
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
    };
  }, [history]);

  const openLoginView = () => {
    setIsRegistering(false);
    history.replace('/admin');
  };

  const openRegisterView = () => {
    setIsRegistering(true);
    history.replace('/register');
  };

  const handleProviderLogin = (provider) => {
    const available = provider === 'google' ? providers.google : providers.github;

    if (!available) {
      setLoginFeedback({
        type: 'error',
        message: `${provider === 'google' ? 'Google' : 'GitHub'} sign-in is not configured for this project yet.`
      });
      return;
    }

    setLoginFeedback({ type: '', message: '' });
    setRegisterFeedback({ type: '', message: '' });
    window.location.href = `${BACKEND_BASE}/api/auth/${provider}`;
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const normalizedEmail = loginForm.email.trim();

    if (!normalizedEmail || !loginForm.password) {
      setLoginFeedback({ type: 'error', message: 'Email and password are required.' });
      return;
    }

    setLoginLoading(true);
    setLoginFeedback({ type: '', message: '' });

    try {
      await apiCall('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginForm.password
        })
      });

      localStorage.setItem('adminEmail', normalizedEmail);
      history.push('/dashboard');
    } catch (err) {
      localStorage.removeItem('adminEmail');
      setLoginFeedback({
        type: 'error',
        message: err?.message || 'Unable to sign in right now.'
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const payload = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password
    };

    if (!payload.name || !payload.email || !payload.password) {
      setRegisterFeedback({
        type: 'error',
        message: 'Name, email, and password are required.'
      });
      return;
    }

    setRegisterLoading(true);
    setRegisterFeedback({ type: '', message: '' });

    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setRegisterForm({
        name: '',
        email: '',
        password: ''
      });

      setLoginForm((prev) => ({
        ...prev,
        email: payload.email
      }));

      const message =
        data?.message ||
        'Registration submitted. Wait for admin approval before signing in.';

      setRegisterFeedback({ type: 'success', message });
      setLoginFeedback({ type: 'success', message });
      openLoginView();
    } catch (err) {
      setRegisterFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit registration.'
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-loading-card">
          <strong>Checking dashboard access...</strong>
          <p>Validating the current admin session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-auth-page">
      <div
        className={`container ${isRegistering ? 'active' : ''}`}
        id="container"
      >
        <div className="form-container sign-up">
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <SocialIcons
              providers={providers}
              onGoogleLogin={() => handleProviderLogin('google')}
              onGithubLogin={() => handleProviderLogin('github')}
            />
            <span>Use your email for registration</span>
            <FormFeedback feedback={registerFeedback} />
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={registerForm.name}
              onChange={handleRegisterChange}
              disabled={registerLoading}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              disabled={registerLoading}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              autoComplete="new-password"
              disabled={registerLoading}
              required
            />
            <button type="submit" disabled={registerLoading}>
              {registerLoading ? 'Submitting...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <SocialIcons
              providers={providers}
              onGoogleLogin={() => handleProviderLogin('google')}
              onGithubLogin={() => handleProviderLogin('github')}
            />
            <span>Use your email and password</span>
            <FormFeedback feedback={loginFeedback} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={handleLoginChange}
              autoComplete="username"
              disabled={loginLoading}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={handleLoginChange}
              autoComplete="current-password"
              disabled={loginLoading}
              required
            />
            <Link className="admin-auth-forgot-link" to="/ContactUs">
              Forgot your password?
            </Link>
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your approved details and continue to the dashboard.</p>
              <button
                type="button"
                className="hidden"
                id="login"
                onClick={openLoginView}
              >
                Sign In
              </button>
            </div>

            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your details and wait for dashboard access approval.</p>
              <button
                type="button"
                className="hidden"
                id="register"
                onClick={openRegisterView}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
