import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import AboutImage1 from "./imgs/img1.png";
import AboutImage2 from "./imgs/img2.png";
import AboutImage3 from "./imgs/img3.png";

import "./Style.css";

const services = [
  {
    img: "https://cdn-icons-png.flaticon.com/512/2721/2721290.png",
    title: "Programming",
    desc: "Modern, clean code across platforms and stacks."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/1903/1903162.png",
    title: "Project Management",
    desc: "Agile workflow and client-focused delivery."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/1828/1828864.png",
    title: "Design",
    desc: "Clean UI/UX that looks premium and usable."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/888/888879.png",
    title: "Remote Work",
    desc: "Timezone-friendly and fully remote workflow."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
    title: "AI Research",
    desc: "Smart systems powered by AI & ML, tailored to your needs."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/888/888847.png",
    title: "Consulting",
    desc: "Expert advice to elevate your tech projects."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/888/888870.png",
    title: "DevOps",
    desc: "Streamlined deployment and infrastructure."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/888/888841.png",
    title: "Testing",
    desc: "Robust testing for reliable software, ensuring quality."
  },
  {
    img: "https://cdn-icons-png.flaticon.com/512/888/888857.png",
    title: "Maintenance",
    desc: "Ongoing support and updates, keeping systems optimal."
  }
];

export default function AboutUsSection() {

  // 🔹 refs for scroll animation
  const animatedRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          } else {
            entry.target.classList.remove("show"); // repeat on every scroll
          }
        });
      },
      { threshold: 0.25 }
    );

    animatedRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="about-us">

      {/* ================= HEADER ================= */}
      <div className="section-subtitle">
        <hr />
        <div className="titles-wrapper">
          <h1><span>Who </span>Am I?</h1>
          <hr />
          <h2>About <span>Me...</span></h2>
        </div>
      </div>

      <p>
        I'm <strong>``Mohamed Gamal,,</strong> — Developer & Digital Architect
      </p>

      <p className="paragraph">
        With a passion for crafting elegant digital solutions, I specialize in
        transforming ideas into functional, user-friendly applications.
      </p>

      {/* ================= SERVICES ================= */}
      <div className="scroll-wrapper">
        <div className="card-3d">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="service-card"
              style={{
                transform: `rotateY(${index * (360 / services.length)}deg) translateZ(360px)`
              }}
            >
              <img src={service.img} alt={service.title} />
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
              <div className="card-button-wrapper">
                <button className="card-button">
                  <span>Read More →</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= PROJECTS ================= */}
      <div className="projects-title">
        <h1>Projects <span color="blue">Done</span></h1>
        <hr />
      </div>

      <div className="projects-stats">
        {[
          ["9", "Completed Projects"],
          ["5", "Happy Clients"],
          ["1", "Ongoing Projects"],
          ["1", "Awards Won"],
          ["7", "Certifications"],
          ["7", "Technologies Used"],
          ["6", "GitHub Repositories"],
          ["531+", "Cups of Coffee Fueling Code"]
        ].map(([num, label]) => (
          <div className="projects-grid" key={label}>
            <h1>{num}</h1>
            <p>{label}</p>
          </div>
        ))}
      </div>


      {/* ================= ABOUT CONTENT ================= */}
      <div className="end-title">
        <hr />
        <h2>
          Ready to <span>Start</span> Your Project?, <h1>
            Let's <span color="blue">Work</span> Together!
          </h1>
        </h2>
        <hr />
      </div>
      <section className="end-section">
        <div className="end-content">

          <div className="about-content">

            {/* TEXT + IMAGE 1 */}
            <div
              className="about-texts_1 animate-container"
              ref={el => animatedRefs.current[0] = el}
            >
              <span className="about-text_1 animate-text-right">
                I am Mohamed, a motivated and detail-oriented web developer with a strong
                passion for building clean, modern, and functional digital experiences.
              </span>
              <img
                className="about-image_1 animate-image-left"
                src={AboutImage1}
                alt="About Me"
              />
            </div>

            {/* TEXT + IMAGE 2 */}
            <div
              className="about-texts_2 animate-container"
              ref={el => animatedRefs.current[1] = el}
            >
              <img
                className="about-image_2 animate-image-right"
                src={AboutImage2}
                alt="About Me"
              />
              <span className="about-text_2 animate-text-left">
                With a keen eye for design and clean code, I create seamless user experiences
                using modern front-end technologies, especially React.
                and clean code, I am dedicated to crafting seamless user experiences using modern front-end technologies.
              </span>
            </div>

            {/* TEXT + IMAGE 3 */}
            <div
              className="about-texts_3 animate-container"
              ref={el => animatedRefs.current[2] = el}
            >
              <span className="about-text_3 animate-text-right">
                Whether solo or in a team, I'm committed to delivering quality work
                and exceeding expectations, always eager to learn and grow in the ever-evolving tech landscape.
              </span>
              <img
                className="about-image_3 animate-image-left"
                src={AboutImage3}
                alt="About Me"
              />
            </div>

            <section className="about-us-more">
              <div className="about-content">
                <p>I'm Mohamed, a front-end developer passionate about creating interactive and user-friendly web experiences.</p>
                <p>Specialized in React, JavaScript, and modern web technologies, I enjoy turning ideas into functional digital solutions.</p>
                <p>I believe in writing clean, maintainable code while delivering projects that make an impact.</p>
                <p>When I'm not coding, I explore photography, AI experiments, and creative digital designs.</p>
              </div>
            </section>

            {/* CTA */}
            <Link to="/ContactUs">
              <button className="cta-btn">
                <span className="cta-text">Contact Me</span>

                <div className="cta-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path
                      fill="currentColor"
                      d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    />
                  </svg>
                </div>
              </button>
            </Link>


          </div>
        </div>
      </section>
    </section>
  );
}
