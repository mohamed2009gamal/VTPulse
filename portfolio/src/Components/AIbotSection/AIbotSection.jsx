import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Style.css";

const AIChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I'm your AI assistant powered by ChatGPT. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showChat) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput("");
    const newMessages = [...messages, { from: "user", text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Build conversation for API
    const conversation = newMessages.slice(1).map(m => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text
    }));

    try {
      const response = await fetch('http://localhost:4000/api/chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: conversation }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { from: "bot", text: data.reply || "No response from AI" }]);
      } else {
        setMessages(prev => [...prev, { from: "bot", text: `Error: ${data.error || 'Unknown error'}` }]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages(prev => [...prev, { from: "bot", text: "Network error. Is backend running on port 4000?" }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  return (
    <>
      {/* Floating AI Button */}
      {!showChat && (
        <button
          className={`ai-fab ${scrolled ? "scrolled" : ""}`}
          onClick={() => setShowChat(true)}
          aria-label="Open ChatGPT Assistant"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}

      <div
        className={`ai-chat-backdrop ${showChat ? "open" : ""}`}
        onClick={() => showChat && setShowChat(false)}
        aria-hidden="true"
      />

      {/* Chat Window */}
      <div className={`ai-chat ${showChat ? "open" : ""}`} role="dialog" aria-modal={showChat}>
        <div className="ai-chat-header">
          <span>🤖 ChatGPT Assistant</span>
          <button onClick={() => setShowChat(false)}>&times;</button>
        </div>

        <div className="ai-chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.from}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && <div className="msg bot">AI is thinking... ⏳</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            maxLength={1000}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? "⏳" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChat;

