import { useEffect, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";

// components
import Header from "./Components/NavbarSection/NavbarSection";
import CookiesSection from "./Components/CookiesSection/CookiesSection";
import AIChat from "./Components/AIbotSection/AIbotSection";
import BackToTopButton from "./Components/BackToTopButtonSection/BackToTopButtonSection";
import WelcomeSection from "./Components/WelcomeSection/WelcomeSection";
import SkillsSection from "./Components/SkillsSection/SkillsSection";
import MyJourneySection from "./Components/MyJourneySection/MyJourneySection";
import AboutUsSection from "./Components/AboutUsSection/AboutUsSection";
import Footer from "./Components/FooterSection/Footer";
import PageNotFound from "./Components/PageNotFound/PageNotFound";
import AboutUsSectionLinks from "./Components/AboutUsSectionLink/AboutUsSectionLinks";
import ScrollButton from "./Components/ScrollToDownButtonSection/ScrollToDownButtonSection";
import Loader from "./Components/Loader/Loader";
import TabNavigation from "./Components/TabNavigation/TabNavigation";
import ThemeToggle from "./Components/ThemeToggle/ThemeToggle";
import IntroAnimation from "./Components/IntroAnimation/IntroAnimation";

// pages
import ContactUs from "./ContactUs";
import Admin from "./Admin";
import Blogs from "./Components/BlogsSection/BlogsSection";
import DashboardLayout from "./Dashboard/DashboardLayout";

import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [introTrigger, setIntroTrigger] = useState(0);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const introSeen = window.sessionStorage.getItem("introShown");
    if (!introSeen) {
      window.sessionStorage.setItem("introShown", "true");
      setShowIntro(true);
      setIntroTrigger((prev) => prev + 1);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-wrapper">
          <Switch>
            <Route exact path="/">
              <Header />
              <WelcomeSection />
              <SkillsSection />
              <MyJourneySection />
              <AboutUsSection />
              <AboutUsSectionLinks />
              <Footer />
              <CookiesSection />
              <AIChat />
              <BackToTopButton />
              <ScrollButton />
              <TabNavigation />
            </Route>
            <Route path="/contact" component={ContactUs} />
            <Route path="/admin" component={Admin} />
            <Route path="/blogs" component={Blogs} />
            <Route path="/dashboard" component={DashboardLayout} />
            <Route component={PageNotFound} />
          </Switch>
          <ThemeToggle />
          {showIntro && (
            <IntroAnimation trigger={introTrigger} onComplete={handleIntroComplete} />
          )}
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
