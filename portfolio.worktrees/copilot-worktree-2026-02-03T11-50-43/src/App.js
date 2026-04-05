import { useEffect, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";

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
import DashboardLayout from "./Dashboard/DashboardLayout";

// Theme toggle
import ThemeToggle from "./Components/ThemeToggle/ThemeToggle";
// pages
import ContactUs from "./ContactUs";
import Admin from "./Admin";
import Blogs from "./Components/BlogsSection/BlogsSection";

// styles
import "./App.css";

function Application() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Show loader first
  if (loading) {
    return <Loader />;
  }

  // Show site after loading
  return (
    <div className="App">
      <title>Home | VENOMTECH</title>

      <Header />

      <WelcomeSection />
      <AboutUsSectionLinks />
      <AboutUsSection />
      <SkillsSection />
      <MyJourneySection />

      <CookiesSection />
      <AIChat />
      <BackToTopButton />
      <ScrollButton />
      <Footer />
      {/* Theme toggle button fixed across the site */}
      <ThemeToggle />    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Application} />
        <Route path="/contact" component={ContactUs} />
        <Route path="/admin" component={Admin} />
        <Route path="/dashboard" component={DashboardLayout} />
        <Route path="/Blogs" component={Blogs} />
        <Route component={PageNotFound} />
      </Switch>
    </BrowserRouter>
  );
}
