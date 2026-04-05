import { useEffect, useState, useRef } from 'react';

import './Style.css';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setMessage("Thanks! Check your email 📩");
      setFormData({ name: "", email: "" });

    } catch (err) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-left">
          <h2 className="logo">Venom<span>Tech</span></h2>
          <p>© 2025 VenomTech. All rights reserved.</p>
        </div>

        <div className="footer-center">
          <h4>Quick links</h4>
          <ul>
            <li><a href="#">Web page</a></li>
            <li><a href="#">Online shop</a></li>
            <li><a href="#">SEO optimization</a></li>
            <li><a href="#">Counseling</a></li>
          </ul>
        </div>

        <div className="footer-right">
          <h4>
            Download online sales trends<br />
            in Your Country for 2025
          </h4>

          <p>
            Enter your email and we will send you our detailed analysis.
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
              placeholder="E-mail address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "I want to receive trends"}
            </button>

            {message && <small>{message}</small>}
          </form>
        </div>

      </div>
    </footer>
  );
};

export default Footer;