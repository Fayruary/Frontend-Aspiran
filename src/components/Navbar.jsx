"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark border-b border-[#333]">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-16">

        {/* LOGO */}
        <Link
          href="/"
          className="font-display text-cream text-[18px] tracking-wide hover:opacity-90 transition"
        >
          Aspir<span className="text-gold">an</span>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
          >
            Beranda
          </Link>

          <Link
            href="/laporan"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
          >
            Laporan Publik
          </Link>

          <Link
            href="/statistik"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
          >
            Statistik
          </Link>

          <Link
            href="/register"
            className="bg-gold text-dark px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition shadow-md"
          >
            Buat Laporan
          </Link>
        </nav>  

        {/* HAMBURGER */}
        <button
          className="md:hidden text-cream"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            {menuOpen ? (
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-[#1f1f1f] border-t border-[#333] px-6 py-4 flex flex-col gap-3 animate-fadeIn">

          <Link
            href="/"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
            onClick={() => setMenuOpen(false)}
          >
            Beranda
          </Link>

          <Link
            href="/laporan"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
            onClick={() => setMenuOpen(false)}
          >
            Laporan Publik
          </Link>

          <Link
            href="/statistik"
            className="text-[#A8A49C] hover:text-cream text-sm transition"
            onClick={() => setMenuOpen(false)}
          >
            Statistik
          </Link>

          <Link
            href="/register"
            className="bg-gold text-dark px-5 py-2 rounded-full text-sm font-medium text-center hover:opacity-90 transition"
            onClick={() => setMenuOpen(false)}
          >
            Buat Laporan
          </Link>
        </div>
      )}
    </header>
  );
}