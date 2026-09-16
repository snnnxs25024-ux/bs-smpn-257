import React from 'react';
import { useAppStore } from '../store';
import { Users, GraduationCap, Activity, Recycle } from 'lucide-react';

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
        <p className="text-sm text-gray-500">Ringkasan data Bank Sampah SMPN 257 Jakarta.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
              <div className={`rounded-lg p-2.5 sm:p-3 self-start sm:self-auto ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 leading-tight">{stat.name}</p>
            </div>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-100 text-center py-10 sm:py-16">
        <img src="https://i.imgur.com/2XP7suZ.png" alt="Logo" className="h-24 sm:h-32 w-auto mx-auto opacity-30 mb-6" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Selamat datang di Sistem Bank Sampah</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          Gunakan menu di samping (atau di bawah pada perangkat HP) untuk mulai mendata kegiatan, melihat rekap, dan mengelola database siswa.
        </p>
      </div>
    </div>
  );
}
