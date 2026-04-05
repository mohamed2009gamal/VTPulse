import { useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  useEffect(() => {
    const header = document.getElementById("header");
    if (!header) return;

    const handleScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header id="header" className="header">
      <div className="logo">
        <h1>
          <span className="venom">Venom</span>
          <span className="tech">Tech</span>
        </h1>
      </div>
    </header>
  );
}

export default Navbar;

