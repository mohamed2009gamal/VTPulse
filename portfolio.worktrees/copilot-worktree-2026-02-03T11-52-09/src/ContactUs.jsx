import { useEffect, useState } from "react";

// components
import Header from "./Components/NavbarSection/NavbarSection";
import Cookies from "./Components/CookiesSection/CookiesSection";
import AIChat from "./Components/AIbotSection/AIbotSection";
import BackToTopButton from "./Components/BackToTopButtonSection/BackToTopButtonSection";
import Footer from "./Components/FooterSection/Footer";
import Loader from "./Components/Loader/Loader";

// styles
import "./contactus_page_style.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
    <div className="contact-form-container">
      <div className="container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="descr">Contact us</div>
          {submitted && (
            <div style={{
              color: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Message sent successfully!
            </div>
          )}
          <div className="input">
            <input
              required
              autoComplete="off"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <label htmlFor="name">Name</label>
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
            <label htmlFor="email">E-mail</label>
          </div>
          <div className="input">
            <textarea
              required
              cols={30}
              rows={1}
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
            />
            <label htmlFor="message">Message</label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send message →'}
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
    <div className="App">
      <Header />
      <ContactForm />

      <Cookies />
      <AIChat />
      <BackToTopButton />
      <Footer />
    </div>
  );
}
