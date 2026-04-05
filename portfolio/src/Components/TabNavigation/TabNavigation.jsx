import { NavLink } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import './TabNavigation.css';

const TabNavigation = () => {
  const containerRef = useRef(null);
  const ulRef = useRef(null);
  const leftArrowRef = useRef(null);
  const rightArrowRef = useRef(null);

  const [showTabs, setShowTabs] = useState(false);

  const scrollLeft = () => {
    ulRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    ulRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const updateScrollState = useCallback(() => {
    const scrollY = window.scrollY;
    console.log('TabNav - ScrollY:', scrollY, 'showTabs set to:', scrollY > 50);
    setShowTabs(scrollY > 50);
  }, []);

  useEffect(() => {
    console.log('TabNav useEffect executed');
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = updateScrollState;

    // Initial state
    updateScrollState();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState]);

  const tabsContainerClass = `tabs-container ${showTabs ? 'show-on-scroll' : ''}`;

  return (
    <div className={tabsContainerClass} ref={containerRef}>
      <div 
        className="left-arrow active" 
        style={{ left: 0 }}
        ref={leftArrowRef}
        onClick={scrollLeft}
        role="button"
        tabIndex={0}
        aria-label="Scroll tabs left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </div>

      <ul ref={ulRef}>
        <li><NavLink exact to="/" className="tab-link" activeClassName="active">Home</NavLink></li>
        <li><NavLink to="/signin" className="tab-link" activeClassName="active">Sign-in</NavLink></li>
        <li><NavLink to="/register" className="tab-link" activeClassName="active">Registration</NavLink></li>
        <li><NavLink to="/about-us" className="tab-link" activeClassName="active">About-us</NavLink></li>
        <li><NavLink to="/profile" className="tab-link" activeClassName="active">Profile</NavLink></li>
        <li><NavLink to="/ContactUs" className="tab-link" activeClassName="active">Contact-us</NavLink></li>
        <li><NavLink to="/trend-games" className="tab-link" activeClassName="active">Trend games</NavLink></li>
        <li><NavLink to="/old-games" className="tab-link" activeClassName="active">Old games</NavLink></li>
        <li><NavLink to="/top-games" className="tab-link" activeClassName="active">Top games</NavLink></li>
      </ul>

      <div 
        className="right-arrow active" 
        style={{ right: 0 }}
        ref={rightArrowRef}
        onClick={scrollRight}
        role="button"
        tabIndex={0}
        aria-label="Scroll tabs right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
};

export default TabNavigation;
