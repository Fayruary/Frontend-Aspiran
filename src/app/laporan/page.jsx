"use client";

import { useState, useEffect, useRef } from "react";
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

const imgUrl = path => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `http://localhost:5000/uploads/${clean}`;
};

export default function LaporanSaya() {
  const router = useRouter();
  const commentEndRef = useRef(null);

  const [user, setUser]                     = useState(null);
  const [reports, setReports]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeFilter, setActiveFilter]     = useState("Semua");
  const [search, setSearch]                 = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImg, setLightboxImg]       = useState(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
const [editForm, setEditForm] = useState({
  title: "",
  description: "",
  category_id: null,
});
const [savingReport, setSavingReport] = useState(false);

  // Comments
  const [comments, setComments]               = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment]           = useState("");
  const [sendingComment, setSendingComment]   = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText]   = useState("");
  const [savingComment, setSavingComment]     = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  useEffect(() => {
    const token      = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) { router.push("/login"); return; }
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchReports(token, userData.id);
    } catch { router.push("/login"); }
  }, []);

  useEffect(() => {
    if (comments.length > 0) commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const fetchReports = async (token, userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/laporan`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data.filter(r => r.user_id === userId));
    } catch { setError("Gagal memuat data laporan."); }
    finally { setLoading(false); }
  };

  // ── Comments ──────────────────────────────────────────────────────────
  const fetchComments = async (laporanId) => {
    const token = localStorage.getItem("token");
    try {
      setCommentsLoading(true);
      const res = await axios.get(`${API}/comments/${laporanId}`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(res.data || []);
    } catch { setComments([]); }
    finally { setCommentsLoading(false); }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedReport) return;
    const token = localStorage.getItem("token");
    setSendingComment(true);
    try {
      await axios.post(`${API}/comments`, { comment: newComment.trim(), laporan_id: selectedReport.id },
        { headers: { Authorization: `Bearer ${token}` } });
      setNewComment("");
      await fetchComments(selectedReport.id);
    } catch { setError("Gagal mengirim komentar."); }
    finally { setSendingComment(false); }
  };

  const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories(res.data);
  };

  fetchCategories();
}, []);

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    const token = localStorage.getItem("token");
    setSavingComment(true);
    try {
      await axios.put(`${API}/comments/${commentId}`, { comment: editCommentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } });
      setEditingCommentId(null);
      setEditCommentText("");
      await fetchComments(selectedReport.id);
    } catch { setError("Gagal mengubah komentar."); }
    finally { setSavingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");
    setDeletingCommentId(commentId);
    try {
      await axios.delete(`${API}/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchComments(selectedReport.id);
    } catch { setError("Gagal menghapus komentar."); }
    finally { setDeletingCommentId(null); }
  };

  const handleUpdateReport = async () => {
  const token = localStorage.getItem("token");

  if (!editForm.title || !editForm.description) {
    setError("Judul dan deskripsi wajib diisi");
    return;
  }

  setSavingReport(true);

  try {
    await axios.put(
  `${API}/laporan/${selectedReport.id}`,
  {
    title: editForm.title,
    description: editForm.description,
    category_id: Number(editForm.category_id),
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

// update list dulu
setReports(prev => {
  const updated = prev.map(r =>
    r.id === selectedReport.id
      ? {
          ...r,
          title: editForm.title,
          description: editForm.description,
          category_id: Number(editForm.category_id),
          category: categories.find(c => c.id === Number(editForm.category_id))?.name
        }
      : r
  );

  // ambil ulang data untuk modal dari hasil terbaru
  const newSelected = updated.find(r => r.id === selectedReport.id);
  setSelectedReport(newSelected);

  return updated;
});

setIsEditingReport(false);

    // refresh data
    fetchReports(token, user.id);

    // update data yang sedang dibuka
    setSelectedReport({
      ...selectedReport,
      ...editForm,
    });

  } catch (err) {
  console.log(err.response?.data); // 👈 WAJIB
  setError(err.response?.data?.message || "Gagal update laporan");
  } finally {
    setSavingReport(false);
  }
};

  const openReport = (r) => {
    setSelectedReport(r);
    setComments([]);
    setNewComment("");
    setEditingCommentId(null);
     setEditForm({
    title: r.title || "",
    description: r.description || "",
    category_id: r.category_id ? Number(r.category_id) : null,
  });

  setIsEditingReport(false);
    fetchComments(r.id);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setEditingCommentId(null);
    setNewComment("");
  };

  const filtered = reports.filter(r => {
    const matchStatus = activeFilter === "Semua" || r.status === activeFilter;
    const matchSearch = search === "" ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#141414] border-r border-[#222] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-6 h-16 flex items-center border-b border-[#222]">
          <Link href="/" className="font-display text-cream text-[16px] tracking-tight">Aspir<span className="text-gold">an</span></Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${label === "Laporan Saya" ? "bg-gold/10 text-gold font-medium" : "text-[#6B6760] hover:text-cream hover:bg-[#1E1E1E]"}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[#222] p-4">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">{user.username?.charAt(0)?.toUpperCase() || "U"}</div>
              <div className="min-w-0">
                <p className="text-cream text-xs font-medium truncate">{user.username || "User"}</p>
                <p className="text-[#5C5850] text-[10px] truncate">{user.email || ""}</p>
              </div>
            </div>
          )}
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full text-left text-xs text-[#5C5850] hover:text-red-400 transition-colors px-1 py-1 flex items-center gap-2">
            <LogoutIcon size={13} /> Keluar
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}><MenuIcon size={20} /></button>
            <div>
              <p className="text-cream text-sm font-medium">Laporan Saya</p>
              <p className="text-[#5C5850] text-xs">Riwayat semua laporan yang telah Anda buat</p>
            </div>
          </div>
          <Link href="/laporan/tambah" className="bg-gold text-dark text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <PlusIcon size={13} /> Buat Laporan
          </Link>
        </header>

        <main className="flex-1 p-6 space-y-4">
          {error && <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5850]" />
              <input type="text" placeholder="Cari judul, kategori, atau kode laporan..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/40 transition-colors" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => {
                const st = STATUS_MAP[f];
                const isActive = activeFilter === f;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${isActive ? f === "Semua" ? "bg-gold/15 border-gold/30 text-gold" : `${st.bg} border-transparent ${st.text}` : "bg-[#1A1A1A] border-[#2A2A2A] text-[#5C5850] hover:text-cream hover:border-[#3A3A3A]"}`}>
                    {f === "Semua" ? "Semua" : st?.label ?? f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#222] text-[#5C5850] text-[10px] uppercase tracking-widest">
              <span>Laporan</span><span>Kategori</span><span>Kode</span><span>Tanggal</span><span>Status</span>
            </div>

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
                <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3"><FileIcon size={20} /></div>
                <p className="text-[#5C5850] text-sm mb-1">{search || activeFilter !== "Semua" ? "Tidak ada laporan yang cocok" : "Belum ada laporan"}</p>
                {search || activeFilter !== "Semua"
                  ? <button onClick={() => { setSearch(""); setActiveFilter("Semua"); }} className="text-gold text-xs mt-1 hover:underline">Reset filter →</button>
                  : <Link href="/laporan/tambah" className="text-gold text-xs mt-1 hover:underline">Buat laporan pertama Anda →</Link>
                }
              </div>
            ) : (
              <div className="divide-y divide-[#1E1E1E]">
                {filtered.map(r => {
                  const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                  return (
                    <div key={r.id} onClick={() => openReport(r)}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-[#1E1E1E] transition-colors cursor-pointer items-center">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <div className="min-w-0">
                          <p className="text-cream text-sm truncate">{r.title}</p>
                          <div className="flex md:hidden items-center gap-2 mt-1 flex-wrap">
                            {r.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2A2A] text-[#6B6760]">{r.category}</span>}
                            <span className="text-[#5C5850] text-[10px]">{new Date(r.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block">{r.category ? <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#222] text-[#6B6760]">{r.category}</span> : <span className="text-[#3A3A3A] text-xs">—</span>}</div>
                      <div className="hidden md:block"><span className="text-[10px] font-mono text-[#4A4A4A]">{r.tracking_code || "—"}</span></div>
                      <div className="hidden md:block"><span className="text-[#5C5850] text-xs">{new Date(r.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</span></div>
                      <div className="hidden md:block"><span className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${st.bg} ${st.text}`}>{st.label}</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-[#1E1E1E]">
                <p className="text-[#4A4A4A] text-[10px]">Menampilkan <span className="text-[#6B6760]">{filtered.length}</span> dari <span className="text-[#6B6760]">{reports.length}</span> laporan</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Detail + Comment Modal ──────────────────────────────────────── */}
      {selectedReport && (() => {

  let parsedImages = [];

  if (selectedReport.image) {
    try {
      parsedImages = JSON.parse(selectedReport.image);
    } catch {
      parsedImages = [selectedReport.image];
    }
  }

  const imageUrls = parsedImages.map(img => imgUrl(img));

  const st = STATUS_MAP[selectedReport.status] ?? STATUS_MAP.pending;

  return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 lg:p-6" onClick={closeModal}>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col lg:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* ── Kolom kiri: Detail ── */}
              <div className="flex flex-col lg:w-[55%] border-b lg:border-b-0 lg:border-r border-[#222] max-h-[45vh] lg:max-h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2">
  <p className="text-cream text-sm font-medium">Detail Laporan</p>

  {selectedReport.status === "pending" && !isEditingReport && (
    <button
      onClick={() => setIsEditingReport(true)}
      className="text-[10px] px-2.5 py-1 bg-gold text-dark rounded-lg hover:opacity-90"
    >
      Edit
    </button>
  )}
</div>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <button onClick={closeModal} className="text-[#5C5850] hover:text-cream transition-colors"><CloseIcon size={16} /></button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {/* Foto */}
                  {imageUrls.length > 0 && (
  <div>
    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-2">
      Foto Laporan
    </p>

    <div className="grid grid-cols-2 gap-2">
      {imageUrls.map((img, i) => (
        <button
          key={i}
          onClick={() => setLightboxImg(img)}
          className="rounded-xl overflow-hidden border border-[#2A2A2A] hover:border-gold/40 transition-colors group relative"
        >
          <img
            src={img}
            alt="foto laporan"
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center">
            <ZoomIcon className="text-white opacity-0 group-hover:opacity-100" />
          </div>
        </button>
      ))}
    </div>

    <p className="text-[#4A4A4A] text-[10px] mt-1.5">
      Klik foto untuk memperbesar
    </p>
  </div>
)}
                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Judul</p>
                    {isEditingReport ? (
  <input
    value={editForm.title}
    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
    className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-cream"
  />
) : (
  <p className="text-cream text-sm">{selectedReport.title}</p>
)}
                  </div>

                  {selectedReport.description && (
                    <div>
                      <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Deskripsi</p>
                      {isEditingReport ? (
  <textarea
    value={editForm.description}
    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
    rows={4}
    className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-cream"
  />
) : (
  <p className="text-[#8A8680] text-xs leading-relaxed">{selectedReport.description}</p>
)}

                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.category && (
                      <div>
                        <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kategori</p>
                       {isEditingReport ? (
  <select
    value={editForm.category_id ?? ""}
    onChange={(e) =>
      setEditForm({
        ...editForm,
        category_id: Number(e.target.value),
      })
    }
    className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-cream"
  >
    <option value=""disabled hidden>Pilih kategori</option>
    {categories.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ))}
  </select>
) : (
  <span className="text-xs px-2.5 py-1 rounded-full bg-[#222] text-[#8A8680]">
    {selectedReport.category}
  </span>
)}

                      </div>
                    )}
                    {selectedReport.tracking_code && (
                      <div>
                        <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Kode Tracking</p>
                        <p className="text-[#8A8680] text-xs font-mono">{selectedReport.tracking_code}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[#5C5850] text-[10px] uppercase tracking-widest mb-1">Tanggal Dibuat</p>
                    <p className="text-[#8A8680] text-xs">{new Date(selectedReport.created_at).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
                  </div>
                  {isEditingReport && (
  <div className="flex gap-2 pt-2">
    <button
      onClick={() => setIsEditingReport(false)}
      className="text-xs px-3 py-2 text-[#5C5850] hover:text-cream"
    >
      Batal
    </button>

    <button
      onClick={handleUpdateReport}
      disabled={savingReport}
      className="text-xs px-4 py-2 bg-gold text-dark rounded-lg hover:opacity-90 disabled:opacity-50"
    >
      {savingReport ? "Menyimpan..." : "Simpan"}
    </button>
  </div>
)}
                </div>
              </div>

              {/* ── Kolom kanan: Komentar ── */}
              <div className="flex flex-col lg:flex-1 min-h-0">
                <div className="px-5 py-4 border-b border-[#222] shrink-0 flex items-center gap-2">
                  <CommentIcon size={14} />
                  <p className="text-cream text-sm font-medium">Komentar</p>
                  {comments.length > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-gold/15 text-gold rounded-full">{comments.length}</span>}
                  <span className="ml-auto flex items-center gap-1 text-[9px] px-2 py-0.5 bg-[#222] text-[#5C5850] border border-[#2A2A2A] rounded-full">
                    <LockIcon size={8} /> Privat
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {commentsLoading ? (
                    <div className="space-y-3 pt-1">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#2A2A2A] animate-pulse shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2 bg-[#2A2A2A] rounded animate-pulse w-1/4" />
                            <div className="h-10 bg-[#222] rounded-xl animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3"><CommentIcon size={18} /></div>
                      <p className="text-[#3A3A3A] text-xs">Belum ada komentar</p>
                      <p className="text-[#2A2A2A] text-[10px] mt-0.5">Admin dapat merespons laporan Anda di sini</p>
                    </div>
                  ) : (
                    comments.map((c, i) => {
                      const isAdminComment = ["admin","superadmin"].includes(c.role);
                      const isMine = c.user_id === user?.id;
                      const isEditingThis = editingCommentId === c.id;
                      const isDeletingThis = deletingCommentId === c.id;
                      return (
                        <div key={i} className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5 ${isAdminComment ? "bg-red-900/40 text-red-400" : "bg-gold/20 text-gold"}`}>
                            {c.username?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className={`flex-1 flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                            <div className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : ""}`}>
                              <span className="text-[#6B6760] text-[10px] font-medium">{c.username}</span>
                              {isAdminComment && <span className="text-[8px] px-1.5 py-0.5 bg-red-950/60 text-red-400 border border-red-900/30 rounded-full">admin</span>}
                              <span className="text-[#2A2A2A] text-[9px]">
                                {new Date(c.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"short" })}
                                {" "}{new Date(c.created_at).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}
                              </span>
                            </div>

                            {isEditingThis ? (
                              <div className="w-full max-w-[90%] space-y-1.5">
                                <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} rows={2}
                                  className="w-full bg-[#222] border border-gold/30 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none resize-none" />
                                <div className={`flex gap-1.5 ${isMine ? "justify-start flex-row-reverse" : ""}`}>
                                  <button onClick={() => setEditingCommentId(null)} className="text-[10px] text-[#5C5850] hover:text-cream px-2 py-1">Batal</button>
                                  <button onClick={() => handleEditComment(c.id)} disabled={savingComment}
                                    className="text-[10px] px-3 py-1 bg-gold text-dark rounded-lg font-medium hover:opacity-90 disabled:opacity-50">
                                    {savingComment ? "..." : "Simpan"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group/bubble max-w-[88%]">
                                <div className={`text-xs px-3 py-2.5 rounded-2xl leading-relaxed ${
                                  isMine
                                    ? "bg-[#242424] text-[#8A8680] border-[#2A2A2A] rounded-tr-sm"
                                    : isAdminComment
                                      ? "bg-red-950/30 text-red-100/80 border border-red-900/20 rounded-tl-sm"
                                      : "bg-[#242424] text-[#8A8680] border border-[#2A2A2A] rounded-tl-sm"
                                }`}>
                                  {c.comment}
                                </div>
                                {isMine && (
                                  <div className={`absolute -top-7 right-0 hidden group-hover/bubble:flex items-center gap-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg px-1.5 py-1 shadow-xl z-10`}>
                                    <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }}
                                      className="text-[#5C5850] hover:text-gold transition-colors p-0.5" title="Edit">
                                      <EditIcon size={10} />
                                    </button>
                                    <div className="w-px h-3 bg-[#2A2A2A]" />
                                    <button onClick={() => handleDeleteComment(c.id)} disabled={isDeletingThis}
                                      className="text-[#5C5850] hover:text-red-400 transition-colors p-0.5 disabled:opacity-40" title="Hapus">
                                      {isDeletingThis ? <SpinIcon size={10} /> : <TrashIcon size={10} />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={commentEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-[#222] shrink-0">
                  <div className="flex gap-2 items-end">
                    <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[9px] font-bold shrink-0 mb-0.5">
                      {user?.username?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                      placeholder="Tulis komentar..."
                      rows={1}
                      className="flex-1 bg-[#222] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/40 transition-colors resize-none"
                      style={{ maxHeight: "80px", overflowY: "auto" }}
                    />
                    <button onClick={handleSendComment} disabled={sendingComment || !newComment.trim()}
                      className="w-9 h-9 bg-gold text-dark rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 mb-0.5">
                      {sendingComment ? <SpinIcon size={13} /> : <SendIcon size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxImg(null)}><CloseIcon size={22} /></button>
          <img src={lightboxImg} alt="foto laporan" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Logout Confirm ─────────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-[90%] max-w-sm">
            <h2 className="text-cream text-sm font-medium mb-2">Konfirmasi Logout</h2>
            <p className="text-[#5C5850] text-xs mb-5">Apakah kamu yakin ingin keluar dari akun ini?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
              <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.replace("/login"); }}
                className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
function GridIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function FileIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="gray" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="gray" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function PlusIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function MenuIcon({ size=20 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function LogoutIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SearchIcon({ size=16, className="" }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function CloseIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function ZoomIcon({ size=16, className="" }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20l-3-3M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function CommentIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="gray" strokeWidth="1.5" strokeLinejoin="round"/></svg>; }
function SendIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function EditIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>; }
function TrashIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function LockIcon({ size=10 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function SpinIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/></svg>; }