"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://localhost:5000/api";

// Status sesuai ENUM di database:
// 'pending','verified','process','done','rejected'
const STATUS_MAP = {
  pending:  { label: "Pending",  bg: "bg-sky-950/50",     text: "text-sky-400",     dot: "bg-sky-400"     },
  verified: { label: "Verified", bg: "bg-blue-950/50",    text: "text-blue-400",    dot: "bg-blue-400"    },
  process:  { label: "Diproses", bg: "bg-amber-950/50",   text: "text-amber-400",   dot: "bg-amber-400"   },
  done:     { label: "Selesai",  bg: "bg-emerald-950/50", text: "text-emerald-400", dot: "bg-emerald-400" },
  rejected: { label: "Ditolak",  bg: "bg-red-950/50",     text: "text-red-400",     dot: "bg-red-400"     },
};

const STATUS_OPTIONS = ["pending", "verified", "process", "done", "rejected"];

const NAV_ADMIN = [
  { label: "Dashboard",     icon: GridIcon,  href: "/admin"           },
  { label: "Semua Laporan", icon: FileIcon,  href: "/admin/laporan"   },
  { label: "Kategori",      icon: TagIcon,   href: "/admin/kategori"  },
  { label: "Statistik",     icon: ChartIcon, href: "/admin/statistik" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin]             = useState(null);
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(null); // id yang sedang disimpan
  const [error, setError]             = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [editingId, setEditingId]     = useState(null);
  const [editStatus, setEditStatus]   = useState("");
  const [activeNav, setActiveNav]     = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    router.push("/login");
    return;
  }

  try {
    const adminData = JSON.parse(user);

    // VALIDASI ROLE (backend DB kamu)
    if (!["admin", "superadmin"].includes(adminData.role)) {
      router.push("/dashboard");
      return;
    }

    setAdmin(adminData);
    fetchReports(token);

  } catch (err) {
    console.log(err);
    router.push("/login");
  }
}, []);

  const fetchReports = async (token) => {
  try {
    setLoading(true);

    const res = await axios.get(`${API}/laporan`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setReports(res.data || []);

  } catch (err) {
    console.log(err);
    setError("Gagal memuat data laporan.");
  } finally {
    setLoading(false);
  }
};

  // PATCH /api/laporan/:id — updateStatus dari backend Anda
  const handleSaveStatus = async (id) => {
  const token = localStorage.getItem("token");

  if (!STATUS_OPTIONS.includes(editStatus)) {
    setError("Status tidak valid");
    return;
  }

  setSaving(id);

  try {
    await axios.put(`${API}/laporan/${id}`, {
      status: editStatus
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: editStatus } : r
      )
    );

    setEditingId(null);

  } catch (err) {
    console.log(err);
    setError("Gagal update status");
  } finally {
    setSaving(null);
  }
};

  // ── Stat counts ──────────────────────────────────────────────────────
  const count    = (s) => reports.filter((r) => r.status === s).length;
  const total    = reports.length;
  const done     = count("done");
  const process  = count("process") + count("verified");
  const pending  = count("pending");
  const rejected = count("rejected");
  const rate     = total ? Math.round((done / total) * 100) : 0;

  // ── Chart per bulan ───────────────────────────────────────────────────
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const year   = new Date().getFullYear();
  const chartData = MONTHS.map((month, i) => {
    const inMonth = reports.filter((r) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === year && d.getMonth() === i;
    });
    return {
      month,
      done:     inMonth.filter((r) => r.status === "done").length,
      process:  inMonth.filter((r) => r.status === "process" || r.status === "verified").length,
      pending:  inMonth.filter((r) => r.status === "pending").length,
      rejected: inMonth.filter((r) => r.status === "rejected").length,
    };
  });
  const maxBar = Math.max(...chartData.map((d) => d.done + d.process + d.pending + d.rejected), 1);

  // ── Filter tabel ──────────────────────────────────────────────────────
  const filtered = filterStatus === "semua"
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-[#141414] border-r border-[#222]
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        <div className="px-5 h-16 flex items-center gap-2 border-b border-[#222]">
          <Link href="/" className="font-display text-cream text-[15px] tracking-tight">
            Aspir<span className="text-gold">an</span>
          </Link>
          <span className="text-[9px] px-1.5 py-0.5 bg-red-950/60 text-red-400 border border-red-900/40 rounded-full font-medium">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ADMIN.map(({ label, icon: Icon, href }) => (
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
          {admin && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 text-xs font-bold">
                {admin.username?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-cream text-xs font-medium truncate">{admin.username}</p>
                <p className="text-[#5C5850] text-[10px] capitalize">{admin.role}</p>
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
              <p className="text-cream text-sm font-medium">Panel Admin</p>
              <p className="text-[#5C5850] text-xs">Kelola semua laporan masyarakat</p>
            </div>
          </div>
          {!loading && (
            <span className="text-[10px] px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded-full">
              {rate}% diselesaikan
            </span>
          )}
        </header>

        <main className="flex-1 p-6 space-y-6">

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Laporan", value: total,    color: "text-cream"        },
              { label: "Selesai",       value: done,     color: "text-emerald-400"  },
              { label: "Diproses",      value: process,  color: "text-amber-400"    },
              { label: "Pending",       value: pending,  color: "text-sky-400"      },
              { label: "Ditolak",       value: rejected, color: "text-red-400"      },
            ].map((s, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-4">
                <p className="text-[#5C5850] text-xs mb-2">{s.label}</p>
                {loading
                  ? <div className="h-9 w-10 bg-[#2A2A2A] rounded-lg animate-pulse" />
                  : <p className={`font-display text-4xl tracking-tight leading-none ${s.color}`}>{s.value}</p>
                }
              </div>
            ))}
          </div>

          {/* ── Stacked bar chart ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[#5C5850] text-xs mb-0.5">Tren laporan</p>
                <p className="text-cream text-sm font-medium">Statistik bulanan {year}</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {[
                  { color: "bg-emerald-500/70", label: "Selesai"  },
                  { color: "bg-amber-500/70",   label: "Diproses" },
                  { color: "bg-sky-500/70",     label: "Pending"  },
                  { color: "bg-red-500/70",     label: "Ditolak"  },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[#5C5850] text-[10px]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-36 bg-[#222] rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-end gap-2 h-36">
                {chartData.map((d, i) => {
                  const totalBar = d.done + d.process + d.pending + d.rejected;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden"
                        style={{ height: `${(totalBar / maxBar) * 100}%`, minHeight: totalBar ? "8px" : "2px" }}
                      >
                        <div className="bg-emerald-500/70" style={{ flex: d.done     || 0 }} />
                        <div className="bg-amber-500/70"   style={{ flex: d.process  || 0 }} />
                        <div className="bg-sky-500/70"     style={{ flex: d.pending  || 0 }} />
                        <div className="bg-red-500/70"     style={{ flex: d.rejected || 0 }} />
                      </div>
                      <p className="text-[#5C5850] text-[9px]">{d.month}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Tabel laporan ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] flex-wrap gap-3">
              <p className="text-cream text-sm font-medium">
                Semua Laporan
                {!loading && <span className="text-[#5C5850] font-normal ml-2">({filtered.length})</span>}
              </p>
              {/* Filter buttons — sesuai ENUM database */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {["semua", ...STATUS_OPTIONS].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[10px] px-3 py-1.5 rounded-full capitalize transition-colors ${
                      filterStatus === s
                        ? "bg-gold text-dark font-medium"
                        : "text-[#5C5850] hover:text-cream border border-[#2A2A2A]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="divide-y divide-[#1E1E1E]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="h-3 bg-[#2A2A2A] rounded animate-pulse" style={{ width: `${[40,15,15,12,10][j]}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1E1E1E]">
                      {["Laporan", "Pelapor", "Kategori", "Tgl Masuk", "Status", "Aksi"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-medium text-[#5C5850] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {filtered.map((r) => {
                      const st        = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                      const isEditing = editingId === r.id;
                      const isSaving  = saving === r.id;
                      return (
                        <tr key={r.id} className="hover:bg-[#1E1E1E] transition-colors">
                          {/* Judul + tracking code */}
                          <td className="px-5 py-3.5 max-w-[220px]">
                            <p className="text-cream text-xs truncate">{r.title}</p>
                            <p className="text-[#3A3A3A] text-[10px] font-mono mt-0.5">{r.tracking_code}</p>
                          </td>
                          {/* Username dari JOIN users */}
                          <td className="px-5 py-3.5">
                           <p className="text-[#7A756D] text-xs">
  {r.username || "Unknown"}
</p>
                          </td>
                          {/* Category dari JOIN categories */}
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#6B6760] whitespace-nowrap">
                              {r.category ?? "—"}
                            </span>
                          </td>
                          {/* Tanggal */}
                          <td className="px-5 py-3.5">
                            <p className="text-[#5C5850] text-xs whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </p>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                          </td>
                          {/* Aksi ubah status — memanggil updateStatus backend */}
                          <td className="px-5 py-3.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="text-[10px] bg-[#262626] border border-[#333] text-cream rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold"
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSaveStatus(r.id)}
                                  disabled={isSaving}
                                  className="text-[10px] px-2.5 py-1.5 bg-gold text-dark rounded-lg font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {isSaving ? "..." : "Simpan"}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-[10px] text-[#5C5850] hover:text-cream px-1"
                                >✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { 
  setEditingId(r.id); 
  setEditStatus(r.status || "pending"); 
}}
                                className="text-[10px] text-[#5C5850] hover:text-gold transition-colors flex items-center gap-1 whitespace-nowrap"
                              >
                                <EditIcon size={11} /> Ubah Status
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-14">
                  <p className="text-[#5C5850] text-sm">Tidak ada laporan dengan filter ini.</p>
                </div>
              )}
            </div>
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
          Logout
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
function TagIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>;
}
function ChartIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function EditIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
}
function MenuIcon({ size = 20 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LogoutIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}