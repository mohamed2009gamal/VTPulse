import React, { useState, useEffect, useRef } from "react";
import { useTheme } from '../../contexts/ThemeContext';
import "./Style.css";

// Import images
import PC1Dark from "./Images/PC/PC_FIRST_BACKGROUNDS/PC_FIRST_DARK_BACKGROUND.png";
import PC1Light from "./Images/PC/PC_FIRST_BACKGROUNDS/PC_FIRST_LIGHT_BACKGROUND.png";
import PC2Dark from "./Images/PC/PC_SEC_BACKGROUNDS/PC_SEC_DARK_BACKGROUND.png";
import PC2Light from "./Images/PC/PC_SEC_BACKGROUNDS/PC_SEC_LIGHT_BACKGROUND.png";
import PC3Dark from "./Images/PC/PC_THIRD_BACKGROUNDS/PC_THIRD_DARK_BACKGROUND.png";
import PC3Light from "./Images/PC/PC_THIRD_BACKGROUNDS/PC_THIRD_LIGHT_BACKGROUND.png";

const DARK_IMAGES = [PC1Dark, PC2Dark, PC3Dark];
const LIGHT_IMAGES = [PC1Light, PC2Light, PC3Light];

const TEXTS = [
  "Full-Stack Developer crafting modern web experiences with React, Node.js, and cutting-edge design.",
  "Transforming ideas into pixel-perfect, responsive digital solutions that drive results.",
  "Passionate about clean code, intuitive UX, and building products that users love."
];

function WelcomeSection() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const sectionRef = useRef(null);
  const { theme } = useTheme();

  // Theme detection and background update
  useEffect(() => {
    const checkTheme = () => {
      const rootTheme = document.documentElement.getAttribute('data-theme') === 'dark';
      const backgrounds = {
        dark: '#000000',
        light: '#ffffff'
      };
      document.body.style.background = backgrounds[rootTheme ? 'dark' : 'light'];
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Background cycle every 45s
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentBgIndex((prev) => (prev + 1) % 3);
      setCharIndex(0);
      setDeleting(false);
      setDisplayText('');
    }, 45000);
    return () => clearTimeout(timeout);
  }, [currentBgIndex]);

  // Typing effect
  useEffect(() => {
    let timeout;
    const currentText = TEXTS[currentBgIndex];

    if (!deleting && charIndex === currentText.length) {
      timeout = setTimeout(() => setDeleting(true), 5000);
      return () => clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (!deleting) {
        setDisplayText(currentText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else {
        setDisplayText(currentText.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
        if (charIndex - 1 === 0) {
          setDeleting(false);
        }
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, currentBgIndex]);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) el.classList.add("show");
          else el.classList.remove("show");
        });
      },
      { threshold: 0.2 }
    );

    const elements = sectionRef.current?.querySelectorAll(".title, .name, .btn-wrapper");
    elements?.forEach((el) => observer.observe(el));
    return () => elements?.forEach((el) => observer.unobserve(el));
  }, []);

  const currentImage = theme === 'dark' ? DARK_IMAGES[currentBgIndex] : LIGHT_IMAGES[currentBgIndex];

  return (
    <main className="welcoming-section-main-container" ref={sectionRef} style={{ backgroundImage: `url(${currentImage})` }}>
      <div className="landing-hero-shell">
        <section className="landing-card">
          <div className="content-overlay">
            <div className="welcoming">
              <div className="title">
                <h2 className="typing-text">
                  {displayText}
                </h2>
                <h1>Venom<span>Tech</span></h1>
              </div>

              <h2 className="name">Mohamed Gamal</h2>

              <div className="btn-wrapper">
                <div className="btn-group">
                  <button className="gradient-btn">
                    <span className="gradient-border"></span>
                    <span className="btn-content">
                      <div className="btn-inner">
                        <span className="btn-text">Let's get started</span>
                        <svg className="btn-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06Z" />
                        </svg>
                      </div>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default WelcomeSection;

