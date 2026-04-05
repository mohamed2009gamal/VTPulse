import React, { useCallback, useEffect, useMemo, useState } from 'react';
import usePollingData from '../hooks/usePollingData';
import { apiCall } from '../services/api';
import { formatDateTime, formatNumber, formatRelativeTime } from './dashboardUtils';

export default function Messages() {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [mailStatus, setMailStatus] = useState({ configured: true, error: '' });

  const loadMailStatus = useCallback(async () => {
    try {
      const status = await apiCall('/messages/mail-status');
      setMailStatus({
        configured: Boolean(status?.configured),
        error: status?.error || ''
      });
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return;
      }

      if (err?.status === 404) {
        return;
      }

      setMailStatus({
        configured: false,
        error: err?.message || 'Unable to verify email configuration.'
      });
    }
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      return await apiCall('/messages');
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return [];
      }
      throw err;
    }
  }, []);

  const {
    data: messages,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh
  } = usePollingData(loadMessages, {
    initialData: [],
    interval: 12000
  });

  useEffect(() => {
    loadMailStatus();
    const intervalId = window.setInterval(loadMailStatus, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadMailStatus]);

  const unrepliedCount = useMemo(
    () => messages.filter((message) => !(message.replies && message.replies.length > 0)).length,
    [messages]
  );

  const repliedCount = messages.length - unrepliedCount;

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      setActionMessage('Reply text is required.');
      return;
    }

    if (!mailStatus.configured) {
      setActionMessage(mailStatus.error || 'Email replies are disabled until SMTP credentials are configured on the server.');
      return;
    }

    setSendingReply(true);
    setActionMessage('');

    try {
      await apiCall(`/messages/${messageId}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply: replyText.trim() })
      });

      setReplyText('');
      setReplyingTo(null);
      setActionMessage('Reply sent successfully.');
      setMailStatus((current) => ({ ...current, configured: true }));
      await refresh(true);
    } catch (err) {
      setActionMessage(err?.message || 'Failed to send reply.');

      if (
        err?.message?.includes('EMAIL_USER')
        || err?.message?.includes('EMAIL_PASS')
        || err?.message?.includes('SMTP authentication failed')
        || err?.message?.includes('SMTP credentials')
      ) {
        setMailStatus({
          configured: false,
          error: err.message
        });
      }
    } finally {
      setSendingReply(false);
    }
  };

  const closeComposer = () => {
    setReplyingTo(null);
    setReplyText('');
    setActionMessage('');
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Inbox</span>
          <h1 className="dashboard-page-title">Messages</h1>
          <p className="dashboard-page-copy">
            Monitor incoming inquiries, reply from the dashboard, and watch the inbox refresh automatically.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button
            type="button"
            className="dashboard-button dashboard-button-secondary"
            onClick={() => {
              refresh(true);
              loadMailStatus();
            }}
          >
            Refresh
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {refreshing ? 'Updating inbox...' : `Updated ${formatRelativeTime(lastUpdated)}`}
          </span>
        </div>
      </section>

      {error && <div className="dashboard-banner dashboard-banner-error">{error}</div>}
      {!mailStatus.configured && (
        <div className="dashboard-banner dashboard-banner-error">
          {mailStatus.error || 'Email replies are disabled until SMTP credentials are configured on the server.'}
        </div>
      )}
      {actionMessage && <div className="dashboard-banner">{actionMessage}</div>}

      <section className="dashboard-kpi-grid dashboard-kpi-grid-compact">
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Total messages</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(messages.length)}</strong>
          <span className="dashboard-kpi-meta">All contact form submissions</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Awaiting reply</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(unrepliedCount)}</strong>
          <span className="dashboard-kpi-meta">Open conversations</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Answered</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(repliedCount)}</strong>
          <span className="dashboard-kpi-meta">Threads with at least one reply</span>
        </article>
      </section>

      {messages.length === 0 && !loading ? (
        <div className="dashboard-empty">No messages yet.</div>
      ) : (
        <div className="dashboard-stack">
          {messages.map((message) => {
            const sender = `${message.firstName || ''} ${message.lastName || ''}`.trim() || message.name || 'Unknown sender';
            const isReplying = replyingTo === message._id;

            return (
              <article key={message._id} className="dashboard-panel dashboard-message-card">
                <div className="dashboard-panel-header">
                  <div>
                    <h2 className="dashboard-panel-title">{sender}</h2>
                    <p className="dashboard-panel-copy">{message.email}</p>
                  </div>
                  <div className="dashboard-list-meta">
                    <span>{formatDateTime(message.createdAt)}</span>
                    <span className="dashboard-chip">
                      {message.replies?.length ? `${message.replies.length} replies` : 'New'}
                    </span>
                  </div>
                </div>

                <div className="dashboard-message-meta">
                  {message.company && <span className="dashboard-chip">{message.company}</span>}
                  {message.phone && <span className="dashboard-chip">{message.phone}</span>}
                </div>

                <p className="dashboard-message-body">{message.message}</p>

                {message.replies?.length > 0 && (
                  <div className="dashboard-reply-thread">
                    {message.replies.map((reply, index) => (
                      <div key={`${message._id}-reply-${index}`} className="dashboard-reply-item">
                        <p>{reply.reply}</p>
                        <span>{formatDateTime(reply.repliedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isReplying ? (
                  <div className="dashboard-reply-composer">
                    <textarea
                      className="dashboard-textarea"
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Write your reply..."
                    />
                    <div className="dashboard-form-actions">
                      <button
                        type="button"
                        className="dashboard-button"
                        disabled={sendingReply || !mailStatus.configured}
                        onClick={() => handleReply(message._id)}
                      >
                        {sendingReply ? 'Sending...' : 'Send reply'}
                      </button>
                      <button
                        type="button"
                        className="dashboard-button dashboard-button-secondary"
                        onClick={closeComposer}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-message-footer">
                    <span className="dashboard-muted">Last updated {formatRelativeTime(message.createdAt)}</span>
                    <button
                      type="button"
                      className="dashboard-button"
                      disabled={!mailStatus.configured}
                      onClick={() => {
                        if (!mailStatus.configured) {
                          setActionMessage(mailStatus.error || 'Email replies are disabled until SMTP credentials are configured on the server.');
                          return;
                        }
                        setReplyingTo(message._id);
                        setReplyText('');
                        setActionMessage('');
                      }}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
