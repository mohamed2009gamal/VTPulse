import React from "react";

import "./Style.css";

const MyJourneySection = () => {
  const educationData = [
    { year: "2018 - 2020", title: "Master Degree - University", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
    { year: "2015 - 2018", title: "Bachelor Degree - University", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
    { year: "2012 - 2015", title: "High School - City Name", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
  ];

  const experienceData = [
    { year: "2020 - 2023", title: "Web Developer - Company", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
    { year: "2018 - 2020", title: "Frontend Developer - Firm", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
    { year: "2015 - 2018", title: "Intern - Tech Corp", desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi aliquam nulla vero iure." },
  ];

  const renderCards = (data) =>
    data.map((item, index) => (
      <div className="card" key={index}>
        <span className="year">{item.year}</span>
        <h3 className="card-title">{item.title}</h3>
        <p className="card-desc">{item.desc}</p>
      </div>
    ));

  return (
    <section className="journey-section">
      <h2 className="journey-title">
        My <span>Journey</span>
      </h2>
      <div className="journey-container">
        <div className="journey-column">
          <h3 className="column-title">Education</h3>
          {renderCards(educationData)}
        </div>
        <div className="journey-column">
          <h3 className="column-title">Experience</h3>
          {renderCards(experienceData)}
        </div>
      </div>
    </section>
  );
};

export default MyJourneySection;