"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";



const API = "http://localhost:5000/api";

const STATUS_MAP = {
  pending:  { label: "Pending",  bg: "bg-sky-950/50",     text: "text-sky-400",     dot: "bg-sky-400"     },
  verified: { label: "Verified", bg: "bg-blue-950/50",    text: "text-blue-400",    dot: "bg-blue-400"    },
  process:  { label: "Diproses", bg: "bg-amber-950/50",   text: "text-amber-400",   dot: "bg-amber-400"   },
  done:     { label: "Selesai",  bg: "bg-emerald-950/50", text: "text-emerald-400", dot: "bg-emerald-400" },
  rejected: { label: "Ditolak",  bg: "bg-red-950/50",     text: "text-red-400",     dot: "bg-red-400"     },
};

const NAV = [
  { label: "Dashboard",    icon: GridIcon, href: "/dashboard"       },
  { label: "Laporan Saya", icon: FileIcon, href: "/laporan" },
  { label: "Buat Laporan", icon: PlusIcon, href: "/laporan/tambah"  },
];

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser]               = useState(null);
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [activeNav, setActiveNav]     = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    router.push("/login");
    return;
  }

  try {
    const userData = JSON.parse(storedUser);

    setUser(userData);
    fetchReports(token, userData.id);

  } catch (err) {
    console.log("Auth error:", err);
    router.push("/login");
  }
}, []);

  const fetchReports = async (token, userId) => {
  try {
    setLoading(true);

    const res = await axios.get(`${API}/laporan`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const filtered = res.data.filter(
      (r) => r.user_id === userId
    );

    setReports(filtered);
  } catch (err) {
    console.log(err);
    setError("Gagal memuat data laporan.");
  } finally {
    setLoading(false);
  }
};
  

  // ── Hitungan status ────────────────────────────────────────────────────
  const count    = (s) => reports.filter((r) => r.status === s).length;
  const done     = count("done");
  const process  = count("process") + count("verified");
  const pending  = count("pending");
  const rejected = count("rejected");

  // ── Chart per bulan (tahun berjalan) ──────────────────────────────────
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const year   = new Date().getFullYear();
  const chartData = MONTHS.map((month, i) => ({
    month,
    total: reports.filter((r) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length,
  }));
  const maxBar = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-[#141414] border-r border-[#222]
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        <div className="px-6 h-16 flex items-center border-b border-[#222]">
          <Link href="/" className="font-display text-cream text-[16px] tracking-tight">
            Aspir<span className="text-gold">an</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeNav === label
                  ? "bg-gold/10 text-gold font-medium"
                  : "text-[#6B6760] hover:text-cream hover:bg-[#1E1E1E]"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#222] p-4">
          {user && (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
      {user.username?.charAt(0)?.toUpperCase() || "U"}
    </div>

    <div className="min-w-0">
      <p className="text-cream text-xs font-medium truncate">
        {user.username || "User"}
      </p>
      <p className="text-[#5C5850] text-[10px] truncate">
        {user.email || "User"}
      </p>
    </div>
  </div>
)}
          <button
  onClick={() => setShowLogoutConfirm(true)}
  className="w-full text-left text-xs text-[#5C5850] hover:text-red-400 transition-colors px-1 py-1 flex items-center gap-2"
>
  <LogoutIcon size={13} /> Keluar
</button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}>
              <MenuIcon size={20} />
            </button>
            <div>
              <p className="text-cream text-sm font-medium">
  Selamat datang{user?.username ? `, ${user.username}` : ""} 👋
</p>
              <p className="text-[#5C5850] text-xs">Pantau semua laporan Anda</p>
            </div>
          </div>
          <Link
            href="/laporan/tambah"
            className="bg-gold text-dark text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <PlusIcon size={13} /> Buat Laporan
          </Link>
        </header>

        <main className="flex-1 p-6 space-y-6">

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Laporan", value: reports.length, color: "text-cream"       },
              { label: "Selesai",       value: done,           color: "text-emerald-400" },
              { label: "Diproses",      value: process,        color: "text-amber-400"   },
              { label: "Pending",       value: pending,        color: "text-sky-400"     },
              { label: "Ditolak",       value: rejected,       color: "text-red-400"     },
            ].map((s, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-4">
                <p className="text-[#5C5850] text-xs mb-2">{s.label}</p>
                {loading
                  ? <div className="h-9 w-10 bg-[#2A2A2A] rounded-lg animate-pulse mb-1" />
                  : <p className={`font-display text-4xl tracking-tight leading-none ${s.color}`}>{s.value}</p>
                }
              </div>
            ))}
          </div>

          {/* ── Chart + List ── */}
          <div className="grid lg:grid-cols-5 gap-4">

            {/* Bar chart */}
            <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <p className="text-[#5C5850] text-xs mb-0.5">Laporan per bulan</p>
              <p className="text-cream text-sm font-medium mb-5">Aktivitas {year}</p>

              {loading ? (
                <div className="h-28 bg-[#222] rounded-xl animate-pulse" />
              ) : (
                <div className="flex items-end gap-1 h-28">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${(d.total / maxBar) * 100}%`,
                          minHeight: d.total ? "6px" : "2px",
                          background: d.total ? "#D4A843" : "#2A2A2A",
                        }}
                      />
                      <p className="text-[#5C5850] text-[9px]">{d.month}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-[#222] flex flex-wrap gap-3">
                {[
                  { color: "bg-emerald-400", label: `${done} selesai`  },
                  { color: "bg-amber-400",   label: `${process} proses` },
                  { color: "bg-sky-400",     label: `${pending} pending` },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[#5C5850] text-[10px]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Report list */}
            <div className="lg:col-span-3 bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
                <p className="text-cream text-sm font-medium">Laporan Terbaru</p>
                <Link href="/laporan" className="text-gold text-xs hover:underline">Lihat semua</Link>
              </div>

              {loading ? (
                <div className="divide-y divide-[#1E1E1E]">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="px-5 py-4 flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#2A2A2A] rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-[#222] rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3">
                    <FileIcon size={20} />
                  </div>
                  <p className="text-[#5C5850] text-sm">Belum ada laporan</p>
                  <Link href="/laporan/tambah" className="text-gold text-xs mt-2 hover:underline">
                    Buat laporan pertama Anda →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#1E1E1E]">
                  {reports.slice(0, 5).map((r) => {
                    const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                    return (
                      <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#1E1E1E] transition-colors">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-cream text-sm truncate">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {r.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#6B6760]">
                                {r.category}
                              </span>
                            )}
                            <span className="text-[#5C5850] text-[10px]">
                              {new Date(r.created_at).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </span>
                            <span className="text-[#3A3A3A] text-[10px] font-mono">{r.tracking_code}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="bg-gold/10 border border-gold/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-gold text-sm font-medium mb-0.5">Ada masalah di sekitar Anda?</p>
              <p className="text-[#7A6A3A] text-xs">Laporkan sekarang dan kami teruskan ke pihak terkait.</p>
            </div>
            <Link
              href="/laporan/tambah"
              className="bg-gold text-dark text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Buat Laporan
            </Link>
          </div>

        </main>
      </div>
      {showLogoutConfirm && (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-[90%] max-w-sm">
      
      <h2 className="text-cream text-sm font-medium mb-2">
        Konfirmasi Logout
      </h2>

      <p className="text-[#5C5850] text-xs mb-5">
        Apakah kamu yakin ingin keluar dari akun ini?
      </p>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream"
        >
          Batal
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
          }}
          className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Keluar
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}


// ── Icons ──────────────────────────────────────────────────────────────────
function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
}
function FileIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function PlusIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function MenuIcon({ size = 20 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LogoutIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}