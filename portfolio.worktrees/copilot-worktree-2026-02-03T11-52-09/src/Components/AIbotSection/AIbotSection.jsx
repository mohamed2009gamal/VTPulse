
import React, { useState, useEffect, useRef } from "react";

import "./Style.css";


const AIChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I’m your AI assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
  };

  return (
    <>
      {/* Floating AI Button */}
      {!showChat && (
        <button
          className={`ai-fab ${scrolled ? "scrolled" : ""}`}
          onClick={() => setShowChat(true)}
          aria-label="Open AI chat"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      <div className={`ai-chat ${showChat ? "open" : ""}`}>
        <div className="ai-chat-header">
          <span>AI Assistant</span>
          <button onClick={() => setShowChat(false)}>&times;</button>
        </div>

        <div className="ai-chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.from}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
          />
          <button onClick={handleSend}>➤</button>
        </div>
      </div>
    </>
  );
};




export default AIChat;