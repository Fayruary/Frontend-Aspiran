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
  { label: "Dashboard",    icon: GridIcon, href: "/dashboard"      },
  { label: "Laporan Saya", icon: FileIcon, href: "/laporan"        },
  { label: "Buat Laporan", icon: PlusIcon, href: "/laporan/tambah" },
];

const FILTERS = ["Semua", "pending", "verified", "process", "done", "rejected"];

export default function LaporanSaya() {
  const router = useRouter();
  const [user, setUser]                   = useState(null);
  const [reports, setReports]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeFilter, setActiveFilter]   = useState("Semua");
  const [search, setSearch]               = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const token      = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) { router.push("/login"); return; }
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchReports(token, userData.id);
    } catch {
      router.push("/login");
    }
  }, []);

  const fetchReports = async (token, userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/laporan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data.filter((r) => r.user_id === userId));
    } catch {
      setError("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  };

  // ── Filter + Search ────────────────────────────────────────────────────
  const filtered = reports.filter((r) => {
    const matchStatus = activeFilter === "Semua" || r.status === activeFilter;
    const matchSearch =
      search === "" ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                label === "Laporan Saya"
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
                <p className="text-cream text-xs font-medium truncate">{user.username || "User"}</p>
                <p className="text-[#5C5850] text-[10px] truncate">{user.email || ""}</p>
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
              <p className="text-cream text-sm font-medium">Laporan Saya</p>
              <p className="text-[#5C5850] text-xs">Riwayat semua laporan yang telah Anda buat</p>
            </div>
          </div>
          <Link
            href="/laporan/tambah"
            className="bg-gold text-dark text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <PlusIcon size={13} /> Buat Laporan
          </Link>
        </header>

        <main className="flex-1 p-6 space-y-4">

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Search + Filter Bar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5850]" />
              <input
                type="text"
                placeholder="Cari judul, kategori, atau kode laporan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => {
                const st = STATUS_MAP[f];
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      isActive
                        ? f === "Semua"
                          ? "bg-gold/15 border-gold/30 text-gold"
                          : `${st.bg} border-transparent ${st.text}`
                        : "bg-[#1A1A1A] border-[#2A2A2A] text-[#5C5850] hover:text-cream hover:border-[#3A3A3A]"
                    }`}
                  >
                    {f === "Semua" ? "Semua" : st?.label ?? f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Table / List ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#222] text-[#5C5850] text-[10px] uppercase tracking-widest">
              <span>Laporan</span>
              <span>Kategori</span>
              <span>Kode</span>
              <span>Tanggal</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            {loading ? (
              <div className="divide-y divide-[#1E1E1E]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-4 flex gap-3 items-center">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#2A2A2A] rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-[#222] rounded animate-pulse w-1/3" />
                    </div>
                    <div className="h-6 w-16 bg-[#2A2A2A] rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3">
                  <FileIcon size={20} />
                </div>
                <p className="text-[#5C5850] text-sm mb-1">
                  {search || activeFilter !== "Semua" ? "Tidak ada laporan yang cocok" : "Belum ada laporan"}
                </p>
                {search || activeFilter !== "Semua" ? (
                  <button
                    onClick={() => { setSearch(""); setActiveFilter("Semua"); }}
                    className="text-gold text-xs mt-1 hover:underline"
                  >
                    Reset filter →
                  </button>
                ) : (
                  <Link href="/laporan/tambah" className="text-gold text-xs mt-1 hover:underline">
                    Buat laporan pertama Anda →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#1E1E1E]">
                {filtered.map((r) => {
                  const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-[#1E1E1E] transition-colors cursor-pointer items-center"
                    >
                      {/* Title + mobile info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <div className="min-w-0">
                          <p className="text-cream text-sm truncate">{r.title}</p>
                          {/* Mobile only extras */}
                          <div className="flex md:hidden items-center gap-2 mt-1 flex-wrap">
                            {r.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#6B6760]">
                                {r.category}
                              </span>
                            )}
                            <span className="text-[#5C5850] text-[10px]">
                              {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="hidden md:block">
                        {r.category
                          ? <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#222] text-[#6B6760]">{r.category}</span>
                          : <span className="text-[#3A3A3A] text-xs">—</span>
                        }
                      </div>

                      {/* Tracking code */}
                      <div className="hidden md:block">
                        <span className="text-[10px] font-mono text-[#4A4A4A]">{r.tracking_code || "—"}</span>
                      </div>

                      {/* Date */}
                      <div className="hidden md:block">
                        <span className="text-[#5C5850] text-xs">
                          {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="hidden md:block">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-[#1E1E1E] flex items-center justify-between">
                <p className="text-[#4A4A4A] text-[10px]">
                  Menampilkan <span className="text-[#6B6760]">{filtered.length}</span> dari{" "}
                  <span className="text-[#6B6760]">{reports.length}</span> laporan
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
              <p className="text-cream text-sm font-medium">Detail Laporan</p>
              <button onClick={() => setSelectedReport(null)} className="text-[#5C5850] hover:text-cream transition-colors">
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 space-y-4">
              {/* Status badge */}
              {(() => {
                const st = STATUS_MAP[selectedReport.status] ?? STATUS_MAP.pending;
                return (
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${st.bg} ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                );
              })()}

              <div>
                <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Judul</p>
                <p className="text-cream text-sm">{selectedReport.title}</p>
              </div>

              {selectedReport.image && (
  <img
    src={`http://localhost:5000/uploads/${selectedReport.image}`}
    className="w-full rounded-xl border border-[#2A2A2A]"
    alt="gambar laporan"
  />
)}

              {selectedReport.description && (
                <div>
                  <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Deskripsi</p>
                  <p className="text-[#8A8680] text-xs leading-relaxed">{selectedReport.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedReport.category && (
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kategori</p>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#222] text-[#8A8680]">
                      {selectedReport.category}
                    </span>
                  </div>
                )}
                {selectedReport.tracking_code && (
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kode Tracking</p>
                    <p className="text-[#8A8680] text-xs font-mono">{selectedReport.tracking_code}</p>
                  </div>
                )}
              </div>

              {selectedReport.location && (
                <div>
                  <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Lokasi</p>
                  <p className="text-[#8A8680] text-xs">{selectedReport.location}</p>
                </div>
              )}

              <div>
                <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Tanggal Dibuat</p>
                <p className="text-[#8A8680] text-xs">
                  {new Date(selectedReport.created_at).toLocaleDateString("id-ID", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="px-5 pb-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="w-full py-2.5 rounded-xl border border-[#2A2A2A] text-[#5C5850] text-xs hover:text-cream hover:border-[#3A3A3A] transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Confirm ───────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-[90%] max-w-sm">
            <h2 className="text-cream text-sm font-medium mb-2">Konfirmasi Logout</h2>
            <p className="text-[#5C5850] text-xs mb-5">Apakah kamu yakin ingin keluar dari akun ini?</p>
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
function SearchIcon({ size = 16, className = "" }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function CloseIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}