import React, { useEffect, useState, useRef } from "react";
import "./Style.css";

function ScrollButton() {
  const [enabled, setEnabled] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let rafId = null;

    const findScrollContainer = () => {
      const tried = new Set();
      const candidates = [];
      if (document.scrollingElement) candidates.push(document.scrollingElement);
      candidates.push(document.documentElement);
      candidates.push(document.body);
      Array.from(document.body.children).forEach((c) => candidates.push(c));

      for (const el of candidates) {
        if (!el || tried.has(el)) continue;
        tried.add(el);
        try {
          const style = window.getComputedStyle(el);
          const overflowY = style && style.overflowY ? style.overflowY : "";
          const canScroll = el.scrollHeight > el.clientHeight + 1;
          const overflowAllows = /auto|scroll|overlay/.test(overflowY);
          if (canScroll && overflowAllows) return el;
        } catch (e) {
          // ignore
        }
      }

      // fallback
      return document.scrollingElement || document.documentElement || document.body;
    };

    const detected = findScrollContainer();
    scrollRef.current = detected;

    const getScrollTop = () => {
      const el = scrollRef.current;
      if (!el) return window.pageYOffset || document.documentElement.scrollTop || 0;
      // document.scrollingElement and document.documentElement support scrollTop
      return typeof el.scrollTop === "number" ? el.scrollTop : 0;
    };

    const getClientHeight = () => {
      const el = scrollRef.current;
      return (el && el.clientHeight) || window.innerHeight;
    };

    const getScrollHeight = () => {
      const el = scrollRef.current;
      return (el && el.scrollHeight) || document.documentElement.scrollHeight;
    };

    const handleScroll = () => {
      const scrollY = getScrollTop();
      const innerHeight = getClientHeight();
      const scrollHeight = getScrollHeight();

      // Show when near the top (<=50px) or on short pages.
      const isNearTop = scrollY <= 50;
      const isShortPage = scrollHeight <= innerHeight + 200;
      const shouldShow = isNearTop || isShortPage;

      setEnabled(shouldShow);
    };

    const throttled = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    // run once on mount to set initial visibility
    handleScroll();

    // attach listeners on the detected element or window fallback
    const target = scrollRef.current && scrollRef.current.addEventListener ? scrollRef.current : window;

    target.addEventListener("scroll", throttled, { passive: true });
    target.addEventListener("wheel", throttled, { passive: true });
    target.addEventListener("touchmove", throttled, { passive: true });

    // also listen on window as a fallback (some browsers fire on window)
    if (target !== window) {
      window.addEventListener("scroll", throttled, { passive: true });
    }

    return () => {
      target.removeEventListener("scroll", throttled);
      target.removeEventListener("wheel", throttled);
      target.removeEventListener("touchmove", throttled);
      if (target !== window) window.removeEventListener("scroll", throttled);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleClick = () => {
    const el = scrollRef.current;
    // prefer element scrolling when available
    if (el && typeof el.scrollBy === "function") {
      try {
        el.scrollBy({ top: 400, behavior: "smooth" });
        return;
      } catch (e) {
        // fallthrough
      }
    }

    // fallback to window
    window.scrollBy({ top: 200, behavior: "smooth" });
  };

  return (
    <div className={`main__action ${enabled ? "" : "hidden"}`}>
      <button
        type="button"
        className="main__scroll"
        onClick={handleClick}
        aria-label="Scroll down"
        style={{ pointerEvents: enabled ? "auto" : "none" }}
      >
        <div className="main__scroll-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="38"
            height="38"
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            style={{ cursor: "pointer", pointerEvents: "auto" }}
            aria-hidden="true"
            focusable="false"
          >
            <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            <path fill="currentColor" d="M7.41 4.59 12 9.17l4.59-4.58L18 6l-6 6-6-6z" />
          </svg>
        </div>
      </button>
    </div>
  );
}

export default ScrollButton;
