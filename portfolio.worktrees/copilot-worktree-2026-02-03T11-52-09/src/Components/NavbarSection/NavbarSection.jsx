import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import "./Style.css";

function Header() {
  useEffect(() => {
    const header = document.getElementById("header");
    const checkbox = document.getElementById("checkbox");

    if (!header || !checkbox) return;

    const handleScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 50);
    };

    const closeMenu = () => {
      checkbox.checked = false;
    };

    window.addEventListener("scroll", handleScroll);

    document
      .querySelectorAll(".nav-links a")
      .forEach(link => link.addEventListener("click", closeMenu));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document
        .querySelectorAll(".nav-links a")
        .forEach(link => link.removeEventListener("click", closeMenu));
    };
  }, []);

  return (
    <header id="header" className="header">
      <div className="logo">
        <h1>
          <span className="venom">Venom</span>
          <span className="tech">Tech</span>
        </h1>
      </div>

      <nav>
        <input type="checkbox" id="checkbox" />

        <label htmlFor="checkbox" className="toggle" aria-label="Menu">
          <span className="bars" id="bar1" />
          <span className="bars" id="bar2" />
          <span className="bars" id="bar3" />
        </label>

        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#services">Services</a></li>
          <li><NavLink to="/ContactUs">Contact</NavLink></li>
          <li><a href="#portfolio">Portfolio</a></li>
          <li><NavLink to="/blogs">Blog</NavLink></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li>
            <a
              href="https://github.com/mohamed2009gamal"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-github" /> GitHub
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
