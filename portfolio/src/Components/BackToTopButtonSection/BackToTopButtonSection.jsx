import React, { useEffect, useRef, useState } from "react";
import "./Style.css";

function BackToTopButton({ className = "" }) {
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const findScrollContainer = () => {
      const tried = new Set();
      const candidates = [];

      if (document.scrollingElement) {
        candidates.push(document.scrollingElement);
      }
      candidates.push(document.documentElement, document.body);
      Array.from(document.body?.children ?? []).forEach((element) => {
        candidates.push(element);
      });

      for (const element of candidates) {
        if (!element || tried.has(element)) continue;
        tried.add(element);

        try {
          const style = window.getComputedStyle(element);
          const overflowY = style?.overflowY ?? "";
          const canScroll = element.scrollHeight > element.clientHeight + 1;
          const overflowAllows = /auto|scroll|overlay/.test(overflowY);

          if (canScroll && overflowAllows) {
            return element;
          }
        } catch (error) {
          // Ignore detached/inaccessible nodes and keep checking candidates.
        }
      }

      return document.scrollingElement || document.documentElement || document.body;
    };

    const getScrollTop = () => {
      const element = scrollRef.current;
      if (!element) {
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      }

      return typeof element.scrollTop === "number"
        ? element.scrollTop
        : window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    };

    scrollRef.current = findScrollContainer();

    const toggleVisibility = () => {
      setVisible(getScrollTop() > 50);
    };

    toggleVisibility();

    const target = scrollRef.current?.addEventListener ? scrollRef.current : window;

    target.addEventListener("scroll", toggleVisibility, { passive: true });
    if (target !== window) {
      window.addEventListener("scroll", toggleVisibility, { passive: true });
    }
    window.addEventListener("resize", toggleVisibility, { passive: true });

    return () => {
      target.removeEventListener("scroll", toggleVisibility);
      if (target !== window) {
        window.removeEventListener("scroll", toggleVisibility);
      }
      window.removeEventListener("resize", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    const element = scrollRef.current;

    if (element && typeof element.scrollTo === "function") {
      element.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <button
        className={`backtotopbutton ${visible ? "show" : ""} ${className}`.trim()}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg className="svgIcon" viewBox="0 0 384 512">
          <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
        </svg>
      </button>
    </div>
  );
}

export default BackToTopButton;

