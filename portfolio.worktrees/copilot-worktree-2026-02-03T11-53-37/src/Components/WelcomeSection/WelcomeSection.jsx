import React, { useState, useEffect, useRef } from "react";
import IntroPageImage from "./imgs/me5.png";
import "./Style.css";

function WelcomeSection() {
  const texts = [
    "Hi Sir!",
    "Welcome To",
    "I need your feedback for better features!",
    "Enjoy your trip in my website!",
    "I'm Mohamed Gamal, a passionate developer."
  ];

  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const delay = 150;

  const sectionRef = useRef(null);

  /* =========================
     Typing Effect
  ========================= */
  useEffect(() => {
    let timeout;
    const currentText = texts[textIndex];

    if (!deleting && charIndex === currentText.length) {
      timeout = setTimeout(() => setDeleting(true), 3000);
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
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, textIndex]);

  /* =========================
     Scroll Animation Observer
  ========================= */
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

    const elements = sectionRef.current.querySelectorAll(
      ".img-card, .welcoming .title, .welcoming .name, .welcoming .intro, .welcoming .intro_1"
    );

    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  /* =========================
     SCROLL BUTTON LOGIC (kept, inactive)
  ========================= */
  useEffect(() => {
    const scrollBtn = document.querySelector(".main__scroll");
    const scrollWrapper = document.querySelector(".main__action");

    if (!scrollBtn || !scrollWrapper) return;

    const handleClick = (e) => {
      e.preventDefault();
      window.scrollBy({
        top: 220,
        behavior: "smooth",
      });
    };

    const handleScroll = () => {
      if (window.scrollY > 40) {
        scrollWrapper.classList.add("hidden");
      } else {
        scrollWrapper.classList.remove("hidden");
      }
    };

    scrollBtn.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll);

    return () => {
      scrollBtn.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="welcoming-section-main-container" ref={sectionRef}>
      <section className="container" id="home">
        <div className="img-card">
          <section className="image-section">
            <div className="img-card">
              <img
                src={IntroPageImage}
                alt="Mohamed Gamal"
                className="img"
              />

              <div className="img-text">
                <h2>Mohamed Gamal</h2>
                <p>Creative developer delivering smart tech solutions.</p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="welcoming">
        <div className="title">
          <h2>
            {displayText}
            <span className="cursor"></span>
          </h2>
          <h1 color="white">Venom<span color="blue">Tech</span></h1>
        </div>

        <h2 className="name">``Mohamed Gamal,,</h2>

        <p className="intro">
          Hello, I'm <strong color="white">Mohamed Gamal</strong> — a passionate developer,
          creative thinker, and tech enthusiast who loves transforming bold ideas
          into digital reality.
        </p>

        <p className="intro">
          I specialize in crafting modern, responsive websites, intuitive
          interfaces, and innovative web solutions that not only look great but
          also deliver seamless user experiences.
        </p>

        <p className="intro_1">
          Whether you're building a personal brand, launching a startup, or
          tackling a technical challenge, I'm here to bring your vision to life
          with clean code and creative design.
        </p>
        <div className="btn-wrapper">
          <div className="btn-group">
            <button className="gradient-btn">
              <span className="gradient-border"></span>

              <span className="btn-content">
                <div className="btn-inner">
                  <span className="btn-text">Let's get started</span>

                  <svg
                    className="btn-icon"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    />
                  </svg>
                </div>
              </span>
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}

export default WelcomeSection;

