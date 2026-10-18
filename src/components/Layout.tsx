import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Database,
  LogOut,
  Sparkles
} from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';

interface LayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  onNavigate: (menu: string) => void;
  onLogout: () => void;
}

export default function Layout({ children, activeMenu, onNavigate, onLogout }: LayoutProps) {
  const navigation = [
    { 
      name: 'Dashboard', 
      id: 'dashboard', 
      icon: LayoutDashboard,
      activeColor: 'from-[#172D51] to-[#1E3A68]',
      iconColor: 'text-[#F6B23D]',
      activeBadge: 'bg-[#F6B23D] text-[#172D51]'
    },
    { 
      name: 'Kegiatan', 
      id: 'kegiatan', 
      icon: CalendarCheck,
      activeColor: 'from-emerald-700 to-teal-800',
      iconColor: 'text-emerald-400',
      activeBadge: 'bg-emerald-400 text-emerald-950'
    },
    { 
      name: 'Rekap', 
      id: 'rekap', 
      icon: FileText,
      activeColor: 'from-amber-600 to-yellow-600',
      iconColor: 'text-amber-300',
      activeBadge: 'bg-amber-300 text-amber-950'
    },
    { 
      name: 'Data Base', 
      id: 'database', 
      icon: Database,
      activeColor: 'from-blue-700 to-indigo-800',
      iconColor: 'text-blue-300',
      activeBadge: 'bg-blue-300 text-blue-950'
    },
  ];

  return (
    <div className="h-[100dvh] lg:h-auto lg:min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden lg:overflow-visible">
      {/* Top Header for Mobile */}
      <div className="lg:hidden bg-gradient-to-r from-[#172D51] via-[#1E3A68] to-[#172D51] text-white p-3 flex items-center justify-between sticky top-0 z-30 shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white rounded-xl shadow-xs">
            <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wide text-white leading-none">SMPN 257</div>
            <div className="text-[10px] text-[#F6B23D] font-bold tracking-wider uppercase mt-0.5">Bank Sampah & Kas</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <PWAInstallButton />
          <button 
            onClick={onLogout}
            className="text-red-300 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
            title="Keluar"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden lg:overflow-visible">
        {/* Sidebar Desktop - Lebih Berwarna, Rapi, dan Berjiwa Identitas Sekolah */}
        <aside className="hidden lg:flex flex-col z-40 w-64 h-screen sticky top-0 bg-white border-r border-slate-200/80 shadow-xs">
          {/* Header Brand Sidebar */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-[#172D51]/5 via-white to-[#F6B23D]/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-100 shrink-0">
                <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo SMPN 257" className="h-11 w-auto object-contain" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F6B23D] bg-[#172D51] px-1.5 py-0.5 rounded-sm">
                  JAKARTA
                </span>
                <div className="text-base font-black text-gray-900 tracking-tight mt-0.5">SMPN 257</div>
                <div className="text-[11px] text-gray-500 font-medium">Bank Sampah & Komite</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Links - Berwarna & Hidup */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Menu Utama
            </div>
            {navigation.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 group cursor-pointer ${
                    isActive 
                      ? `bg-gradient-to-r ${item.activeColor} text-white shadow-md shadow-[#172D51]/15 scale-[1.01]` 
                      : 'text-gray-600 hover:bg-slate-100/80 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white/15 text-white' 
                        : 'bg-slate-100 text-gray-500 group-hover:text-[#172D51] group-hover:bg-[#172D51]/10'
                    }`}>
                      <item.icon size={17} className={isActive ? item.iconColor : ''} />
                    </div>
                    <span>{item.name}</span>
                  </div>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F6B23D] animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar with App Install & Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-2.5">
            <div className="w-full flex justify-center">
              <PWAInstallButton />
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border border-transparent hover:border-red-200/50"
            >
              <LogOut size={16} />
              Keluar Akun
            </button>
          </div>
        </aside>

        {/* Floating Bottom Bar for Mobile - Berwarna & Hidup */}
        <div className="lg:hidden fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-200/80 z-50 flex justify-around items-center p-1.5">
          {navigation.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[62px] transition-all cursor-pointer ${
                  isActive 
                    ? 'text-[#172D51]' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${item.activeColor} text-white shadow-sm scale-110` 
                    : 'bg-transparent text-gray-400'
                }`}>
                  <item.icon size={18} className={isActive ? item.iconColor : ''} />
                </div>
                <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-black text-[#172D51]' : 'font-medium'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 pb-28 lg:p-7">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
