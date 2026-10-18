import React from 'react';
import { useAppStore } from '../store';
import { Users, GraduationCap, Activity, Recycle } from 'lucide-react';
import CashTableCard from '../components/CashTableCard';

export default function Dashboard() {
  const { students, records } = useAppStore();

  const uniqueClasses = new Set(students.map(s => s.classId)).size;
  const totalStudents = students.length;
  
  // Calculate total mijel and bs checked
  const totalMijel = records.filter(r => r.mijel).length;
  const totalBs = records.filter(r => r.bs).length;

  const stats = [
    { 
      name: 'Total Kelas', 
      value: uniqueClasses, 
      icon: GraduationCap, 
      color: 'text-[#172D51]', 
      bg: 'bg-[#172D51]/10',
      border: 'border-[#172D51]/15'
    },
    { 
      name: 'Total Siswa', 
      value: totalStudents, 
      icon: Users, 
      color: 'text-blue-700', 
      bg: 'bg-blue-600/10',
      border: 'border-blue-200'
    },
    { 
      name: 'Mijel Terkumpul', 
      value: totalMijel, 
      icon: Activity, 
      color: 'text-[#F6B23D]', 
      bg: 'bg-[#F6B23D]/15',
      border: 'border-[#F6B23D]/30'
    },
    { 
      name: 'Bank Sampah', 
      value: totalBs, 
      icon: Recycle, 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-600/10',
      border: 'border-emerald-200'
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500">Ringkasan data Bank Sampah dan Uang Kas Komite SMPN 257 Jakarta.</p>
      </div>

      {/* Card Sapaan Compact & Elegan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-white via-slate-50/50 to-blue-50/20">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0 shadow-xs">
          <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo Sekolah" className="h-14 sm:h-16 w-auto object-contain" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-block px-2 py-0.5 rounded-full bg-[#172D51]/5 text-[#172D51] font-bold text-[10px] tracking-wider uppercase border border-[#172D51]/10">
            SMP NEGERI 257 JAKARTA
          </div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
            Selamat Datang di Portal Bank Sampah & Kas Komite
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            Sistem pendataan tabungan minyak jelantah (mijel), bank sampah (bs) siswa, serta rekapitulasi uang kas komite kelas.
          </p>
        </div>
      </div>

      {/* Compact Stat Cards - Tidak Terlalu Kebesaran */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className={`overflow-hidden rounded-xl bg-white p-3 sm:p-4 shadow-xs border ${stat.border} hover:shadow-sm transition-all flex items-center justify-between group`}
          >
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 tracking-tight leading-none mb-1">
                {stat.name}
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 leading-none">
                {stat.value}
              </p>
            </div>
            
            <div className={`rounded-xl p-2 sm:p-2.5 ${stat.bg} shrink-0 transition-transform group-hover:scale-105`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Card Tabel Uang Kas Format Excel */}
      <CashTableCard />
    </div>
  );
}
