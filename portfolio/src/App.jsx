import { useEffect, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomePage from "./features/home/HomePage";
import BlogsPage from "./features/blogs/BlogsPage";
import ContactUs from "./ContactUs";
import Admin from "./Admin";
import DashboardLayout from "./Dashboard/DashboardLayout";
import PageNotFound from "./Components/PageNotFound/PageNotFound";
import ProtectedRoute from "./ProtectedRoute";
import SiteTracker from "./Components/SiteTracker";
import IntroAnimation from "./Components/IntroAnimation/IntroAnimation";
import './styles/globals.css';

function App() {
  const [showIntro, setShowIntro] = useState(false);
  const [introTrigger, setIntroTrigger] = useState(0);

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

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SiteTracker />
        <div className="app-wrapper">
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route exact path="/ContactUs" component={ContactUs} />
            <Route exact path="/admin" component={Admin} />
            <Route exact path="/signin" component={Admin} />
            <Route exact path="/register" component={Admin} />
            <ProtectedRoute path="/dashboard" component={DashboardLayout} />
            <Route path="/blogs" component={BlogsPage} />
            <Route component={PageNotFound} />
          </Switch>
          {showIntro && (
            <IntroAnimation trigger={introTrigger} onComplete={handleIntroComplete} />
          )}
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

