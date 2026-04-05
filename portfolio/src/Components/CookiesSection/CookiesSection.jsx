import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { BACKEND_BASE } from '../../services/api';

const slideInUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }
`;

const CookiesWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999999;
  animation: ${slideInUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const CookieCard = styled.div`
  max-width: 360px;
  padding: 1.5rem;
  background-color: var(--cardBg, #ffffff);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: ${pulse} 2s ease-in-out infinite;
  color: var(--text, #1f2937);
`;

const Title = styled.span`
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text, #1f2937);
`;

const Description = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--muted, #6b7280);
  margin-bottom: 1rem;
`;

const Link = styled.a`
  color: var(--accent, #3b82f6);
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
    color: var(--linkActive, #1d4ed8);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const AcceptButton = styled.button`
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, var(--buttonBg, #3b82f6), var(--accent, #1d4ed8));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  &:focus {
    outline: 2px solid var(--ring, rgba(59, 130, 246, 0.5));
    outline-offset: 2px;
  }
`;

const DeclineButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: var(--muted, #6b7280);
  border: 1px solid var(--inputBorder, #d1d5db);
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: var(--hoverBg, rgba(0, 0, 0, 0.05));
    color: var(--text, #1f2937);
  }
`;

const CookiesSection = () => {
  const [accepted, setAccepted] = useState(false);

  const recordChoice = async (status) => {
    try {
      await fetch(`${BACKEND_BASE}/api/track/cookie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        keepalive: true
      });
    } catch (error) {
      // ignore tracking failures for consent UI
    }
  };

  useEffect(() => {
    const cookieChoice = localStorage.getItem('cookiesAccepted');
    setAccepted(cookieChoice !== null);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setAccepted(true);
    recordChoice('accepted');
  };

  const declineCookies = () => {
    // Optional: set expiration or other logic
    localStorage.setItem('cookiesAccepted', 'false');
    setAccepted(true);
    recordChoice('rejected');
  };

  if (accepted) return null;

  return (
    <CookiesWrapper>
      <CookieCard>
        <Title>🍪 We use cookies</Title>
        <Description>
          We use cookies to ensure you get the best experience on our website.{' '}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer">
            Read our privacy policy
          </Link>
        </Description>
        <Actions>
          <DeclineButton onClick={declineCookies}>
            Decline
          </DeclineButton>
          <AcceptButton onClick={acceptCookies}>
            Accept
          </AcceptButton>
        </Actions>
      </CookieCard>
    </CookiesWrapper>
  );
};

export default CookiesSection;

