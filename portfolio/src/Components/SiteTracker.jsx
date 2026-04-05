import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_BASE } from '../services/api';

const TRACKING_URL = `${BACKEND_BASE}/api/track`;
const ACTIVE_TIME_FLUSH_INTERVAL = 5000;

const isTrackedPath = (pathname) =>
  pathname &&
  !pathname.startsWith('/dashboard') &&
  !pathname.startsWith('/admin') &&
  !pathname.startsWith('/signin') &&
  !pathname.startsWith('/register');

const postTracking = async (endpoint, payload, options = {}) => {
  try {
    const response = await fetch(`${TRACKING_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: options.keepalive || false
    });

    if (!response.ok) {
      return null;
    }

    return await response.json().catch(() => null);
  } catch (error) {
    return null;
  }
};

const sendTimeSpent = (payload, options = {}) => {
  if (options.keepalive && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${TRACKING_URL}/time`, blob);
    return;
  }

  postTracking('/time', payload, { keepalive: options.keepalive });
};

const trackTimeSpent = (visit, options = {}) => {
  if (!visit.startedAt || visit.closed) {
    return;
  }

  if (!visit.visitId && !options.finalize) {
    return;
  }

  const now = Date.now();
  const lastTrackedAt = visit.lastTrackedAt || visit.startedAt;
  let elapsedSeconds = Math.floor((now - lastTrackedAt) / 1000);

  if (elapsedSeconds <= 0 && options.allowMinimum && !visit.hasTrackedTime && now > visit.startedAt) {
    elapsedSeconds = 1;
  }

  if (elapsedSeconds <= 0) {
    if (options.finalize) {
      visit.closed = true;
    }
    return;
  }

  const payload = {
    path: visit.path,
    timeSpent: elapsedSeconds
  };

  if (visit.visitId) {
    payload.visitId = visit.visitId;
  }

  visit.lastTrackedAt = now;
  visit.hasTrackedTime = true;

  if (options.finalize) {
    visit.closed = true;
  }

  sendTimeSpent(payload, { keepalive: options.keepalive || options.finalize });
};

const describeTarget = (target) => {
  if (!(target instanceof Element)) {
    return null;
  }

  const clickable = target.closest('a, button, [role="button"], input[type="submit"], input[type="button"], [data-track-click]');
  if (!clickable) {
    return null;
  }

  const text = clickable.textContent?.replace(/\s+/g, ' ').trim();
  const ariaLabel = clickable.getAttribute('aria-label');
  const id = clickable.id ? `#${clickable.id}` : '';
  const name = clickable.getAttribute('name');
  const href = clickable.getAttribute('href');

  return [
    clickable.tagName.toLowerCase(),
    ariaLabel,
    text,
    name ? `name:${name}` : '',
    href ? `href:${href}` : '',
    id
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 160);
};

export default function SiteTracker() {
  const location = useLocation();
  const visitRef = useRef({
    visitId: null,
    path: '',
    startedAt: 0,
    lastTrackedAt: 0,
    hasTrackedTime: false,
    closed: false
  });

  useEffect(() => {
    const flushCurrentVisit = () => {
      trackTimeSpent(visitRef.current, {
        finalize: true,
        allowMinimum: true,
        keepalive: true
      });
    };

    const currentPath = `${location.pathname}${location.search || ''}`;

    flushCurrentVisit();

    if (!isTrackedPath(location.pathname)) {
      visitRef.current = {
        visitId: null,
        path: currentPath,
        startedAt: 0,
        lastTrackedAt: 0,
        hasTrackedTime: false,
        closed: true
      };
      return undefined;
    }

    visitRef.current = {
      visitId: null,
      path: currentPath,
      startedAt: Date.now(),
      lastTrackedAt: Date.now(),
      hasTrackedTime: false,
      closed: false
    };

    postTracking('/visit', { path: currentPath }).then((data) => {
      if (!data?.visitId) {
        return;
      }

      if (visitRef.current.path === currentPath && !visitRef.current.closed) {
        visitRef.current.visitId = data.visitId;
      }
    });

    return () => {
      flushCurrentVisit();
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      trackTimeSpent(visitRef.current);
    }, ACTIVE_TIME_FLUSH_INTERVAL);

    const handlePageHide = () => {
      trackTimeSpent(visitRef.current, {
        finalize: true,
        allowMinimum: true,
        keepalive: true
      });
    };

    const handleClick = (event) => {
      if (!isTrackedPath(window.location.pathname)) {
        return;
      }

      const element = describeTarget(event.target);
      if (!element) {
        return;
      }

      postTracking('/click', {
        element,
        path: `${window.location.pathname}${window.location.search || ''}`
      }, { keepalive: true });
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}
