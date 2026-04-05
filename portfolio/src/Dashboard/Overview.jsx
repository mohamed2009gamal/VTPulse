import React, { useCallback, useEffect, useRef, useState } from 'react';
import usePollingData from '../hooks/usePollingData';
import { apiCall } from '../services/api';
import { formatDateTime, formatDuration, formatNumber, formatRelativeTime } from './dashboardUtils';

const initialOverview = {
  visits: 0,
  clicks: 0,
  messages: 0,
  cookiesAccepted: 0,
  cookiesRejected: 0,
  totalTimeSpent: 0,
  live: {
    activeVisits: 0,
    clicksLastHour: 0,
    visitsToday: 0,
    messagesToday: 0
  },
  topPaths: [],
  recentMessages: [],
  lastUpdated: null
};

const normalizeOverview = (payload = {}) => ({
  ...initialOverview,
  ...payload,
  live: {
    ...initialOverview.live,
    ...(payload.live || {})
  },
  topPaths: Array.isArray(payload.topPaths) ? payload.topPaths : initialOverview.topPaths,
  recentMessages: Array.isArray(payload.recentMessages) ? payload.recentMessages : initialOverview.recentMessages
});

function ActiveMetricCard({
  label,
  value,
  meta,
  metricValue,
  loading,
  refreshing,
  changeFormatter = formatNumber
}) {
  const previousMetricValueRef = useRef(metricValue);
  const timeoutRef = useRef(null);
  const [changeValue, setChangeValue] = useState(0);
  const [isHot, setIsHot] = useState(false);

  useEffect(() => {
    if (loading) {
      previousMetricValueRef.current = metricValue;
      return undefined;
    }

    const previousMetricValue = previousMetricValueRef.current;
    previousMetricValueRef.current = metricValue;

    if (previousMetricValue === metricValue) {
      return undefined;
    }

    setChangeValue(metricValue - previousMetricValue);
    setIsHot(true);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsHot(false);
      setChangeValue(0);
    }, 2200);

    return undefined;
  }, [loading, metricValue]);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  let badgeText = 'Live';
  if (refreshing) {
    badgeText = 'Syncing';
  } else if (changeValue > 0) {
    badgeText = `+${changeFormatter(changeValue)}`;
  } else if (changeValue < 0) {
    badgeText = 'Updated';
  }

  return (
    <article
      className={[
        'dashboard-kpi-card',
        'dashboard-kpi-card-live',
        refreshing ? 'dashboard-kpi-card-refreshing' : '',
        isHot ? 'dashboard-kpi-card-hot' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="dashboard-kpi-card-header">
        <span className="dashboard-kpi-label">{label}</span>
        <span className={`dashboard-kpi-badge ${isHot ? 'dashboard-kpi-badge-hot' : ''}`}>
          <span className="dashboard-live-dot dashboard-live-dot-small" />
          {badgeText}
        </span>
      </div>
      <strong className="dashboard-kpi-value">{loading ? '...' : value}</strong>
      <span className="dashboard-kpi-meta">{meta}</span>
    </article>
  );
}

export default function Overview() {
  const loadOverview = useCallback(async () => {
    try {
      const payload = await apiCall('/dashboard/overview');
      return normalizeOverview(payload);
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return initialOverview;
      }
      throw err;
    }
  }, []);

  const {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh
  } = usePollingData(loadOverview, {
    initialData: initialOverview,
    interval: 3000
  });

  const overview = normalizeOverview(data);
  const totalCookies = overview.cookiesAccepted + overview.cookiesRejected;

  const statusText = refreshing ? 'Refreshing live metrics...' : `Updated ${formatRelativeTime(lastUpdated || overview.lastUpdated)}`;

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Live operations</span>
          <h1 className="dashboard-page-title">Overview</h1>
          <p className="dashboard-page-copy">
            Real-time pulse for visits, clicks, contact flow, and consent activity across the portfolio.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => refresh(true)}>
            Refresh
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {statusText}
          </span>
        </div>
      </section>

      {error && <div className="dashboard-banner dashboard-banner-error">{error}</div>}

      <section className="dashboard-kpi-grid">
        <ActiveMetricCard
          label="Total visits"
          value={formatNumber(overview.visits)}
          meta={`${formatNumber(overview.live.visitsToday)} today`}
          metricValue={overview.visits}
          loading={loading}
          refreshing={refreshing}
        />
        <ActiveMetricCard
          label="Total clicks"
          value={formatNumber(overview.clicks)}
          meta={`${formatNumber(overview.live.clicksLastHour)} in the last hour`}
          metricValue={overview.clicks}
          loading={loading}
          refreshing={refreshing}
        />
        <ActiveMetricCard
          label="Total messages"
          value={formatNumber(overview.messages)}
          meta={`${formatNumber(overview.live.messagesToday)} arrived today`}
          metricValue={overview.messages}
          loading={loading}
          refreshing={refreshing}
        />
        <ActiveMetricCard
          label="Total cookies"
          value={formatNumber(totalCookies)}
          meta={`${formatNumber(overview.cookiesAccepted)} accepted, ${formatNumber(overview.cookiesRejected)} rejected`}
          metricValue={totalCookies}
          loading={loading}
          refreshing={refreshing}
        />
        <ActiveMetricCard
          label="Tracked engagement time"
          value={formatDuration(overview.totalTimeSpent)}
          meta={`${formatNumber(overview.live.activeVisits)} active visitors contributing now`}
          metricValue={overview.totalTimeSpent}
          loading={loading}
          refreshing={refreshing}
          changeFormatter={formatDuration}
        />
      </section>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Live pulse</h2>
              <p className="dashboard-panel-copy">Short-window activity from active sessions and fresh submissions.</p>
            </div>
          </div>
          <div className="dashboard-mini-grid">
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Active visitors</span>
              <strong>{formatNumber(overview.live.activeVisits)}</strong>
            </div>
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Visits today</span>
              <strong>{formatNumber(overview.live.visitsToday)}</strong>
            </div>
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Clicks this hour</span>
              <strong>{formatNumber(overview.live.clicksLastHour)}</strong>
            </div>
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Messages today</span>
              <strong>{formatNumber(overview.live.messagesToday)}</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Top paths</h2>
              <p className="dashboard-panel-copy">Most visited routes across the tracked experience.</p>
            </div>
          </div>
          {overview.topPaths.length === 0 ? (
            <div className="dashboard-empty">No visits recorded yet.</div>
          ) : (
            <div className="dashboard-list">
              {overview.topPaths.map((entry) => (
                <div className="dashboard-list-item" key={entry.path}>
                  <div>
                    <strong>{entry.path || '/'}</strong>
                    <p>{formatNumber(entry.count)} visits</p>
                  </div>
                  <span className="dashboard-chip">{formatNumber(entry.count)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Recent messages</h2>
            <p className="dashboard-panel-copy">Newest contact requests reaching the dashboard.</p>
          </div>
        </div>
        {overview.recentMessages.length === 0 ? (
          <div className="dashboard-empty">No messages have been received yet.</div>
        ) : (
          <div className="dashboard-list">
            {overview.recentMessages.map((message) => {
              const sender = `${message.firstName || ''} ${message.lastName || ''}`.trim() || message.name || message.email;
              return (
                <div className="dashboard-list-item" key={`${message.email}-${message.createdAt}`}>
                  <div>
                    <strong>{sender}</strong>
                    <p>{message.email}</p>
                    <p>{message.company || 'Independent inquiry'}</p>
                  </div>
                  <div className="dashboard-list-meta">
                    <span>{formatDateTime(message.createdAt)}</span>
                    <span className="dashboard-chip">{message.replies?.length ? `${message.replies.length} replies` : 'Awaiting reply'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}
