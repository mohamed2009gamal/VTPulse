import React, { useEffect, useState, useRef } from 'react';
import { Link } from "react-router-dom";

import Loader from '../Loader/Loader';

import './Style.css';

import Footer from '../FooterSection/Footer';
import BackToTopButton from '../BackToTopButtonSection/BackToTopButtonSection';
import AboutUsSectionLinks from '../AboutUsSectionLink/AboutUsSectionLinks';
import AIChat from '../AIbotSection/AIbotSection';


function Header() {
    useEffect(() => {
        const header = document.getElementById("header");
        const checkbox = document.getElementById("checkbox");
        const navLinks = document.querySelector(".nav-links");

        const toggleMenu = () => {
            if (checkbox.checked) {
                navLinks.classList.add("show");
            } else {
                navLinks.classList.remove("show");
            }
        };

        const handleScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        };

        checkbox.addEventListener("change", toggleMenu);
        window.addEventListener("scroll", handleScroll);

        return () => {
            checkbox.removeEventListener("change", toggleMenu);
            window.removeEventListener("scroll", handleScroll);
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
                <label htmlFor="checkbox" className="toggle">
                    <div className="bars" id="bar1"></div>
                    <div className="bars" id="bar2"></div>
                    <div className="bars" id="bar3"></div>
                </label>

                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="#about">About Us</a></li>
                    <li><a href="/ContactUs">Contact</a></li>
                    <li><a href="#blog">Blog</a></li>
                    <li><a className='active'>Invalid link</a></li>
                    <li>
                        <a href="https://github.com/mohamed2009gamal" target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-github" /> GitHub
                        </a>
                    </li>
                </ul>
            </nav>
        </header>
    );
}



function Card() {
    return (
        <div class="undefined-page-not-found-container">
            <div class="undefined-card">

                <div class="card">
                    <p class="error-message">Page Not Found</p>
                    <div class="error-title">
                        <div class="error-item">
                            <span aria-hidden="true">4O4</span>
                            <span aria-hidden="true" class="error-glitch">4O4</span>
                            <span aria-hidden="true" class="error-glitch error-glitch--secondary">4O4</span>
                        </div>
                        <div class="error-item">
                            <span aria-hidden="true">Error</span>
                            <span aria-hidden="true" class="error-glitch">Error</span>
                            <span aria-hidden="true" class="error-glitch error-glitch--secondary">Error</span>
                        </div>
                    </div>
                    <div class="error-description">
                        <div className="undefined-error-description">
                            The requested page could not be found, Go to{' '}
                            <Link to="/" className="undefined-home-link">
                                Home Page
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}





export default function PageNotFound() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    // ✅ Show loader first
    if (loading) {
        return <Loader />;
    }
    return (
        <div>
            <title>
                Invaild Link | VENOMTECH
            </title>
            <Header />
            <BackToTopButton />
            <AboutUsSectionLinks />
            <AIChat />
            <Card />
            <Footer />
        </div>
    );
}