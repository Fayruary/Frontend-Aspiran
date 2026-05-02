"use client";

import { useState } from "react";

const categories = [
  {
    name: "Jalan Rusak",
    count: "84 laporan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 20h16M6 16l4-8 4 8 4-8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Sampah",
    count: "62 laporan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Fasilitas Umum",
    count: "60 laporan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 20h16M7 20V8h10v12M9 8V4h6v4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Keamanan",
    count: "19 laporan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function Categories() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="bg-[#ECEAE3] py-24 px-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <p className="text-xs font-medium tracking-[3px] uppercase text-[#9C9588] mb-3">
          Kategori pengaduan
        </p>

        <h2 className="font-display text-4xl text-dark tracking-tight leading-tight mb-12">
          Apa yang ingin Anda laporkan?
        </h2>

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          {categories.map((c, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`group rounded-2xl p-6 border transition-all duration-300 cursor-pointer
                ${
                  hovered === i
                    ? "bg-dark border-dark -translate-y-1 shadow-xl"
                    : "bg-cream border-[#D5D0C8]"
                }
              `}
            >

              {/* ICON */}
              <div
                className={`mb-4 transition-colors ${
                  hovered === i ? "text-cream" : "text-dark"
                }`}
              >
                {c.icon}
              </div>

              {/* TITLE */}
              <p
                className={`text-sm font-semibold mb-1 transition-colors ${
                  hovered === i ? "text-cream" : "text-dark"
                }`}
              >
                {c.name}
              </p>

              {/* COUNT */}
              <p
                className={`text-xs transition-colors ${
                  hovered === i ? "text-[#A8A49C]" : "text-[#9C9588]"
                }`}
              >
                {c.count}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}