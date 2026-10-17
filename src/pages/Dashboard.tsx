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
    { name: 'Total Kelas', value: uniqueClasses, icon: GraduationCap, color: 'text-[#172D51]', bg: 'bg-[#172D51]/10' },
    { name: 'Total Siswa', value: totalStudents, icon: Users, color: 'text-[#34456D]', bg: 'bg-[#34456D]/10' },
    { name: 'Total Mijel Terkumpul', value: totalMijel, icon: Activity, color: 'text-[#F6B23D]', bg: 'bg-[#F6B23D]/10' },
    { name: 'Total BS Terkumpul', value: totalBs, icon: Recycle, color: 'text-[#FDC159]', bg: 'bg-[#FDC159]/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Ringkasan data Bank Sampah dan Uang Kas SMPN 257 Jakarta.</p>
      </div>

      {/* Card Sapaan dengan Logo */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-white to-blue-50/10">
        <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo Sekolah" className="h-20 sm:h-24 w-auto object-contain shrink-0" />
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Selamat Datang di Portal Bank Sampah!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Sistem pendataan tabungan minyak jelantah (mijel) dan bank sampah (bs) siswa kelas untuk mewujudkan SMPN 257 Jakarta yang hijau, bersih, dan asri.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-xl bg-white p-3 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
              <div className={`rounded-lg p-1.5 sm:p-3 self-start sm:self-auto ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] sm:text-sm font-medium text-gray-500 leading-tight">{stat.name}</p>
            </div>
            <p className="mt-1 text-lg sm:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Card Baru: Tabel Uang Kas Format Excel */}
      <CashTableCard />
    </div>
  );
}
