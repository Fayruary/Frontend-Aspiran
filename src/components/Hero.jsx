import Link from "next/link";

const reports = [
  {
    category: "Fasilitas Umum",
    categoryStyle: "bg-[#1E3A5F] text-[#7BB3E0]",
    status: "✓ Selesai",
    statusStyle: "bg-[#1A3A2A] text-[#4CAF7D]",
    title: "Jembatan Ciliwung retak, butuh perbaikan segera",
    location: "Jl. Ciliwung No. 12, Matraman",
  },
  {
    category: "Sampah",
    categoryStyle: "bg-[#1A3A2A] text-[#5DC48F]",
    status: "⏳ Diproses",
    statusStyle: "bg-[#3A2A10] text-[#D4A843]",
    title: "Tumpukan sampah di depan pasar tidak diangkut",
    location: "Pasar Minggu, Jakarta Selatan",
  },
  {
    category: "Fasilitas Umum",
    categoryStyle: "bg-[#3A2A10] text-[#D4A843]",
    status: "🔵 Baru",
    statusStyle: "bg-[#1E2A3A] text-[#7BB3E0]",
    title: "Lampu jalan mati di sepanjang Jl. Merdeka",
    location: "Jl. Merdeka Barat, Jakarta Pusat",
  },
];

export default function Hero() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh]">

      {/* LEFT */}
      <div className="bg-cream flex flex-col justify-center px-8 md:px-14 py-20">

        {/* STATUS BADGE */}
        <div className="inline-flex items-center gap-2 bg-[#E8E3D9] border border-[#D0C9BC] rounded-full px-4 py-1.5 text-xs text-[#5C5850] mb-8 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#4CAF7D] animate-pulse" />
          Sistem aktif & transparan
        </div>

        {/* TITLE */}
        <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight text-dark mb-6">
          Suara Anda,<br />
          <span className="text-gold italic">Perubahan</span><br />
          Nyata
        </h1>

        {/* DESC */}
        <p className="text-muted text-base leading-relaxed max-w-md mb-10">
          Laporkan masalah publik seperti jalan rusak, sampah menumpuk, atau fasilitas umum,
          dan pantau proses penanganannya secara transparan.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/laporan/tambah"
            className="bg-dark text-cream px-7 py-3.5 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            Buat Laporan
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <Link
            href="/laporan"
            className="text-muted text-sm hover:text-dark transition"
          >
            Lihat laporan publik →
          </Link>
        </div>

      </div>

      {/* RIGHT */}
      <div className="bg-dark flex flex-col justify-center px-8 md:px-14 py-12 gap-4 relative overflow-hidden">

        {/* DECOR */}
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-gold/10 blur-2xl" />

        {/* LIST */}
        {reports.map((r, i) => (
          <div
            key={i}
            className="bg-[#262626] border border-[#333] rounded-2xl p-5 hover:translate-x-1 transition"
          >

            {/* TOP */}
            <div className="flex justify-between items-center mb-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.categoryStyle}`}>
                {r.category}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full ${r.statusStyle}`}>
                {r.status}
              </span>
            </div>

            {/* TITLE */}
            <p className="text-[#E8E3D9] text-sm font-medium mb-1">
              {r.title}
            </p>

            {/* LOCATION */}
            <p className="text-[#6B6760] text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B6760]" />
              {r.location}
            </p>

          </div>
        ))}
      </div>

    </section>
  );
}