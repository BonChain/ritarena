import Navbar from "@/components/Navbar";
import NavTicker from "@/components/NavTicker";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="arena-grid-bg" />
      <div className="arena-grid-dots" />
      <div className="arena-noise" />
      <Navbar />
      <NavTicker />
      {children}
      <Footer />
    </>
  );
}
