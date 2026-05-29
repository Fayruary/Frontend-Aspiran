"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://localhost:5000/api";

const NAV_ADMIN = [
  { label: "Dashboard",     icon: GridIcon,  href: "/admin"           },
  { label: "Semua Laporan", icon: FileIcon,  href: "/admin/laporan"   },
  { label: "Kategori",      icon: TagIcon,   href: "/admin/kategori"  },
  { label: "Statistik",     icon: ChartIcon, href: "/admin/statistik" },
];

export default function AdminKategori() {
  const router = useRouter();
  const [admin, setAdmin]           = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId]   = useState(null);
  const [newName, setNewName]       = useState("");
  const [formOpen, setFormOpen]     = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token      = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");
    if (!token || !storedUser) { router.push("/login"); return; }
    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "admin" && u.role !== "superadmin") { router.push("/dashboard"); return; }
      setAdmin(u);
      fetchCategories(token);
    } catch { router.push("/login"); }
  }, []);

  const fetchCategories = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch { setError("Gagal memuat kategori."); }
    finally   { setLoading(false); }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return setError("Nama kategori wajib diisi.");
    setAdding(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${API}/categories`, { name: newName.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewName("");
      setFormOpen(false);
      setSuccess("Kategori berhasil ditambahkan.");
      setTimeout(() => setSuccess(""), 3000);
      fetchCategories(token);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menambah kategori.");
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${API}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccess("Kategori berhasil dihapus.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus kategori.");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ── */}
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
                href === "/admin/kategori"
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
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full text-left text-xs text-[#5C5850] hover:text-red-400 transition-colors px-1 py-1 flex items-center gap-2">
            <LogoutIcon size={13} /> Keluar
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}>
              <MenuIcon size={20} />
            </button>
            <div>
              <p className="text-cream text-sm font-medium">Manajemen Kategori</p>
              <p className="text-[#5C5850] text-xs">Kelola kategori laporan</p>
            </div>
          </div>
          <button
            onClick={() => { setFormOpen(true); setError(""); }}
            className="bg-gold text-dark text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <PlusIcon size={13} /> Tambah Kategori
          </button>
        </header>

        <main className="flex-1 p-6 space-y-5">

          {/* Success */}
          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-emerald-400 text-sm flex items-center gap-2">
              <span>✓</span> {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
              <span>⚠ {error}</span>
              <button onClick={() => setError("")} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-4">
              <p className="text-[#5C5850] text-xs mb-2">Total Kategori</p>
              {loading
                ? <div className="h-9 w-10 bg-[#2A2A2A] rounded-lg animate-pulse" />
                : <p className="font-display text-4xl text-cream tracking-tight leading-none">{categories.length}</p>
              }
            </div>
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-4">
              <p className="text-[#5C5850] text-xs mb-2">Terakhir Ditambah</p>
              {loading
                ? <div className="h-9 w-28 bg-[#2A2A2A] rounded-lg animate-pulse" />
                : <p className="font-display text-lg text-gold tracking-tight leading-none mt-2">
  {categories[categories.length - 1]?.name ?? "—"}
</p>
              }
            </div>
          </div>

          {/* ── Category list ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
              <p className="text-cream text-sm font-medium">
                Daftar Kategori
                {!loading && (
                  <span className="text-[#5C5850] font-normal ml-2">({categories.length})</span>
                )}
              </p>
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="divide-y divide-[#1E1E1E]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2A2A2A] rounded-xl animate-pulse" />
                      <div className="w-32 h-3.5 bg-[#2A2A2A] rounded animate-pulse" />
                    </div>
                    <div className="w-16 h-7 bg-[#222] rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && categories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3">
                  <TagIcon size={20} />
                </div>
                <p className="text-[#5C5850] text-sm mb-1">Belum ada kategori</p>
                <button
                  onClick={() => setFormOpen(true)}
                  className="text-gold text-xs hover:underline mt-1"
                >
                  Tambah kategori pertama →
                </button>
              </div>
            )}

            {/* List */}
            {!loading && categories.length > 0 && (
              <div className="divide-y divide-[#1E1E1E]">
                {categories.map((cat, i) => (
                  <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1E1E1E] transition-colors group">
                    <div className="flex items-center gap-3">
                      {/* Index badge */}
                      <div className="w-8 h-8 rounded-xl bg-[#222] flex items-center justify-center shrink-0">
                        <span className="text-[#5C5850] text-xs font-mono">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <div>
                        <p className="text-cream text-sm font-medium">{cat.name}</p>
                        <p className="text-[#3A3A3A] text-[10px] mt-0.5">
                          {new Date(cat.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Delete button */}
                    {confirmId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[#5C5850] text-xs">Hapus?</span>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === cat.id ? "..." : "Ya"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs px-3 py-1.5 bg-[#2A2A2A] text-[#6B6760] rounded-lg hover:text-cream transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(cat.id)}
                        className="text-xs text-[#5C5850] hover:text-red-400 transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                      >
                        <TrashIcon size={13} /> Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
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

{/* ── Add modal ── */}
{formOpen && (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-cream text-sm font-medium">
          Tambah Kategori
        </h2>

        <button
          onClick={() => {
            setFormOpen(false);
            setNewName("");
            setError("");
          }}
          className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-[#5C5850] hover:text-cream transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label className="block text-xs text-[#5C5850] mb-1.5 ml-1">
            Nama Kategori
          </label>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contoh: Jalan Rusak"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-[#262626] text-cream text-sm border border-[#333] placeholder-[#3A3A3A] focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-3 py-2 text-red-400 text-xs">
            ⚠ {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setNewName("");
              setError("");
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#222] text-[#6B6760] text-sm hover:text-cream transition-colors"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={adding}
            className="flex-1 py-2.5 rounded-xl bg-gold text-dark text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {adding ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
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
function PlusIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function TrashIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function MenuIcon({ size = 20 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LogoutIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}