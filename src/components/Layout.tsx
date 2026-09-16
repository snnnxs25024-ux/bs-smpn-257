import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Database,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  onNavigate: (menu: string) => void;
  onLogout: () => void;
}

export default function Layout({ children, activeMenu, onNavigate, onLogout }: LayoutProps) {
  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Kegiatan', id: 'kegiatan', icon: CalendarCheck },
    { name: 'Rekap', id: 'rekap', icon: FileText },
    { name: 'Data Base', id: 'database', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20 lg:pb-0">
      {/* Top Header for Mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo" className="h-8 w-auto" />
          <span className="font-bold text-gray-900 text-sm">BANK SAMPAH</span>
        </div>
        <button 
          onClick={onLogout}
          className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
          title="Keluar"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex flex-col z-40 w-64 h-screen sticky top-0 bg-white border-r border-gray-200">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100">
            <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo" className="h-10 w-auto" />
            <div className="font-bold text-gray-900 leading-tight">
              <div>BANK SAMPAH</div>
              <div className="text-xs text-gray-500 font-normal">SMPN 257 Jakarta</div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-[#172D51] text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-[#172D51]/5 hover:text-[#172D51]'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#172D51]'} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              Keluar
            </button>
          </div>
        </div>

        {/* Floating Bottom Bar for Mobile */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 flex justify-around items-center p-2">
          {navigation.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] transition-all ${
                  isActive ? 'text-[#172D51]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1 ${isActive ? 'bg-[#172D51]/10' : 'bg-transparent'}`}>
                  <item.icon size={20} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
