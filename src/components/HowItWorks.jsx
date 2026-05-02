const steps = [
  {
    num: "1",
    style: "bg-dark text-cream",
    title: "Buat laporan",
    desc: "Isi formulir pengaduan, sertakan lokasi dan foto bukti kejadian di lapangan.",
  },
  {
    num: "2",
    style: "bg-gold text-dark",
    title: "Verifikasi oleh admin",
    desc: "Tim kami memverifikasi laporan dan meneruskan ke instansi terkait yang berwenang.",
  },
  {
    num: "3",
    style: "bg-cream text-dark border border-dark",
    title: "Pantau status",
    desc: "Lacak perkembangan laporan Anda secara real-time hingga selesai ditindaklanjuti.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-cream py-28 px-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <p className="text-xs font-medium tracking-[3px] uppercase text-[#9C9588] mb-3">
          Cara kerja
        </p>

        <h2 className="font-display text-4xl md:text-5xl text-dark tracking-tight leading-tight mb-16">
          Sederhana, cepat,<br />dan transparan
        </h2>

        {/* STEPS */}
        <div className="grid md:grid-cols-3 gap-10 relative">

          {/* LINE (DESKTOP ONLY) */}
          <div
            className="hidden md:block absolute top-7 left-10 right-10 h-px"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#C8C2B6 0,#C8C2B6 6px,transparent 6px,transparent 14px)",
            }}
          />

          {steps.map((s, i) => (
            <div key={i} className="relative text-center md:text-left">

              {/* NUMBER */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-display text-lg mb-6 mx-auto md:mx-0 relative z-10 shadow-sm ${s.style}`}
              >
                {s.num}
              </div>

              {/* TITLE */}
              <h3 className="font-semibold text-dark text-lg mb-2">
                {s.title}
              </h3>

              {/* DESC */}
              <p className="text-muted text-sm leading-relaxed max-w-sm">
                {s.desc}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
}