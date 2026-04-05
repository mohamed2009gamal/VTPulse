import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="chip">
          <div className="chip-text">Loading</div>
          <div className="chip-pins">
            <div className="pin"></div>
            <div className="pin"></div>
            <div className="pin"></div>
            <div className="pin"></div>
          </div>
        </div>
        <div className="traces">
          <div className="trace trace1"></div>
          <div className="trace trace2"></div>
          <div className="trace trace3"></div>
          <div className="trace trace4"></div>
          <div className="trace trace5"></div>
          <div className="trace trace6"></div>
          <div className="trace trace7"></div>
          <div className="trace trace8"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;

