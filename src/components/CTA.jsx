import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export default function CTA() {
  return (
    <section className="relative bg-gold py-24 px-6 text-center overflow-hidden">

      {/* DECOR BACKGROUND */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-dark blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">

        {/* SMALL LABEL */}
        <p className="text-xs font-medium tracking-[3px] uppercase text-[#6B5A1E] mb-4">
          Bergabung sekarang
        </p>

        {/* TITLE */}
        <h2 className={`${montserrat.className} text-4xl md:text-5xl text-dark tracking-tight leading-tight mb-5 font-bold`}>
        Mulai laporkan<br />
        <span className="text-dark">hari ini!</span>
        </h2>

        {/* DESC */}
        <p className="text-[#5C4A10] text-base leading-relaxed mb-10 max-w-md mx-auto">
          Setiap suara yang Anda sampaikan adalah langkah nyata menuju kota yang lebih
          baik, transparan, dan responsif.
        </p>

        {/* BUTTON */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-dark text-cream px-10 py-4 rounded-full text-sm font-medium hover:opacity-90 transition shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Daftar & Buat Laporan

          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>

      </div>
    </section>
  );
}