import { useEffect, useState } from "react";
import "./Style.css";

function ScrollButton() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setEnabled(true);   // at top → enable
      } else {
        setEnabled(false);  // scrolled → disable
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    if (!enabled) return;

    window.scrollBy({
      top: 180,
      behavior: "smooth",
    });
  };

  if (!enabled) return null;

  return (
    <div className="main__action">
      <a className="main__scroll" onClick={handleClick}>
        <div className="main__scroll-box">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12 15.5L6 9.5l1.4-1.4L12 12.7l4.6-4.6L18 9.5z"
              fill="rgba(255,255,255,0.9)"
            />
          </svg>
        </div>
      </a>
    </div>
  );
}

export default ScrollButton;
