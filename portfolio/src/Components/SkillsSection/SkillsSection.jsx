import { useEffect, useRef } from "react";
import "./Style.css";

function SkillsSection() {
  const sectionRef = useRef(null);

  const skillCards = [
    {
      title: "Programming Languages",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
      ),
      items: [
        { name: "JavaScript", percentage: "20%" },
        { name: "Python", percentage: "90%" },
        { name: "TypeScript", percentage: "55%" },
        { name: "C++", percentage: "85%" },
        { name: "HTML & CSS", percentage: "99%" },
        { name: "Bash/Shell/CMD", percentage: "60%" },
        { name: "PHP", percentage: "5%" },

      ],
    },
    {
      title: "Frameworks",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M8.464 8.464a4 4 0 015.656 0" />
        </svg>
      ),
      items: [
        { name: "React.js", percentage: "90%" },
        { name: "Next.js", percentage: "40%" },
        { name: "Tailwind CSS", percentage: "90%" },
      ],
    },
    {
      title: "Tools",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2H5v-2h4v-2H5V9h4V7l5 5-5 5z" />
        </svg>
      ),
      items: [
        { name: "GitHub", percentage: "95%" },
        { name: "VS Code", percentage: "90%" },
        { name: "Figma", percentage: "40%" },
        { name: "AWS", percentage: "20%" },
        { name: "Google Cloud", percentage: "70%" },
        { name: "Kali Lenux", percentage: "40%" },
      ],
    },
    {
      title: "Soft Skills",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m2-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      items: [
        { name: "Problem Solving", percentage: "90%" },
        { name: "Teamwork", percentage: "95%" },
        { name: "UI Design", percentage: "35%" },
        { name: "Communication", percentage: "90%" },
        { name: "Creativity", percentage: "80%" },
        { name: "Adaptability", percentage: "85%" },
        { name: "Time Management", percentage: "75%" },
        { name: "Remote Work", percentage: "75%" },
      ],
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) {
            el.classList.add("show");
            const bars = el.querySelectorAll(".progress-bar-inner");
            bars.forEach((bar) => {
              const width = bar.getAttribute("data-width");
              bar.style.width = width;
            });
          } else {
            el.classList.remove("show");
            const bars = el.querySelectorAll(".progress-bar-inner");
            bars.forEach((bar) => (bar.style.width = "0"));
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = sectionRef.current.querySelectorAll(".skill-card");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="skills-section">
      <div className="skills-container">
        {skillCards.map((card, idx) => (
          <div key={idx} className="skill-card">
            <div className="skill-header">
              <div className="skill-icon">{card.icon}</div>
              <h3 className="skill-title">{card.title}</h3>
            </div>
            <ul className="skill-items">
              {card.items.map((item, i) => (
                <li key={i} className="skill-item">
                  <div className="skill-item-label">
                    <span>{item.name}</span>
                    <span>{item.percentage}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-inner"
                      data-width={item.percentage}
                      style={{ width: 0 }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}


export default SkillsSection;