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

const STATUS_OPTIONS = ["pending", "verified", "process", "done", "rejected"];

const NAV_ADMIN = [
  { label: "Dashboard",     icon: GridIcon,  href: "/admin"           },
  { label: "Semua Laporan", icon: FileIcon,  href: "/admin/laporan"   },
  { label: "Statistik",     icon: ChartIcon, href: "/admin/statistik" },
];

export default function AdminLaporan() {
  const router = useRouter();
  const [admin, setAdmin]           = useState(null);
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(null);
  const [error, setError]           = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [search, setSearch]         = useState("");
  const [editingId, setEditingId]   = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Detail modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImg, setLightboxImg]       = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (!token || !user) { router.push("/login"); return; }
    try {
      const adminData = JSON.parse(user);
      if (!["admin", "superadmin"].includes(adminData.role)) {
        router.push("/dashboard");
        return;
      }
      setAdmin(adminData);
      fetchReports(token);
    } catch {
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
    } catch {
      setError("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async (id) => {
    const token = localStorage.getItem("token");
    if (!STATUS_OPTIONS.includes(editStatus)) { setError("Status tidak valid"); return; }
    setSaving(id);
    try {
      await axios.put(`${API}/laporan/${id}`, { status: editStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: editStatus } : r));
      if (selectedReport?.id === id) setSelectedReport((prev) => ({ ...prev, status: editStatus }));
      setEditingId(null);
    } catch {
      setError("Gagal update status.");
    } finally {
      setSaving(null);
    }
  };

  // ── Filter + Search ───────────────────────────────────────────────────
  const filtered = reports.filter((r) => {
    const matchStatus = filterStatus === "semua" || r.status === filterStatus;
    const matchSearch =
      search === "" ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.username?.toLowerCase().includes(search.toLowerCase()) ||
      r.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Counts ───────────────────────────────────────────────────────────
  const count    = (s) => reports.filter((r) => r.status === s).length;
  const total    = reports.length;
  const done     = count("done");
  const process  = count("process") + count("verified");
  const pending  = count("pending");
  const rejected = count("rejected");
  const rate     = total ? Math.round((done / total) * 100) : 0;

  // ── Helper: normalise image field ─────────────────────────────────────
  // Backend bisa mengembalikan: r.image, r.images (array/string JSON), r.photo, dsb.
  const getImages = (r) => {
    const raw = r.images ?? r.image ?? r.photo ?? null;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [parsed]; }
    catch { return [String(raw)]; }
  };

  // ── Full image URL ────────────────────────────────────────────────────
  const imgUrl = (img) => {
  if (!img) return null;
  return `http://localhost:5000/uploads/${img}`;
};

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                label === "Semua Laporan"
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

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}>
              <MenuIcon size={20} />
            </button>
            <div>
              <p className="text-cream text-sm font-medium">Semua Laporan</p>
              <p className="text-[#5C5850] text-xs">Kelola & pantau seluruh laporan masyarakat</p>
            </div>
          </div>
          {!loading && (
            <span className="text-[10px] px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded-full">
              {rate}% diselesaikan
            </span>
          )}
        </header>

        <main className="flex-1 p-6 space-y-5">

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total",    value: total,    color: "text-cream"       },
              { label: "Selesai",  value: done,     color: "text-emerald-400" },
              { label: "Diproses", value: process,  color: "text-amber-400"   },
              { label: "Pending",  value: pending,  color: "text-sky-400"     },
              { label: "Ditolak",  value: rejected, color: "text-red-400"     },
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

          {/* ── Search + Filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5850]" />
              <input
                type="text"
                placeholder="Cari judul, pelapor, kategori, atau kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/40 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["semua", ...STATUS_OPTIONS].map((s) => {
                const st = STATUS_MAP[s];
                const isActive = filterStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      isActive
                        ? s === "semua"
                          ? "bg-gold/15 border-gold/30 text-gold"
                          : `${st.bg} border-transparent ${st.text}`
                        : "bg-[#1A1A1A] border-[#2A2A2A] text-[#5C5850] hover:text-cream hover:border-[#3A3A3A]"
                    }`}
                  >
                    {s === "semua" ? "Semua" : st?.label ?? s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">

            <div className="overflow-x-auto">
              {loading ? (
                <div className="divide-y divide-[#1E1E1E]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4">
                      {[40, 15, 15, 10, 10, 10].map((w, j) => (
                        <div key={j} className="h-3 bg-[#2A2A2A] rounded animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[#5C5850] text-sm">Tidak ada laporan yang cocok.</p>
                  {(search || filterStatus !== "semua") && (
                    <button onClick={() => { setSearch(""); setFilterStatus("semua"); }} className="text-gold text-xs mt-2 hover:underline">
                      Reset filter →
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1E1E1E]">
                      {["Laporan", "Pelapor", "Kategori", "Foto", "Tgl Masuk", "Status", "Aksi"].map((h) => (
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
                      const images    = getImages(r);

                      return (
                        <tr key={r.id} className="hover:bg-[#1C1C1C] transition-colors">

                          {/* Judul + kode */}
                          <td className="px-5 py-3.5 max-w-[200px]">
                            <button
                              onClick={() => setSelectedReport(r)}
                              className="text-left group"
                            >
                              <p className="text-cream text-xs truncate group-hover:text-gold transition-colors">{r.title}</p>
                              <p className="text-[#3A3A3A] text-[10px] font-mono mt-0.5">{r.tracking_code}</p>
                            </button>
                          </td>

                          {/* Pelapor */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[8px] font-bold shrink-0">
                                {r.username?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <p className="text-[#7A756D] text-xs">{r.username || "Unknown"}</p>
                            </div>
                          </td>

                          {/* Kategori */}
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#6B6760] whitespace-nowrap">
                              {r.category ?? "—"}
                            </span>
                          </td>

                          {/* Foto thumbnail */}
                          <td className="px-5 py-3.5">
                            {images.length > 0 ? (
                              <button
                                onClick={() => { setSelectedReport(r); }}
                                className="flex items-center gap-1.5 group"
                              >
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#2A2A2A] shrink-0">
                                  <img
                                    src={imgUrl(images[0])}
                                    alt="foto laporan"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = "none"; }}
                                  />
                                </div>
                                {images.length > 1 && (
                                  <span className="text-[10px] text-[#5C5850] group-hover:text-gold transition-colors">
                                    +{images.length - 1}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-[#3A3A3A] text-xs">—</span>
                            )}
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

                          {/* Aksi */}
                          <td className="px-5 py-3.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="text-[10px] bg-[#262626] border border-[#333] text-cream rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold"
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{STATUS_MAP[s]?.label ?? s}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSaveStatus(r.id)}
                                  disabled={isSaving}
                                  className="text-[10px] px-2.5 py-1.5 bg-gold text-dark rounded-lg font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {isSaving ? "..." : "Simpan"}
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-[10px] text-[#5C5850] hover:text-cream px-1">✕</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setEditingId(r.id); setEditStatus(r.status || "pending"); }}
                                  className="text-[10px] text-[#5C5850] hover:text-gold transition-colors flex items-center gap-1 whitespace-nowrap"
                                >
                                  <EditIcon size={11} /> Ubah
                                </button>
                                <button
                                  onClick={() => setSelectedReport(r)}
                                  className="text-[10px] text-[#5C5850] hover:text-cream transition-colors flex items-center gap-1 whitespace-nowrap"
                                >
                                  <EyeIcon size={11} /> Detail
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-[#1E1E1E]">
                <p className="text-[#4A4A4A] text-[10px]">
                  Menampilkan <span className="text-[#6B6760]">{filtered.length}</span> dari{" "}
                  <span className="text-[#6B6760]">{reports.length}</span> laporan
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {selectedReport && (() => {
        const st     = STATUS_MAP[selectedReport.status] ?? STATUS_MAP.pending;
        const images = getImages(selectedReport);
        const isEditingModal = editingId === selectedReport.id;
        const isSavingModal  = saving === selectedReport.id;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
            onClick={() => { setSelectedReport(null); setEditingId(null); }}
          >
            <div
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-cream text-sm font-medium">Detail Laporan</p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <button onClick={() => { setSelectedReport(null); setEditingId(null); }} className="text-[#5C5850] hover:text-cream transition-colors">
                  <CloseIcon size={16} />
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                {/* Foto-foto laporan */}
                {images.length > 0 && (
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-2">Foto Laporan</p>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightboxImg(imgUrl(img))}
                          className="relative aspect-square rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-gold/40 transition-colors group"
                        >
                          <img
                            src={imgUrl(img)}
                            alt={`foto ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.parentElement.innerHTML =
                                `<div class="w-full h-full bg-[#222] flex items-center justify-center text-[#3A3A3A] text-xs">Gagal</div>`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIcon size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[#4A4A4A] text-[10px] mt-1.5">Klik foto untuk memperbesar</p>
                  </div>
                )}

                {/* Info laporan */}
                <div>
                  <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Judul</p>
                  <p className="text-cream text-sm">{selectedReport.title}</p>
                </div>

                {selectedReport.description && (
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Deskripsi</p>
                    <p className="text-[#8A8680] text-xs leading-relaxed">{selectedReport.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Pelapor</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[8px] font-bold">
                        {selectedReport.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <p className="text-[#8A8680] text-xs">{selectedReport.username || "Unknown"}</p>
                    </div>
                  </div>
                  {selectedReport.category && (
                    <div>
                      <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kategori</p>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#222] text-[#8A8680]">{selectedReport.category}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.tracking_code && (
                    <div>
                      <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kode Tracking</p>
                      <p className="text-[#8A8680] text-xs font-mono">{selectedReport.tracking_code}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-[#8A8680] text-xs">
                      {new Date(selectedReport.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {selectedReport.location && (
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Lokasi</p>
                    <p className="text-[#8A8680] text-xs">{selectedReport.location}</p>
                  </div>
                )}

                {/* Ubah Status di dalam modal */}
                <div>
                  <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-2">Ubah Status</p>
                  {isEditingModal ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="text-xs bg-[#262626] border border-[#333] text-cream rounded-xl px-3 py-2 focus:outline-none focus:border-gold flex-1"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_MAP[s]?.label ?? s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveStatus(selectedReport.id)}
                        disabled={isSavingModal}
                        className="px-4 py-2 text-xs bg-gold text-dark rounded-xl font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                      >
                        {isSavingModal ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-[#5C5850] hover:text-cream px-2">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(selectedReport.id); setEditStatus(selectedReport.status || "pending"); }}
                      className="flex items-center gap-2 text-xs text-[#5C5850] hover:text-gold transition-colors border border-[#2A2A2A] hover:border-gold/30 px-3 py-2 rounded-xl"
                    >
                      <EditIcon size={12} /> Ubah Status Laporan
                    </button>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-5 pb-4 pt-2 shrink-0">
                <button
                  onClick={() => { setSelectedReport(null); setEditingId(null); }}
                  className="w-full py-2.5 rounded-xl border border-[#2A2A2A] text-[#5C5850] text-xs hover:text-cream hover:border-[#3A3A3A] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <CloseIcon size={22} />
          </button>
          <img
            src={lightboxImg}
            alt="foto laporan"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Logout Confirm ───────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-[90%] max-w-sm">
            <h2 className="text-cream text-sm font-medium mb-2">Konfirmasi Logout</h2>
            <p className="text-[#5C5850] text-xs mb-5">Apakah kamu yakin ingin keluar dari akun ini?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">
                Batal
              </button>
              <button
                onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.replace("/login"); }}
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
function ChartIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function EditIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;
}
function EyeIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>;
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
function ZoomIcon({ size = 16, className = "" }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3-3M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}