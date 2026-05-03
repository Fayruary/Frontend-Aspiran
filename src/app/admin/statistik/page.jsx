"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://localhost:5000/api";

const STATUS_MAP = {
  pending:  { label: "Pending",  color: "#38bdf8", bg: "bg-sky-950/50",     text: "text-sky-400"     },
  verified: { label: "Verified", color: "#60a5fa", bg: "bg-blue-950/50",    text: "text-blue-400"    },
  process:  { label: "Diproses", color: "#fbbf24", bg: "bg-amber-950/50",   text: "text-amber-400"   },
  done:     { label: "Selesai",  color: "#34d399", bg: "bg-emerald-950/50", text: "text-emerald-400" },
  rejected: { label: "Ditolak",  color: "#f87171", bg: "bg-red-950/50",     text: "text-red-400"     },
};

const NAV_ADMIN = [
  { label: "Dashboard",     icon: GridIcon,  href: "/admin"           },
  { label: "Semua Laporan", icon: FileIcon,  href: "/admin/laporan"   },
  { label: "Statistik",     icon: ChartIcon, href: "/admin/statistik" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function AdminStatistik() {
  const router = useRouter();
  const [admin, setAdmin]           = useState(null);
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (!token || !user) { router.push("/login"); return; }
    try {
      const adminData = JSON.parse(user);
      if (!["admin", "superadmin"].includes(adminData.role)) { router.push("/dashboard"); return; }
      setAdmin(adminData);
      fetchReports(token);
    } catch { router.push("/login"); }
  }, []);

  // Animate counters on load
  useEffect(() => {
    if (!loading && reports.length > 0) {
      const targets = {
        total: reports.length,
        done: reports.filter(r => r.status === "done").length,
        process: reports.filter(r => r.status === "process" || r.status === "verified").length,
        pending: reports.filter(r => r.status === "pending").length,
        rejected: reports.filter(r => r.status === "rejected").length,
      };
      const duration = 1200;
      const steps = 40;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedValues({
          total:    Math.round(targets.total    * eased),
          done:     Math.round(targets.done     * eased),
          process:  Math.round(targets.process  * eased),
          pending:  Math.round(targets.pending  * eased),
          rejected: Math.round(targets.rejected * eased),
        });
        if (step >= steps) clearInterval(interval);
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [loading, reports]);

  const fetchReports = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/laporan`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data || []);
    } catch { setError("Gagal memuat data."); }
    finally { setLoading(false); }
  };

  // ── Computed stats ────────────────────────────────────────────────────
  const total    = reports.length;
  const done     = reports.filter(r => r.status === "done").length;
  const process  = reports.filter(r => r.status === "process" || r.status === "verified").length;
  const pending  = reports.filter(r => r.status === "pending").length;
  const rejected = reports.filter(r => r.status === "rejected").length;
  const rate     = total ? Math.round((done / total) * 100) : 0;

  // ── Monthly data ──────────────────────────────────────────────────────
  const monthlyData = MONTHS.map((month, i) => {
    const inMonth = reports.filter(r => {
      const d = new Date(r.created_at);
      return d.getFullYear() === selectedYear && d.getMonth() === i;
    });
    return {
      month,
      total:    inMonth.length,
      done:     inMonth.filter(r => r.status === "done").length,
      process:  inMonth.filter(r => r.status === "process" || r.status === "verified").length,
      pending:  inMonth.filter(r => r.status === "pending").length,
      rejected: inMonth.filter(r => r.status === "rejected").length,
    };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.total), 1);

  // ── Category breakdown ────────────────────────────────────────────────
  const categoryMap = {};
  reports.forEach(r => {
    const cat = r.category || "Lainnya";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = categories[0]?.[1] || 1;

  // ── Weekly trend (last 8 weeks) ───────────────────────────────────────
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const now  = new Date();
    const end  = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    const count = reports.filter(r => {
      const d = new Date(r.created_at);
      return d >= start && d <= end;
    }).length;
    return { label: `W${8 - i}`, count };
  }).reverse();
  const maxWeekly = Math.max(...weeklyData.map(d => d.count), 1);

  // ── Top reporters ─────────────────────────────────────────────────────
  const userMap = {};
  reports.forEach(r => {
    const name = r.username || "Unknown";
    userMap[name] = (userMap[name] || 0) + 1;
  });
  const topUsers = Object.entries(userMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // ── Available years ───────────────────────────────────────────────────
  const years = [...new Set(reports.map(r => new Date(r.created_at).getFullYear()))].sort((a,b) => b - a);
  if (!years.includes(selectedYear)) years.unshift(selectedYear);

  // ── Donut chart SVG ───────────────────────────────────────────────────
  const donutData = [
    { key: "done",     value: done,     color: "#34d399" },
    { key: "process",  value: process,  color: "#fbbf24" },
    { key: "pending",  value: pending,  color: "#38bdf8" },
    { key: "rejected", value: rejected, color: "#f87171" },
  ].filter(d => d.value > 0);

  const DonutChart = () => {
    const size = 160, cx = 80, cy = 80, r = 58, stroke = 22;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const segments = donutData.map(d => {
      const pct = total > 0 ? d.value / total : 0;
      const dash = pct * circumference;
      const gap  = circumference - dash;
      const seg  = { ...d, dash, gap, offset };
      offset += dash;
      return seg;
    });

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
        {/* Segments */}
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circumference * 0.25}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.8s ease", opacity: 0.85 }}
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#F5F0E8" fontSize="22" fontWeight="600">{rate}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#5C5850" fontSize="9">selesai</text>
      </svg>
    );
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
          <span className="text-[9px] px-1.5 py-0.5 bg-red-950/60 text-red-400 border border-red-900/40 rounded-full font-medium">ADMIN</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ADMIN.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                label === "Statistik"
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

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#6B6760] hover:text-cream" onClick={() => setSidebarOpen(true)}>
              <MenuIcon size={20} />
            </button>
            <div>
              <p className="text-cream text-sm font-medium">Statistik</p>
              <p className="text-[#5C5850] text-xs">Analisis mendalam seluruh data laporan</p>
            </div>
          </div>

          {/* Year picker */}
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-cream rounded-xl px-3 py-2 focus:outline-none focus:border-gold/40"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5">

          {error && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Row 1: KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Total Laporan",  value: animatedValues.total    ?? 0, real: total,    color: "text-cream",        accent: "#D4A843", icon: TotalIcon   },
              { label: "Selesai",        value: animatedValues.done     ?? 0, real: done,     color: "text-emerald-400",  accent: "#34d399", icon: DoneIcon    },
              { label: "Diproses",       value: animatedValues.process  ?? 0, real: process,  color: "text-amber-400",    accent: "#fbbf24", icon: ProcessIcon },
              { label: "Pending",        value: animatedValues.pending  ?? 0, real: pending,  color: "text-sky-400",      accent: "#38bdf8", icon: PendingIcon },
              { label: "Ditolak",        value: animatedValues.rejected ?? 0, real: rejected, color: "text-red-400",      accent: "#f87171", icon: RejectIcon  },
            ].map((s, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-4 relative overflow-hidden group hover:border-[#2A2A2A] transition-colors">
                {/* Accent glow */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-xl"
                  style={{ background: s.accent }} />
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[#5C5850] text-[10px] leading-tight">{s.label}</p>
                  <div className="w-6 h-6 flex items-center justify-center opacity-30" style={{ color: s.accent }}>
                    <s.icon size={14} />
                  </div>
                </div>
                {loading
                  ? <div className="h-9 w-12 bg-[#2A2A2A] rounded-lg animate-pulse" />
                  : <p className={`font-display text-4xl tracking-tight leading-none ${s.color}`}>{s.value}</p>
                }
                {!loading && total > 0 && s.real > 0 && (
                  <p className="text-[#3A3A3A] text-[9px] mt-1.5">
                    {Math.round((s.real / total) * 100)}% dari total
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Row 2: Donut + Monthly bar chart ── */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Donut */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <p className="text-[#5C5850] text-xs mb-0.5">Distribusi status</p>
              <p className="text-cream text-sm font-medium mb-5">Komposisi Laporan</p>

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-32 h-32 rounded-full border-8 border-[#2A2A2A] animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <DonutChart />
                  <div className="w-full space-y-2">
                    {[
                      { label: "Selesai",  value: done,     color: "bg-emerald-400" },
                      { label: "Diproses", value: process,  color: "bg-amber-400"   },
                      { label: "Pending",  value: pending,  color: "bg-sky-400"     },
                      { label: "Ditolak",  value: rejected, color: "bg-red-400"     },
                    ].map((l, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${l.color}`} />
                          <span className="text-[#6B6760] text-xs">{l.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${l.color}`}
                              style={{ width: `${total ? (l.value / total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-cream text-xs w-4 text-right">{l.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly bar chart */}
            <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[#5C5850] text-xs mb-0.5">Per bulan</p>
                  <p className="text-cream text-sm font-medium">Tren Laporan {selectedYear}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {[
                    { color: "bg-emerald-400", label: "Selesai"  },
                    { color: "bg-amber-400",   label: "Proses"   },
                    { color: "bg-sky-400",     label: "Pending"  },
                    { color: "bg-red-400",     label: "Ditolak"  },
                  ].map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[#5C5850] text-[9px]">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="h-44 bg-[#222] rounded-xl animate-pulse" />
              ) : (
                <div className="flex items-end gap-1.5 h-44 px-1">
                  {monthlyData.map((d, i) => {
                    const heightPct = (d.total / maxMonthly) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-300 group-hover:opacity-90"
                          style={{ height: `${heightPct}%`, minHeight: d.total ? "6px" : "2px" }}
                        >
                          {d.total === 0 && <div className="bg-[#222] h-0.5 w-full" />}
                          {d.done     > 0 && <div className="bg-emerald-400/75" style={{ flex: d.done     }} />}
                          {d.process  > 0 && <div className="bg-amber-400/75"   style={{ flex: d.process  }} />}
                          {d.pending  > 0 && <div className="bg-sky-400/75"     style={{ flex: d.pending  }} />}
                          {d.rejected > 0 && <div className="bg-red-400/75"     style={{ flex: d.rejected }} />}
                        </div>
                        <p className="text-[#5C5850] text-[8px]">{d.month}</p>
                        {/* Tooltip on hover */}
                        {d.total > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2A2A2A] text-cream text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {d.total} laporan
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 3: Category bar + Weekly trend + Top users ── */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Category horizontal bar */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <p className="text-[#5C5850] text-xs mb-0.5">Berdasarkan kategori</p>
              <p className="text-cream text-sm font-medium mb-5">Top Kategori</p>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-2.5 bg-[#2A2A2A] rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
                      <div className="h-2 bg-[#222] rounded animate-pulse w-full" />
                    </div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-[#5C5850] text-xs">Tidak ada data kategori.</p>
              ) : (
                <div className="space-y-3.5">
                  {categories.map(([cat, count], i) => {
                    const pct = (count / maxCat) * 100;
                    const colors = ["#D4A843","#34d399","#38bdf8","#fbbf24","#f87171","#a78bfa"];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#8A8680] text-[11px] truncate max-w-[120px]">{cat}</span>
                          <span className="text-cream text-xs font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly trend line-ish chart */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <p className="text-[#5C5850] text-xs mb-0.5">8 minggu terakhir</p>
              <p className="text-cream text-sm font-medium mb-5">Tren Mingguan</p>

              {loading ? (
                <div className="h-36 bg-[#222] rounded-xl animate-pulse" />
              ) : (
                <div className="relative h-36">
                  {/* Y-axis guides */}
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div key={pct} className="absolute w-full border-t border-[#1E1E1E]"
                      style={{ bottom: `${pct}%` }} />
                  ))}
                  {/* SVG line chart */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {weeklyData.length > 1 && (() => {
                      const pts = weeklyData.map((d, i) => ({
                        x: (i / (weeklyData.length - 1)) * 100,
                        y: 100 - (d.count / maxWeekly) * 90,
                      }));
                      const area = `M ${pts[0].x} 100 ` +
                        pts.map(p => `L ${p.x} ${p.y}`).join(" ") +
                        ` L ${pts[pts.length-1].x} 100 Z`;
                      const line = `M ` + pts.map(p => `${p.x} ${p.y}`).join(" L ");
                      return (
                        <>
                          <path d={area} fill="url(#lineGrad)" />
                          <path d={line} fill="none" stroke="#D4A843" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                          {pts.map((p, i) => (
                            <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="3"
                              fill="#D4A843" stroke="#141414" strokeWidth="1.5"
                              vectorEffect="non-scaling-stroke" />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
              {!loading && (
                <div className="flex justify-between mt-2">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[#3A3A3A] text-[8px]">{d.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top reporters */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-5">
              <p className="text-[#5C5850] text-xs mb-0.5">Paling aktif</p>
              <p className="text-cream text-sm font-medium mb-5">Top Pelapor</p>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#2A2A2A] animate-pulse shrink-0" />
                      <div className="flex-1 h-3 bg-[#2A2A2A] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : topUsers.length === 0 ? (
                <p className="text-[#5C5850] text-xs">Tidak ada data pelapor.</p>
              ) : (
                <div className="space-y-3">
                  {topUsers.map(([name, count], i) => {
                    const medals = ["🥇","🥈","🥉"];
                    const pct = (count / (topUsers[0][1] || 1)) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xs font-bold shrink-0">
                          {i < 3 ? medals[i] : name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-cream text-xs truncate">{name}</p>
                            <p className="text-[#5C5850] text-[10px] ml-2 shrink-0">{count} laporan</p>
                          </div>
                          <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-gold/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 4: Summary insight cards ── */}
          {!loading && total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Tingkat Penyelesaian",
                  value: `${rate}%`,
                  sub: done > 0 ? `${done} laporan selesai dari ${total}` : "Belum ada laporan selesai",
                  color: "text-emerald-400",
                  border: "border-emerald-900/30",
                  bg: "bg-emerald-950/20",
                  icon: RateIcon,
                  accent: "#34d399",
                },
                {
                  label: "Laporan Bulan Ini",
                  value: monthlyData[new Date().getMonth()].total,
                  sub: (() => {
                    const prev = monthlyData[Math.max(0, new Date().getMonth() - 1)].total;
                    const curr = monthlyData[new Date().getMonth()].total;
                    if (prev === 0) return "Tidak ada data bulan lalu";
                    const diff = curr - prev;
                    return diff >= 0 ? `+${diff} dari bulan lalu` : `${diff} dari bulan lalu`;
                  })(),
                  color: "text-gold",
                  border: "border-yellow-900/30",
                  bg: "bg-yellow-950/20",
                  icon: CalIcon,
                  accent: "#D4A843",
                },
                {
                  label: "Perlu Perhatian",
                  value: pending + process,
                  sub: `${pending} pending · ${process} sedang diproses`,
                  color: "text-amber-400",
                  border: "border-amber-900/30",
                  bg: "bg-amber-950/20",
                  icon: AlertIcon,
                  accent: "#fbbf24",
                },
              ].map((card, i) => (
                <div key={i} className={`rounded-2xl border p-5 ${card.bg} ${card.border} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: card.accent }} />
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[#6B6760] text-xs">{card.label}</p>
                    <div style={{ color: card.accent }} className="opacity-50"><card.icon size={16} /></div>
                  </div>
                  <p className={`font-display text-5xl tracking-tight leading-none mb-2 ${card.color}`}>{card.value}</p>
                  <p className="text-[#5C5850] text-[11px]">{card.sub}</p>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* ── Logout Confirm ───────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-[90%] max-w-sm">
            <h2 className="text-cream text-sm font-medium mb-2">Konfirmasi Logout</h2>
            <p className="text-[#5C5850] text-xs mb-5">Apakah kamu yakin ingin keluar dari akun ini?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-xs text-[#5C5850] hover:text-cream">Batal</button>
              <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.replace("/login"); }}
                className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Logout</button>
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
function MenuIcon({ size = 20 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LogoutIcon({ size = 14 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TotalIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function DoneIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ProcessIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function PendingIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function RejectIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function RateIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CalIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function AlertIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}