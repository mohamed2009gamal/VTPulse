import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaFacebookF,
  FaGithub,
  FaLinkedinIn,
  FaTwitter
} from "react-icons/fa";
import "./Style.css";

const navigationLinks = [
  { label: "Home",    to: "/" },
  { label: "Blogs",   to: "/blogs" },
  { label: "Contact", to: "/ContactUs" },
];

const socialLinks = [
  { label: "GitHub",   href: "https://github.com/mohamed2009gamal",                  icon: FaGithub },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mohamed-gamal-1a68532b6/", icon: FaLinkedinIn },
  { label: "Facebook", href: "https://www.facebook.com/mohamed.gamal.628346/",       icon: FaFacebookF },
  { label: "X",        href: "https://x.com/Mohamed80192907",                        icon: FaTwitter },
];

function Header() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const location = useLocation();

  /* scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <header id="header" className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      {/* ── Top bar ── */}
      <div className="navbar-shell">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <h1 className="navbar-logo">
            Venom<span>Tech</span>
          </h1>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar-nav" aria-label="Main navigation">
          {navigationLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link${location.pathname === to ? " navbar-link--active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Social icons + hamburger */}
        <div className="navbar-actions">
          <div className="navbar-socials">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="navbar-social-link"
              >
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>

          <button
            className={`navbar-hamburger${menuOpen ? " navbar-hamburger--open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <nav className="navbar-mobile-menu" aria-label="Mobile navigation">
          {navigationLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-mobile-link${location.pathname === to ? " navbar-mobile-link--active" : ""}`}
            >
              {label}
            </Link>
          ))}

          <div className="navbar-mobile-socials">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="navbar-social-link"
              >
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
