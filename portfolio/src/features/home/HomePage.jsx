import React, { useRef } from "react";
import Navbar from "../../Components/NavbarSection/NavbarSection";
import WelcomeSection from "../../Components/WelcomeSection/WelcomeSection";
import AboutUsSectionLinks from "../../Components/AboutUsSectionLink/AboutUsSectionLinks";
import AboutUsSection from "../../Components/AboutUsSection/AboutUsSection";
import SkillsSection from "../../Components/SkillsSection/SkillsSection";
import MyJourneySection from "../../Components/MyJourneySection/MyJourneySection";
import CookiesSection from "../../Components/CookiesSection/CookiesSection";
import AIChat from "../../Components/AIbotSection/AIbotSection";
import BackToTopButton from "../../Components/BackToTopButtonSection/BackToTopButtonSection";
import ScrollButton from "../../Components/ScrollToDownButtonSection/ScrollToDownButtonSection";
import Footer from "../../Components/FooterSection/Footer";
import TabNavigation from "../../Components/TabNavigation/TabNavigation";
import ThemeToggle from "../../Components/ThemeToggle/ThemeToggle";
import './HomePage.css'; // Create per feature CSS

function HomePage() {
  const homeContentRef = useRef(null);

  return (
    <>
      <div className="home-content page-shell" ref={homeContentRef}>
        <Navbar />
        <WelcomeSection />
        <AboutUsSectionLinks />
        <AboutUsSection />
        <SkillsSection />
        <MyJourneySection />
        <div>Blogs Section (placeholder - full BlogsPage at /blogs route)</div>
        <CookiesSection />
        <AIChat />
        <BackToTopButton className="fixed-backtotop" />
        <ScrollButton />
        <Footer />
        <ThemeToggle />
        <div className="tab-nav-container">
          <TabNavigation />
        </div>
      </div>
    </>
  );
}

export default HomePage;

