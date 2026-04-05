// src/Components/CookiesSection/Cookies.jsx
import { useEffect, useState } from "react";
import { formatTime } from "../utils/formatTime";
import "./Style.css";

export default function CookiesSection() {
  const [seconds, setSeconds] = useState(0);
  const [accepted, setAccepted] = useState(
    localStorage.getItem("cookiesAccepted") === "true"
  );

  // ⏱ Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🚀 Send data when user leaves
  useEffect(() => {
    const sendAnalytics = () => {
      navigator.sendBeacon(
        "http://localhost:5000/analytics",
        JSON.stringify({
          timeSpent: seconds,
          cookiesAccepted: accepted,
        })
      );
    };

    window.addEventListener("beforeunload", sendAnalytics);
    return () =>
      window.removeEventListener("beforeunload", sendAnalytics);
  }, [seconds, accepted]);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="cookie-wrapper">
      <div className="cookies-card">
        <p className="cookieHeading">We use cookies 🍪</p>

        <p className="cookieDescription">
          Time spent on site:
          <br />
          <strong>{formatTime(seconds)}</strong>
        </p>

        <div className="buttonContainer">
          <button className="acceptButton" onClick={acceptCookies}>
            Allow
          </button>
          <button className="declineButton">Decline</button>
        </div>
      </div>
    </div>
  );
}
