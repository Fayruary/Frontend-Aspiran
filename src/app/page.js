import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import Categories from "@/components/Categories";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-dark">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Categories />
      <CTA />
      <Footer />
    </main>
  );
}