import { useEffect, useState } from "react";

// components
import Header from "./Components/NavbarSection/NavbarSection";
import Cookies from "./Components/CookiesSection/CookiesSection";
import AIChat from "./Components/AIbotSection/AIbotSection";
import BackToTopButton from "./Components/BackToTopButtonSection/BackToTopButtonSection";
import Footer from "./Components/FooterSection/Footer";
import Loader from "./Components/Loader/Loader";

// styles
import "./App.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    message: '',
    privacy: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // simple validation for MVP
    if (!formData.email || !formData.message) {
      alert('Email and message are required.');
      return;
    }
    if (!formData.privacy) {
      alert('Please agree to the privacy policy.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // send all collected fields to backend. backend schema may ignore extras.
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-section">
      <div className="contact-info">
        <h2>Get in touch</h2>
        <p><i className="fas fa-map-marker-alt" /> 123 Developer Lane, Code City, Earth</p>
        <p><i className="fas fa-envelope" /> support@example.com</p>
        <p><i className="fas fa-phone" /> +1 (555) 123‑4567</p>
        <p><i className="fas fa-clock" /> Mon – Fri 9am – 5pm</p>
        <div className="social-icons">
          <button type="button" aria-label="GitHub"><i className="fab fa-github" /></button>
          <button type="button" aria-label="Twitter"><i className="fab fa-twitter" /></button>
          <button type="button" aria-label="LinkedIn"><i className="fab fa-linkedin" /></button>
        </div>
      </div>
      <div className="contact-form-panel">
        <form onSubmit={handleSubmit}>
          <div className="descr">Send a message</div>
          {submitted && (
            <div className="success-msg">
              Message sent successfully!
            </div>
          )}
          <div className="input-group">
            <div className="input-half">
              <input
                required
                autoComplete="off"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              <label htmlFor="firstName">First Name</label>
            </div>
            <div className="input-half">
              <input
                autoComplete="off"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
              <label htmlFor="lastName">Last Name</label>
            </div>
          </div>
          <div className="input">
            <input
              autoComplete="off"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
            <label htmlFor="company">Company</label>
          </div>
          <div className="input">
            <input
              required
              autoComplete="off"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <label htmlFor="email">Email *</label>
          </div>
          <div className="input">
            <input
              autoComplete="off"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
            <label htmlFor="phone">Phone</label>
          </div>
          <div className="input">
            <textarea
              required
              cols={30}
              rows={4}
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
            />
            <label htmlFor="message">Message *</label>
          </div>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="privacy"
                checked={formData.privacy}
                onChange={handleChange}
              />{' '}
              I agree to the <a href="/privacy">privacy policy</a>.
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ContactUsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Contact Us | VENOMTECH"; // ✅ correct way

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Loader screen
  if (loading) {
    return <Loader />;
  }

  // ✅ Page content
  return (
    <div className="page-shell contact-page">
      <Header />
      <ContactForm />

      <Cookies />
      <AIChat />
      <BackToTopButton />
      <Footer />
    </div>
  );
}
