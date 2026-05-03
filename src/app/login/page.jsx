"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: form.email,
        password: form.password,
      }
    );

    const { token, user } = res.data;

    // simpan token + user
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (user?.role === "admin") {
     router.push("/admin");
    } else {
    router.push("/dashboard");
    }

  } catch (err) {
    console.log(err);

    setError(
      err.response?.data?.message ||
      "Login gagal. Cek email & password"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-dark flex">

      {/* LEFT PANEL - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-[#141414] border-r border-[#2A2A2A] relative overflow-hidden">

        {/* Decorative */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border border-[#2A2A2A]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border border-[#2A2A2A]" />
        <div className="absolute top-1/3 -right-24 w-48 h-48 rounded-full bg-gold/5" />

        {/* Logo */}
        <Link href="/" className="font-display text-cream text-xl tracking-tight z-10">
          Aspir<span className="text-gold">an</span>
        </Link>

        {/* Content */}
        <div className="z-10">
          <p className="font-display text-4xl text-cream leading-tight tracking-tight mb-6">
            Selamat
            <em className="text-gold"> Datang</em><br />
            Kembali.
          </p>
          <p className="text-[#5C5850] text-sm leading-relaxed max-w-xs">
            Masuk dan lanjutkan memantau laporan Anda. Setiap kontribusi membuat kota kita lebih baik.
          </p>

          {/* Recent activity sample */}
          <div className="mt-10 space-y-3">
            {[
              { label: "Jalan rusak di Tebet", status: "Selesai", color: "text-[#4CAF7D]" },
              { label: "Lampu mati Jl. Sudirman", status: "Diproses", color: "text-gold" },
              { label: "Sampah menumpuk Pasar Minggu", status: "Baru", color: "text-[#7BB3E0]" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3">
                <p className="text-[#7A756D] text-xs truncate max-w-[180px]">{item.label}</p>
                <span className={`text-xs font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[#3A3A3A] text-xs z-10">© 2026 PengaduanRakyat</p>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12">

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden font-display text-cream text-xl tracking-tight mb-10">
          Aspir<span className="text-gold">an</span>
        </Link>

        <div className="w-full max-w-sm mx-auto lg:mx-0">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-medium tracking-[2px] uppercase text-[#5C5850] mb-2">Selamat datang</p>
            <h1 className="font-display text-3xl text-cream leading-tight tracking-tight">
              Masuk ke<br />
              <em className="text-gold not-italic">akun Anda</em>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">

            {/* Email */}
            <div>
              <label className="block text-xs text-[#5C5850] mb-1.5 ml-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#1E1E1E] text-cream text-sm border border-[#2A2A2A] placeholder-[#3A3A3A] focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-xs text-[#5C5850]">Password</label>
                <Link href="/lupa-password" className="text-xs text-[#5C5850] hover:text-gold transition-colors">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password Anda"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#1E1E1E] text-cream text-sm border border-[#2A2A2A] placeholder-[#3A3A3A] focus:outline-none focus:border-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A3A3A] hover:text-[#7A756D] transition-colors p-1"
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-red-400 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-dark font-medium py-3 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Memproses...
                </span>
              ) : "Masuk"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="text-[#3A3A3A] text-xs">atau</span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-[#5C5850]">
            Belum punya akun?{" "}
            <Link href="/register" className="text-gold hover:text-amber-300 transition-colors font-medium">
              Daftar gratis
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}