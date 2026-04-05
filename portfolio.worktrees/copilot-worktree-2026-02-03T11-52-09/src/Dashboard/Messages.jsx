import React, { useEffect, useState } from 'react';
import { useTheme } from './DashboardLayout';

export default function Messages() {
  const { currentTheme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/messages', {
        credentials: 'include'
      });

      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`http://localhost:4000/api/messages/${messageId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText })
      });

      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        await fetchMessages(); // Refresh messages
      } else {
        alert('Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div style={{ color: currentTheme.color, padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ color: currentTheme.color }}>
      <h1 style={{ marginBottom: '30px', color: currentTheme.accentColor }}>Messages</h1>

      {messages.length === 0 ? (
        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '40px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`,
          textAlign: 'center'
        }}>
          <p style={{ color: currentTheme.textSecondary }}>No messages yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map((msg) => (
            <div
              key={msg._id}
              style={{
                backgroundColor: currentTheme.cardBg,
                padding: '20px',
                borderRadius: '10px',
                border: `1px solid ${currentTheme.sidebarBorder}`
              }}
            >
              <h3 style={{ color: currentTheme.accentColor, marginBottom: '10px' }}>{msg.name}</h3>
              <p style={{ color: currentTheme.textSecondary, marginBottom: '5px' }}>{msg.email}</p>
              <p style={{ color: currentTheme.color, marginBottom: '15px' }}>{msg.message}</p>

              {msg.replies && msg.replies.length > 0 && (
                <div style={{ marginBottom: '15px', paddingLeft: '15px', borderLeft: `2px solid ${currentTheme.accentColor}` }}>
                  <h4 style={{ color: currentTheme.accentColor, marginBottom: '10px' }}>Replies:</h4>
                  {msg.replies.map((reply, idx) => (
                    <div key={idx} style={{
                      backgroundColor: currentTheme.inputBg,
                      padding: '10px',
                      borderRadius: '5px',
                      marginBottom: '8px'
                    }}>
                      <p style={{ color: currentTheme.color, margin: '0' }}>{reply.reply}</p>
                      <p style={{ color: currentTheme.textSecondary, fontSize: '0.8em', margin: '5px 0 0 0' }}>
                        {new Date(reply.repliedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === msg._id ? (
                <div style={{ marginTop: '15px' }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '10px',
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      color: 'white',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleReply(msg._id)}
                      disabled={sendingReply}
                      style={{
                        backgroundColor: '#7e22ce',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: sendingReply ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      style={{
                        backgroundColor: '#555',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(msg._id)}
                  style={{
                    backgroundColor: currentTheme.buttonBg,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Reply
                </button>
              )}

              {msg.createdAt && (
                <p style={{ color: '#555', fontSize: '0.9em', marginTop: '10px' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
