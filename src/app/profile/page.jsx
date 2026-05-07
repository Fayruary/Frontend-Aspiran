"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://localhost:5000/api";

const NAV = [
  { label: "Dashboard",    icon: GridIcon, href: "/dashboard"      },
  { label: "Laporan Saya", icon: FileIcon, href: "/laporan"        },
  { label: "Buat Laporan", icon: PlusIcon, href: "/laporan/tambah" },
];

const STATUS_MAP = {
  pending:  { label: "Pending",  dot: "bg-sky-400",     text: "text-sky-400"     },
  verified: { label: "Verified", dot: "bg-blue-400",    text: "text-blue-400"    },
  process:  { label: "Diproses", dot: "bg-amber-400",   text: "text-amber-400"   },
  done:     { label: "Selesai",  dot: "bg-emerald-400", text: "text-emerald-400" },
  rejected: { label: "Ditolak",  dot: "bg-red-400",     text: "text-red-400"     },
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser]               = useState(null);
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout]   = useState(false);
  const [activeTab, setActiveTab]     = useState("profile"); // "profile" | "password"

  // Edit username
  const [username, setUsername]   = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg]     = useState({ text: "", ok: false });

  // Change password
  const [oldPw, setOldPw]         = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw]   = useState(false);
  const [pwMsg, setPwMsg]         = useState({ text: "", ok: false });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) { router.push("/login"); return; }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      setUsername(u.username || "");
      fetchReports(token, u.id);
    } catch { router.push("/login"); }
  }, []);

  const fetchReports = async (token, userId) => {
    try {
      const res = await axios.get(`${API}/laporan`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data.filter(r => r.user_id === userId));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  // ── Save username ─────────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    if (!username.trim()) { setNameMsg({ text: "Username tidak boleh kosong.", ok: false }); return; }
    if (username.trim() === user.username) { setNameMsg({ text: "Tidak ada perubahan.", ok: false }); return; }
    const token = localStorage.getItem("token");
    setSavingName(true); setNameMsg({ text: "", ok: false });
    try {
      const res = await axios.put(`${API}/users/me`, { username: username.trim() },
        { headers: { Authorization: `Bearer ${token}` } });
      const updated = { ...user, username: res.data.user?.username ?? username.trim() };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setNameMsg({ text: "Username berhasil diperbarui.", ok: true });
    } catch (err) {
      setNameMsg({ text: err.response?.data?.message || "Gagal memperbarui username.", ok: false });
    } finally { setSavingName(false); }
  };

  // ── Change password ───────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg({ text: "", ok: false });
    if (!oldPw || !newPw || !confirmPw) { setPwMsg({ text: "Semua field wajib diisi.", ok: false }); return; }
    if (newPw.length < 6) { setPwMsg({ text: "Password baru minimal 6 karakter.", ok: false }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: "Konfirmasi password tidak cocok.", ok: false }); return; }
    if (newPw === oldPw) { setPwMsg({ text: "Password baru tidak boleh sama dengan yang lama.", ok: false }); return; }
    const token = localStorage.getItem("token");
    setSavingPw(true);
    try {
      await axios.put(`${API}/users/me/password`, { oldPassword: oldPw, newPassword: newPw },
        { headers: { Authorization: `Bearer ${token}` } });
      setPwMsg({ text: "Password berhasil diubah.", ok: true });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg({ text: err.response?.data?.message || "Gagal mengubah password.", ok: false });
    } finally { setSavingPw(false); }
  };

  // ── Password strength ─────────────────────────────────────────────────
  const pwStrength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 6)  s++;
    if (newPw.length >= 10) s++;
    if (/[A-Z]/.test(newPw) && /[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();
  const pwStrengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][pwStrength] || "";
  const pwStrengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-400"][pwStrength] || "";

  // ── Stats ─────────────────────────────────────────────────────────────
  const total    = reports.length;
  const done     = reports.filter(r => r.status === "done").length;
  const process  = reports.filter(r => r.status === "process" || r.status === "verified").length;
  const pending  = reports.filter(r => r.status === "pending").length;
  const rate     = total ? Math.round((done / total) * 100) : 0;
  const recent   = [...reports].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,3);

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#141414] border-r border-[#222] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-6 h-16 flex items-center border-b border-[#222]">
          <Link href="/" className="font-display text-cream text-[16px] tracking-tight">Aspir<span className="text-gold">an</span></Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B6760] hover:text-cream hover:bg-[#1E1E1E] transition-colors">
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
                <p className="text-cream text-xs font-medium truncate">{user.username}</p>
                <p className="text-[#5C5850] text-[10px] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={() => setShowLogout(true)} className="w-full text-left text-xs text-[#5C5850] hover:text-red-400 transition-colors px-1 py-1 flex items-center gap-2">
            <LogoutIcon size={13} /> Keluar
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center px-6 sticky top-0 z-20 gap-3">
          <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}><MenuIcon size={20} /></button>
          <div>
            <p className="text-cream text-sm font-medium">Profil Saya</p>
            <p className="text-[#5C5850] text-xs">Kelola informasi akun Anda</p>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* ── Hero card ── */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-visible">
              {/* Gradient banner */}
              <div className="h-15 relative overflow-visible"
                style={{ background: "linear-gradient(135deg, #1E1800 0%, #2A1F00 40%, #141414 100%)" }}>
                {/* Completion badge */}
                {!loading && total > 0 && (
                  <div className="absolute top-4 right-5 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-[10px] font-medium">{rate}% selesai</span>
                  </div>
                )}
              </div>

              {/* Avatar overlap - di luar banner agar tidak terpotong overflow-hidden */}
              <div className="px-6 pb-6 mt-3">
                <div className="flex items-end gap-4 mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] border-4 border-[#1A1A1A] ring-2 ring-gold/30 flex items-center justify-center shrink-0 shadow-xl"
                    style={{ background: "linear-gradient(135deg, #2A1F00, #1A1400)" }}>
                    <span className="text-gold text-3xl font-bold font-display">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <p className="text-cream text-lg font-semibold truncate">{user?.username}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 capitalize">{user?.role || "user"}</span>
                      <span className="text-[#3A3A3A] text-[10px]">·</span>
                      <span className="text-[#4A4A4A] text-[10px]">{user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                {loading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_,i) => <div key={i} className="h-14 bg-[#222] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Total",    value: total,   color: "text-cream"       },
                      { label: "Selesai",  value: done,    color: "text-emerald-400" },
                      { label: "Diproses", value: process, color: "text-amber-400"   },
                      { label: "Pending",  value: pending, color: "text-sky-400"     },
                    ].map((s,i) => (
                      <div key={i} className="bg-[#222] rounded-xl p-3 text-center border border-[#2A2A2A]">
                        <p className={`font-display text-2xl tracking-tight leading-none ${s.color}`}>{s.value}</p>
                        <p className="text-[#5C5850] text-[9px] mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Tab switcher ── */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-1.5 flex gap-1">
              {[
                { id: "profile",  label: "Edit Username", icon: UserIcon  },
                { id: "password", label: "Ganti Password", icon: LockIcon },
              ].map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setNameMsg({ text:"", ok:false }); setPwMsg({ text:"", ok:false }); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeTab === t.id
                      ? "bg-gold/10 text-gold border border-gold/20"
                      : "text-[#5C5850] hover:text-cream hover:bg-[#222]"
                  }`}>
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Edit Username ── */}
            {activeTab === "profile" && (
              <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#222]">
                  <p className="text-cream text-sm font-medium">Informasi Akun</p>
                  <p className="text-[#5C5850] text-xs mt-0.5">NIK dan email tidak dapat diubah</p>
                </div>
                <div className="px-5 py-5 space-y-4">

                  {/* NIK — readonly */}
                  {user?.nik && (
                    <div>
                      <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                        NIK <LockSmallIcon size={10} />
                      </label>
                      <div className="relative">
                        <input readOnly value={user.nik}
                          className="w-full bg-[#161616] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-sm text-[#4A4A4A] cursor-not-allowed select-none" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 bg-[#2A2A2A] text-[#4A4A4A] rounded-md">Terkunci</span>
                      </div>
                    </div>
                  )}

                  {/* Email — readonly */}
                  <div>
                    <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                      Email <LockSmallIcon size={10} />
                    </label>
                    <div className="relative">
                      <input readOnly value={user?.email || ""}
                        className="w-full bg-[#161616] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-sm text-[#4A4A4A] cursor-not-allowed select-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 bg-[#2A2A2A] text-[#4A4A4A] rounded-md">Terkunci</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#222]" />
                    <span className="text-[#3A3A3A] text-[10px]">Dapat diubah</span>
                    <div className="flex-1 h-px bg-[#222]" />
                  </div>

                  {/* Username — editable */}
                  <div>
                    <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5">Username</label>
                    <input type="text" value={username} onChange={e => { setUsername(e.target.value); setNameMsg({ text:"", ok:false }); }}
                      placeholder="Masukkan username baru"
                      className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/50 transition-colors" />
                    <p className="text-[#3A3A3A] text-[10px] mt-1.5">Username akan ditampilkan di seluruh platform</p>
                  </div>

                  {nameMsg.text && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border ${
                      nameMsg.ok
                        ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-400"
                        : "bg-red-950/30 border-red-900/30 text-red-400"
                    }`}>
                      <span>{nameMsg.ok ? "✓" : "✕"}</span>
                      {nameMsg.text}
                    </div>
                  )}

                  <button onClick={handleSaveUsername} disabled={savingName || username.trim() === user?.username}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold text-dark text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                    {savingName ? <><SpinIcon size={13} /> Menyimpan...</> : <><SaveIcon size={13} /> Simpan Username</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: Ganti Password ── */}
            {activeTab === "password" && (
              <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#222]">
                  <p className="text-cream text-sm font-medium">Ganti Password</p>
                  <p className="text-[#5C5850] text-xs mt-0.5">Gunakan password yang kuat dan belum pernah dipakai</p>
                </div>
                <div className="px-5 py-5 space-y-4">

                  {/* Old password */}
                  <div>
                    <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5">Password Lama</label>
                    <div className="relative">
                      <input type={showOld ? "text" : "password"} value={oldPw} onChange={e => { setOldPw(e.target.value); setPwMsg({ text:"", ok:false }); }}
                        placeholder="Masukkan password saat ini"
                        className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-4 py-2.5 pr-10 text-sm text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/50 transition-colors" />
                      <button onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5850] hover:text-cream transition-colors">
                        {showOld ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#222]" />

                  {/* New password */}
                  <div>
                    <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5">Password Baru</label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPw} onChange={e => { setNewPw(e.target.value); setPwMsg({ text:"", ok:false }); }}
                        placeholder="Minimal 6 karakter"
                        className="w-full bg-[#222] border border-[#2A2A2A] rounded-xl px-4 py-2.5 pr-10 text-sm text-cream placeholder-[#4A4A4A] focus:outline-none focus:border-gold/50 transition-colors" />
                      <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5850] hover:text-cream transition-colors">
                        {showNew ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {newPw && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(n => (
                            <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${pwStrength >= n ? pwStrengthColor : "bg-[#2A2A2A]"}`} />
                          ))}
                        </div>
                        <p className={`text-[10px] ${pwStrengthColor.replace("bg-","text-")}`}>{pwStrengthLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-[#5C5850] text-[10px] uppercase tracking-widest block mb-1.5">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwMsg({ text:"", ok:false }); }}
                        placeholder="Ulangi password baru"
                        className={`w-full bg-[#222] border rounded-xl px-4 py-2.5 pr-10 text-sm text-cream placeholder-[#4A4A4A] focus:outline-none transition-colors ${
                          confirmPw && confirmPw !== newPw
                            ? "border-red-500/50 focus:border-red-500/60"
                            : confirmPw && confirmPw === newPw
                              ? "border-emerald-500/50 focus:border-emerald-500/60"
                              : "border-[#2A2A2A] focus:border-gold/50"
                        }`} />
                      <button onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5850] hover:text-cream transition-colors">
                        {showConfirm ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                      {confirmPw && confirmPw === newPw && (
                        <span className="absolute right-9 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>
                      )}
                    </div>
                  </div>

                  {pwMsg.text && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border ${
                      pwMsg.ok
                        ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-400"
                        : "bg-red-950/30 border-red-900/30 text-red-400"
                    }`}>
                      <span>{pwMsg.ok ? "✓" : "✕"}</span>
                      {pwMsg.text}
                    </div>
                  )}

                  <button onClick={handleChangePassword} disabled={savingPw || !oldPw || !newPw || !confirmPw}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold text-dark text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
                    {savingPw ? <><SpinIcon size={13} /> Menyimpan...</> : <><LockIcon size={13} /> Simpan Password</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Aktivitas terbaru ── */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon size={13} />
                  <p className="text-cream text-sm font-medium">Laporan Terbaru</p>
                </div>
                <Link href="/laporan" className="text-gold text-xs hover:underline">Lihat semua →</Link>
              </div>

              {loading ? (
                <div className="divide-y divide-[#1E1E1E]">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="px-5 py-3.5 flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-[#2A2A2A] rounded animate-pulse w-2/3" />
                        <div className="h-2.5 bg-[#222] rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[#5C5850] text-xs">Belum ada laporan.</p>
                  <Link href="/laporan/tambah" className="text-gold text-xs mt-1 block hover:underline">Buat laporan pertama →</Link>
                </div>
              ) : (
                <div className="divide-y divide-[#1E1E1E]">
                  {recent.map(r => {
                    const st = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#1E1E1E] transition-colors">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-cream text-xs truncate">{r.title}</p>
                          <p className="text-[#4A4A4A] text-[10px] mt-0.5">
                            {new Date(r.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}
                          </p>
                        </div>
                        <span className={`text-[10px] shrink-0 ${st.text}`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Keluar ── */}
            <button onClick={() => setShowLogout(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-900/30 bg-red-950/20 text-red-400 text-xs hover:bg-red-900/20 transition-colors">
              <LogoutIcon size={13} /> Keluar dari Akun
            </button>

          </div>
        </main>
      </div>

      {/* ── Logout Confirm ─────────────────────────────────────────────── */}
      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-cream text-sm font-medium mb-2">Konfirmasi Logout</h2>
            <p className="text-[#5C5850] text-xs mb-5">Apakah kamu yakin ingin keluar dari akun ini?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogout(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
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
function FileIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function PlusIcon({ size=16 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function MenuIcon({ size=20 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function LogoutIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function UserIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function LockIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function LockSmallIcon({ size=10 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function EyeIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>; }
function EyeOffIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function SaveIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function ClockIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function SpinIcon({ size=14 }) { return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/></svg>; }