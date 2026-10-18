import React, { useState } from 'react';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Recycle, 
  Wallet, 
  KeyRound,
  User,
  ArrowRight
} from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (id.trim().toLowerCase() === 'admin' && password === '1234') {
        onLogin();
      } else {
        setError('ID Pengguna atau Password salah! Periksa kembali kredensial Anda.');
        setIsLoading(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] font-sans relative overflow-hidden select-none">
      {/* Decorative Background Mesh / Circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#172D51]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#F6B23D]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen z-10">
        
        {/* LEFT COLUMN: School Branding & Feature Showcase (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#172D51] via-[#1E3A68] to-[#122340] text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Subtle Graphic Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center gap-4 z-10">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <img 
                src="https://i.imgur.com/2XP7suZ.png" 
                alt="Logo SMPN 257 Jakarta" 
                className="h-16 w-auto object-contain drop-shadow-md" 
              />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-[#F6B23D] uppercase">
                Portal Resmi Terpadu
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
                SMP NEGERI 257 JAKARTA
              </h1>
            </div>
          </div>

          {/* Center Showcase Hero */}
          <div className="space-y-6 my-auto max-w-lg z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-300">
              <Sparkles size={14} className="text-[#F6B23D]" />
              Sistem Digitalisasi Sekolah Hijau & Komite
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Kelola Bank Sampah, Mijel & Kas Komite dalam Satu Pintu.
            </h2>

            <p className="text-sm text-blue-100/80 leading-relaxed">
              Mempermudah pencatatan penyetoran minyak jelantah, bank sampah siswa, 
              serta administrasi uang kas komite kelas secara terstruktur, rapi, dan transparan.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-lg bg-[#F6B23D]/20 text-[#F6B23D]">
                  <Recycle size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Bank Sampah & Mijel</div>
                  <div className="text-[11px] text-blue-200/70">Monitoring bulanan siswa</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="p-2 rounded-lg bg-emerald-400/20 text-emerald-300">
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Uang Kas Komite</div>
                  <div className="text-[11px] text-blue-200/70">Matriks setoran & Ekspor PDF</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="flex items-center justify-between text-xs text-blue-200/60 pt-6 border-t border-white/10 z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Sistem Aman & Terverifikasi Sekolah</span>
            </div>
            <span>v2.5.0 Stable</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Consolidated All-In-One Unified Login Card */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative">
          
          <div className="w-full max-w-[420px] animate-fade-in">
            
            {/* Unified Card: Logo, Greeting, and Form in One Clean Seamless Layout */}
            <div className="bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 relative overflow-hidden">
              
              {/* Subtle Card Accent Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#172D51] via-[#F6B23D] to-emerald-500" />

              {/* Card Header (Logo + Welcome + Badge) */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 mb-3 transition-transform hover:scale-105 duration-300">
                  <img 
                    src="https://i.imgur.com/2XP7suZ.png" 
                    alt="Logo SMPN 257 Jakarta" 
                    className="h-16 sm:h-20 w-auto object-contain" 
                  />
                </div>
                
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#172D51] bg-[#172D51]/5 px-2.5 py-0.5 rounded-full border border-[#172D51]/10 mb-1.5">
                  SMP NEGERI 257 JAKARTA
                </span>

                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Selamat Datang
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Masuk ke Portal Pengelolaan Bank Sampah & Uang Kas Komite
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-shake">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* ID Pengguna Field */}
                <div>
                  <label htmlFor="id" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    ID PENGGUNA
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User size={17} />
                    </div>
                    <input
                      id="id"
                      type="text"
                      required
                      autoFocus
                      autoComplete="username"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="Masukkan ID Pengguna"
                      className="block w-full pl-10 pr-3 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#172D51] focus:border-transparent transition-all placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <KeyRound size={17} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan Password"
                      className="block w-full pl-10 pr-11 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#172D51] focus:border-transparent transition-all placeholder:text-gray-400 placeholder:font-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full !mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#172D51] hover:bg-[#1E3A68] active:scale-[0.99] shadow-md shadow-[#172D51]/20 hover:shadow-lg hover:shadow-[#172D51]/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </div>
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
                      <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Secure Footer Info inside card */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Koneksi Terenkripsi & Terlindungi</span>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="text-center text-[11px] text-gray-400 space-y-0.5 mt-6">
              <p>© {new Date().getFullYear()} SMPN 257 Jakarta</p>
              <p className="text-[10px] text-gray-400/70">Portal Administrasi Bank Sampah & Uang Kas Komite</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
