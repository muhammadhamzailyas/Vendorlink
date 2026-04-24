import React, { useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import Navbar from "../../components/landing/Navbar";
import HeroSection from "../../components/landing/HeroSection";
import HowItWorksSection from "../../components/landing/HowItWorksSection";
import FeaturesSection from "../../components/landing/FeaturesSection";
import AboutSection from "../../components/landing/AboutSection";
import Footer from "../../components/landing/Footer";

const LandingPage = () => {
  const { user } = useUser();

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // Redirect if logged in and approved
  if (user && user.role) {
    const canAutoRedirect = user.role === "admin" || user.status === "approved";
    if (canAutoRedirect) {
      switch (user.role) {
        case "admin":
          return <Navigate to="/admin" replace />;
        case "company":
          return <Navigate to="/company" replace />;
        case "vendor":
          return <Navigate to="/vendor" replace />;
        default:
          break;
      }
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <Navbar scrollToSection={scrollToSection} />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <AboutSection />
      <Footer />
    </main>
  );
};

export default LandingPage;



