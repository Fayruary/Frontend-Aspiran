import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-[#2A2A2A] px-6 py-10">

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        {/* LOGO */}
        <Link
          href="/"
          className="font-display text-cream text-[16px] tracking-wide hover:opacity-90 transition"
        >
          Aspir<span className="text-gold">an</span>
        </Link>

        {/* MENU */}
        <nav className="flex gap-6 flex-wrap justify-center">
          <Link
            href="/laporan"
            className="text-[#7A756D] text-xs hover:text-[#E8E3D9] transition"
          >
            Laporan Publik
          </Link>

          <Link
            href="/statistik"
            className="text-[#7A756D] text-xs hover:text-[#E8E3D9] transition"
          >
            Statistik
          </Link>

          <Link
            href="/tentang"
            className="text-[#7A756D] text-xs hover:text-[#E8E3D9] transition"
          >
            Tentang
          </Link>
        </nav>

        {/* COPYRIGHT */}
        <p className="text-[#6B6760] text-xs text-center md:text-right">
          © 2026 Sistem Pengaduan Masyarakat. All rights reserved.
        </p>

      </div>

    </footer>
  );
}