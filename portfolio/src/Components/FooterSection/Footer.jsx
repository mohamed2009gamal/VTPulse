import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaEnvelope,
  FaFacebookF,
  FaGithub,
  FaLinkedinIn,
  FaTwitter
} from 'react-icons/fa';

import './Style.css';

const navigationLinks = [
  { label: 'Home', to: '/' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'Contact', to: '/ContactUs' },
  { label: 'Dashboard', to: '/admin' }
];

const focusAreas = [
  'Portfolio experiences',
  'User experience design',
  'Blog publishing flow',
  'Responsive UI systems'
];

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/mohamed2009gamal',
    icon: FaGithub
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mohamed-gamal-1a68532b6/',
    icon: FaLinkedinIn
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/mohamed.gamal.628346/',
    icon: FaFacebookF
  },
  {
    label: 'X',
    href: 'https://x.com/Mohamed80192907',
    icon: FaTwitter
  }
];

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('http://localhost:5000/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to subscribe right now.');
      }

      setMessageType('success');
      setMessage('Thanks. Check your email for the update.');
      setFormData({ name: '', email: '' });
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-topline">
          <span className="footer-kicker">Built for clean UI, to improve user experience</span>
          <a className="footer-contact-link" href="mailto:mohamedgamal2512009@gmail.com">
            <FaEnvelope aria-hidden="true" />
            <span>mohamedgamal2512009@gmail.com</span>
          </a>
        </div>

        <div className="footer-container">
          <div className="footer-left">
            <h2 className="logo">
              Venom<span>Tech</span>
            </h2>
            <p>
              A portfolio playground for polished interfaces, blog systems, and tools
              that stay useful after launch.
            </p>

            <div className="footer-socials">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-center">
            <div className="footer-links-group">
              <h4>Navigate</h4>
              <ul>
                {navigationLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Focus</h4>
              <ul>
                {focusAreas.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-right">
            <div className="footer-card-eyebrow">Newsletter</div>
            <h4>Get the next product note before it lands on the site.</h4>
            <p>
              Leave your name and email to receive short updates about portfolio improvements,
              blog releases, and dashboard work.
            </p>

            <form className="footer-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <button type="submit" disabled={loading}>
                <span>{loading ? 'Sending...' : 'Subscribe now'}</span>
                <FaArrowRight aria-hidden="true" />
              </button>

              {message ? (
                <small className={`footer-message footer-message-${messageType}`.trim()}>{message}</small>
              ) : null}
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{currentYear} VenomTech. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/ContactUs">Contact</Link>
            <Link to="/Blogs">Blogs</Link>
            <Link to="/privacy">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
