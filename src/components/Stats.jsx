const stats = [
  { value: "247", label: "Total laporan masuk", color: "text-[#7BB3E0]" },
  { value: "189", label: "Laporan diselesaikan", color: "text-[#4CAF7D]" },
  { value: "41", label: "Sedang diproses", color: "text-[#D4A843]" },
  { value: "76%", label: "Tingkat penyelesaian", color: "text-[#E8E3D9]" },
];

export default function Stats() {
  return (
    <section className="bg-dark py-24 px-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT TEXT */}
        <div>
          <h2 className="font-display text-[#F5F2EC] text-4xl md:text-5xl leading-tight tracking-tight">
            Data yang <em className="text-gold not-italic">berbicara</em>
          </h2>

          <p className="text-[#6B6760] text-sm mt-4 leading-relaxed max-w-md">
            Setiap laporan diproses, dipantau, dan diselesaikan secara transparan oleh sistem dan petugas terkait.
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-5">

          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl p-6 hover:translate-y-[-4px] transition"
            >

              {/* VALUE */}
              <p
                className={`font-display text-4xl md:text-5xl font-bold tracking-tight leading-none mb-2 ${s.color}`}
              >
                {s.value}
              </p>

              {/* LABEL */}
              <p className="text-[#7A756D] text-sm leading-snug">
                {s.label}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}