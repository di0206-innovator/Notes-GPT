"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
        isScrolled ? "glass-thick border-b" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Campus<span className="gradient-text">GPT</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {["Features", "Map", "Hub", "Guide"].map((item) => (
            <Link 
              key={item} 
              href={item === "Hub" ? "/hub" : item === "Guide" ? "/guide" : `/#${item.toLowerCase()}`}
              className="text-sm font-medium text-foreground-muted hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
          <Link 
            href="/chat"
            className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-lg inline-block"
          >
            Launch App
          </Link>
        </div>

        <button className="md:hidden text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
    </nav>
  );
}
