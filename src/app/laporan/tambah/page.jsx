"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Road, Trash2, Shield, Trees } from "lucide-react";


const CATEGORIES = [
  { id: 1, name: "Jalan Rusak", icon: Road },
  { id: 2, name: "Sampah", icon: Trash2 },
  { id: 3, name: "Keamanan", icon: Shield },
  { id: 4, name: "Fasilitas Umum", icon: Trees },
];

export default function TambahLaporan() {
  const router = useRouter();
  const fileRef = useRef(null);

  // ✅ FIX: user state harus ada
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
  });

  const [images, setImages] = useState([]);
const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ambil user dari localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/login");
      return;
    }

    setUser(storedUser);
  }, [router]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const removeAll = () => {
  setImages([]);
  setPreviews([]);
  fileRef.current.value = "";
};

  const handleImage = (e) => {
  const files = Array.from(e.target.files);

  setImages(files);
  setPreviews(files.map(file => URL.createObjectURL(file)));
};

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return setError("Judul wajib diisi");
    if (!form.description.trim()) return setError("Deskripsi wajib diisi");
    if (!form.category_id) return setError("Pilih kategori");

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("category_id", Number(form.category_id));

      images.forEach((file) => {
  data.append("images", file);
});

      // ❌ HAPUS user_id (backend sudah pakai req.user.id)
      const res = await axios.post(
        "http://localhost:5000/api/laporan",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(res.data.tracking_code || "SUCCESS");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal kirim laporan");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-900/40 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-xs font-medium tracking-[2px] uppercase text-[#5C5850] mb-2">Laporan terkirim</p>
          <h2 className="font-display text-3xl text-cream tracking-tight mb-3">
            Terima kasih!
          </h2>
          <p className="text-[#6B6760] text-sm leading-relaxed mb-6">
            Laporan Anda telah berhasil dikirim dan sedang menunggu verifikasi admin.
          </p>

          {/* Tracking code */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-6">
            <p className="text-[#5C5850] text-xs mb-2">Kode pelacakan laporan Anda</p>
            <p className="font-display text-2xl text-gold tracking-widest">{success}</p>
            <p className="text-[#3A3A3A] text-xs mt-2">Simpan kode ini untuk memantau status laporan</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 bg-gold text-dark text-sm font-medium py-3 rounded-xl hover:opacity-90 transition-opacity text-center"
            >
              Ke Dashboard
            </Link>
            <button
              onClick={() => { setSuccess(""); setForm({ title: "", description: "", category_id: "" }); setImage(null); setPreview(null); }}
              className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-cream text-sm py-3 rounded-xl hover:border-[#333] transition-colors"
            >
              Buat Laporan Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111111] font-sans">

      {/* Topbar */}
      <header className="h-14 border-b border-[#222] bg-[#141414] flex items-center px-6 gap-4 sticky top-0 z-20">
        <Link href="/dashboard" className="text-[#5C5850] hover:text-cream transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="h-4 w-px bg-[#2A2A2A]" />
        <Link href="/" className="font-display text-cream text-[15px] tracking-tight">
          Aspir<span className="text-gold">an</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-medium tracking-[2px] uppercase text-[#5C5850] mb-2">Form pengaduan</p>
          <h1 className="font-display text-3xl text-cream tracking-tight leading-tight">
            Buat laporan <em className="text-gold not-italic">baru</em>
          </h1>
          <p className="text-[#5C5850] text-sm mt-2">
            Isi detail laporan dengan lengkap agar dapat diproses lebih cepat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Judul */}
          <div>
            <label className="block text-xs text-[#5C5850] mb-1.5 ml-1">
              Judul Laporan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Contoh: Jalan berlubang di depan sekolah"
              maxLength={255}
              className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] text-cream text-sm border border-[#2A2A2A] placeholder-[#3A3A3A] focus:outline-none focus:border-gold transition-colors"
            />
            <p className="text-[#3A3A3A] text-[10px] mt-1 ml-1 text-right">{form.title.length}/255</p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs text-[#5C5850] mb-2 ml-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
  const Icon = cat.icon;

  return (
    <button
      key={cat.id}
      type="button"
      onClick={() => setForm({ ...form, category_id: cat.id })}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
        form.category_id === cat.id
          ? "bg-gold/10 border-gold text-gold"
          : "bg-[#1A1A1A] border-[#2A2A2A] text-[#6B6760] hover:border-[#333] hover:text-cream"
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-xs">{cat.name}</span>
    </button>
  );
})}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs text-[#5C5850] mb-1.5 ml-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Jelaskan masalah secara detail — lokasi, waktu kejadian, dan dampaknya..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[#1A1A1A] text-cream text-sm border border-[#2A2A2A] placeholder-[#3A3A3A] focus:outline-none focus:border-gold transition-colors resize-none"
            />
          </div>

          {/* Upload foto */}
          <div>
            <label className="block text-xs text-[#5C5850] mb-1.5 ml-1">
              Foto Bukti <span className="text-[#3A3A3A]">(opsional)</span>
            </label>

            {previews.length > 0 ? (
  <div className="grid grid-cols-2 gap-2">
    {previews.map((src, index) => (
      <div key={index} className="relative rounded-xl overflow-hidden border border-[#2A2A2A]">
        <img src={src} className="w-full h-40 object-cover" />

        <button
          type="button"
          onClick={() => {
            const newImages = [...images];
            const newPreviews = [...previews];

            newImages.splice(index, 1);
            newPreviews.splice(index, 1);

            setImages(newImages);
            setPreviews(newPreviews);
          }}
          className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full text-white"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
) : (
  <div
    onDrop={handleDrop}
    onDragOver={(e) => e.preventDefault()}
    onClick={() => fileRef.current?.click()}
    className="border-2 border-dashed border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl p-8 text-center cursor-pointer"
  >
                <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#252525] transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#5C5850" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[#5C5850] text-sm mb-1">Klik atau seret foto ke sini</p>
                <p className="text-[#3A3A3A] text-xs">PNG, JPG, JPEG — maks. 5 MB</p>
              </div>
            )}

            <input
  ref={fileRef}
  type="file"
  accept="image/png,image/jpg,image/jpeg"
  multiple
  onChange={handleImage}
  className="hidden"
/>
          </div>

          {/* Info box */}
          <div className="flex gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#5C5850] mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[#5C5850] text-xs leading-relaxed">
              Setelah dikirim, laporan akan diverifikasi admin dan Anda mendapat <strong className="text-[#7A756D]">kode pelacakan</strong> untuk memantau statusnya.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-red-400 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 text-center bg-[#1A1A1A] border border-[#2A2A2A] text-[#6B6760] text-sm py-3 rounded-xl hover:border-[#333] hover:text-cream transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gold text-dark text-sm font-medium py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Mengirim...
                </>
              ) : "Kirim Laporan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}