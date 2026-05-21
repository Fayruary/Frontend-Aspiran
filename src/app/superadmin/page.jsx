"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://localhost:5000/api";

const ROLE_MAP = {
  user:       { label: "User",       bg: "bg-sky-950/50",     text: "text-sky-400"     },
  admin:      { label: "Admin",      bg: "bg-amber-950/50",   text: "text-amber-400"   },
  superadmin: { label: "Superadmin", bg: "bg-red-950/50",     text: "text-red-400"     },
};

const ROLE_OPTIONS = ["user", "admin", "superadmin"];

const NAV_SUPERADMIN = [
  { label: "Kelola Users",  icon: UsersIcon, href: "/superadmin"     },
];

const EMPTY_FORM = { username: "", email: "", password: "", role: "user" };

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [superadmin, setSuperadmin]       = useState(null);
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [deletingId, setDeletingId]       = useState(null);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");
  const [activeNav, setActiveNav]         = useState("Kelola Users");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // userId
  const [createForm, setCreateForm]               = useState(EMPTY_FORM);
  const [editForm, setEditForm]                   = useState({ id: null, username: "", email: "", role: "user" });
  const [formError, setFormError]                 = useState("");

  // Search & filter
  const [search, setSearch]           = useState("");
  const [filterRole, setFilterRole]   = useState("semua");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (!token || !user) { router.push("/login"); return; }

    try {
      const data = JSON.parse(user);
      if (data.role !== "superadmin") { router.push("/dashboard"); return; }
      setSuperadmin(data);
      fetchUsers(token);
    } catch {
      router.push("/login");
    }
  }, []);

  const fetchUsers = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (err) {
      setError("Gagal memuat data users.");
    } finally {
      setLoading(false);
    }
  };

  const token = () => localStorage.getItem("token");

  // ── CREATE ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError("");
    const { username, email, password, role } = createForm;
    if (!username || !email || !password) { setFormError("Semua field wajib diisi."); return; }
    if (password.length < 6) { setFormError("Password minimal 6 karakter."); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/users`, { username, email, password, role }, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setSuccess("User berhasil dibuat.");
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      fetchUsers(token());
    } catch (err) {
      setFormError(err.response?.data?.message || "Gagal membuat user.");
    } finally {
      setSaving(false);
    }
  };

  // ── UPDATE ────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    setFormError("");
    const { id, username, email, role } = editForm;
    if (!username || !email) { setFormError("Username dan email wajib diisi."); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/users/${id}`, { username, email, role }, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setSuccess("User berhasil diperbarui.");
      setShowEditModal(false);
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, username, email, role } : u)
      );
    } catch (err) {
      setFormError(err.response?.data?.message || "Gagal memperbarui user.");
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setSuccess("User berhasil dihapus.");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus user.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const countRole = (r) => users.filter((u) => u.role === r).length;

  // ── Filtered ─────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchRole = filterRole === "semua" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const clearMessages = () => { setError(""); setSuccess(""); };

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
            SUPERADMIN
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_SUPERADMIN.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeNav === label
                  ? "bg-red-950/30 text-red-400 font-medium"
                  : "text-[#6B6760] hover:text-cream hover:bg-[#1E1E1E]"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#222] p-4">
          {superadmin && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-xs font-bold">
                {superadmin.username?.[0]?.toUpperCase() ?? "S"}
              </div>
              <div className="min-w-0">
                <p className="text-cream text-xs font-medium truncate">{superadmin.username}</p>
                <p className="text-red-400/60 text-[10px] capitalize">{superadmin.role}</p>
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
              <p className="text-cream text-sm font-medium">Panel Superadmin</p>
              <p className="text-[#5C5850] text-xs">Kelola semua pengguna sistem</p>
            </div>
          </div>
          {!loading && (
            <span className="text-[10px] px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-900/30 rounded-full">
              {users.length} total user
            </span>
          )}
        </header>

        <main className="flex-1 p-6 space-y-6">

          {/* Alerts */}
          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <span>{error}</span>
              <button onClick={clearMessages} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-emerald-400 text-sm flex items-center gap-2">
              <span>{success}</span>
              <button onClick={clearMessages} className="ml-auto text-emerald-400/60 hover:text-emerald-400">✕</button>
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Users",  value: users.length,         color: "text-cream"       },
              { label: "Superadmin",   value: countRole("superadmin"), color: "text-red-400"   },
              { label: "Admin",        value: countRole("admin"),    color: "text-amber-400"   },
              { label: "User Biasa",   value: countRole("user"),     color: "text-sky-400"     },
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

          {/* ── User table ── */}
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] flex-wrap gap-3">
              <p className="text-cream text-sm font-medium">
                Manajemen User
                {!loading && <span className="text-[#5C5850] font-normal ml-2">({filtered.length})</span>}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5C5850]" />
                  <input
                    type="text"
                    placeholder="Cari user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-[10px] pl-7 pr-3 py-1.5 bg-[#222] border border-[#2A2A2A] text-cream rounded-full focus:outline-none focus:border-red-800/60 w-36 placeholder:text-[#5C5850]"
                  />
                </div>

                {/* Role filter */}
                {["semua", ...ROLE_OPTIONS].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`text-[10px] px-3 py-1.5 rounded-full capitalize transition-colors ${
                      filterRole === r
                        ? "bg-red-500 text-white font-medium"
                        : "text-[#5C5850] hover:text-cream border border-[#2A2A2A]"
                    }`}
                  >
                    {r}
                  </button>
                ))}

                {/* Add button */}
                <button
                  onClick={() => { setFormError(""); setCreateForm(EMPTY_FORM); setShowCreateModal(true); }}
                  className="text-[10px] px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors flex items-center gap-1.5"
                >
                  <PlusIcon size={11} /> Tambah Users
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="divide-y divide-[#1E1E1E]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4">
                      {[40, 30, 15, 10].map((w, j) => (
                        <div key={j} className="h-3 bg-[#2A2A2A] rounded animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1E1E1E]">
                      {["#", "Username", "Email", "Role", "Bergabung", "Aksi"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-medium text-[#5C5850] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {filtered.map((u, idx) => {
                      const rm = ROLE_MAP[u.role] ?? ROLE_MAP.user;
                      const isSelf = superadmin?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#1E1E1E] transition-colors">
                          <td className="px-5 py-3.5 text-[#3A3A3A] text-[10px] font-mono">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-red-900/20 flex items-center justify-center text-red-400 text-[10px] font-bold shrink-0">
                                {u.username?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <p className="text-cream text-xs">{u.username}</p>
                                {isSelf && <p className="text-[9px] text-red-400/60">Akun kamu</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[#7A756D] text-xs truncate max-w-[180px]">{u.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${rm.bg} ${rm.text}`}>
                              {rm.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[#5C5850] text-xs whitespace-nowrap">
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })
                                : "—"
                              }
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setFormError("");
                                  setEditForm({ id: u.id, username: u.username, email: u.email, role: u.role });
                                  setShowEditModal(true);
                                }}
                                className="text-[10px] text-[#5C5850] hover:text-amber-400 transition-colors flex items-center gap-1"
                              >
                                <EditIcon size={11} /> Edit
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setShowDeleteConfirm(u.id)}
                                  className="text-[10px] text-[#5C5850] hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                  <TrashIcon size={11} /> Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-14">
                  <p className="text-[#5C5850] text-sm">Tidak ada user ditemukan.</p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* ── Modal: Create User ─────────────────────────────────────────── */}
      {showCreateModal && (
        <Modal title="Tambah User Baru" onClose={() => setShowCreateModal(false)}>
          {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
          <div className="space-y-3">
            <Field label="Username">
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="johndoe"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="john@example.com"
                className={inputCls}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min. 6 karakter"
                className={inputCls}
              />
            </Field>
            <Field label="Role">
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className={inputCls}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
              {saving ? "Menyimpan..." : "Buat Users"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Edit User ──────────────────────────────────────────── */}
      {showEditModal && (
        <Modal title="Edit Users" onClose={() => setShowEditModal(false)}>
          {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
          <div className="space-y-3">
            <Field label="Username">
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Role">
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className={inputCls}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
            <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Delete Confirm ────────────────────────────────────── */}
      {showDeleteConfirm && (
        <Modal title="Hapus Users" onClose={() => setShowDeleteConfirm(null)}>
          <p className="text-[#5C5850] text-xs mb-5">
            Apakah kamu yakin ingin menghapus user ini? Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              disabled={!!deletingId}
              className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {deletingId ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Logout Confirm ─────────────────────────────────────── */}
      {showLogoutConfirm && (
        <Modal title="Konfirmasi Logout" onClose={() => setShowLogoutConfirm(false)}>
          <p className="text-[#5C5850] text-xs mb-5">
            Apakah kamu yakin ingin keluar dari akun ini?
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
              }}
              className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

// ── Reusable components ────────────────────────────────────────────────────
const inputCls = "w-full text-xs bg-[#222] border border-[#2A2A2A] text-cream rounded-lg px-3 py-2 focus:outline-none focus:border-red-800/60 placeholder:text-[#4A4A4A]";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-cream text-sm font-medium">{title}</h2>
          <button onClick={onClose} className="text-[#5C5850] hover:text-cream text-xs">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] text-[#5C5850] mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
}
function UsersIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
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
function TrashIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function PlusIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function MenuIcon({ size = 20 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function SearchIcon({ size = 14, className = "" }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LogoutIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}