import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { ActivityRecord } from '../types';

interface KegiatanProps {
  onNavigate: (menu: string) => void;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const YEARS = ['2023', '2024', '2025', '2026', '2027'];

export default function Kegiatan({ onNavigate }: KegiatanProps) {
  const { students, records, addRecords } = useAppStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Period, 2: Class, 3: Students
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Local state for checkboxes before saving
  const [currentChecklist, setCurrentChecklist] = useState<Record<string, { mijel: boolean, bs: boolean }>>({});

  const classes = Array.from(new Set(students.map(s => s.classId))).sort() as string[];

  const handlePeriodSelect = () => {
    setStep(2);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    
    // Initialize checklist state from existing records if any
    const classStudents = students.filter(s => s.classId === classId);
    const initialChecklist: Record<string, { mijel: boolean, bs: boolean }> = {};
    
    classStudents.forEach(student => {
      const existingRecord = records.find(r => 
        r.studentId === student.id && 
        r.month === selectedMonth && 
        r.year === selectedYear
      );
      
      initialChecklist[student.id] = {
        mijel: existingRecord?.mijel || false,
        bs: existingRecord?.bs || false
      };
    });
    
    setCurrentChecklist(initialChecklist);
    setStep(3);
  };

  const handleCheck = (studentId: string, field: 'mijel' | 'bs', value: boolean) => {
    setCurrentChecklist(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const classStudents = students.filter(s => s.classId === selectedClass);
    const newRecords: ActivityRecord[] = classStudents.map(student => ({
      id: `${student.id}-${selectedMonth}-${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      classId: selectedClass,
      studentId: student.id,
      mijel: currentChecklist[student.id]?.mijel || false,
      bs: currentChecklist[student.id]?.bs || false,
      createdAt: Date.now()
    }));
    
    addRecords(newRecords);
    onNavigate('rekap');
  };

  const classStudents = students.filter(s => s.classId === selectedClass).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kegiatan</h1>
        <p className="text-sm text-gray-500">Catat penyetoran Minyak Jelantah dan Bank Sampah.</p>
      </div>

      <div className="rounded-md bg-white p-6 shadow-sm border border-gray-200 min-h-[400px]">
        {step === 1 && (
          <div className="max-w-md mx-auto py-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6 text-center">Pilih Periode Kegiatan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-base focus:border-[#172D51] focus:outline-none focus:ring-[#172D51] sm:text-sm border ring-1 ring-inset ring-gray-300"
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-base focus:border-[#172D51] focus:outline-none focus:ring-[#172D51] sm:text-sm border ring-1 ring-inset ring-gray-300"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button
                onClick={handlePeriodSelect}
                className="w-full mt-6 flex justify-center items-center gap-2 rounded-lg bg-[#172D51] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#34456D] transition-colors"
              >
                Lanjut ke Pilih Kelas
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
              <button onClick={() => setStep(1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Pilih Kelas</h2>
                <p className="text-sm text-gray-500">Periode: {selectedMonth} {selectedYear}</p>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Tidak ada data kelas. Silakan tambah siswa di menu Data Base.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {classes.map(c => (
                  <button
                    key={c}
                    onClick={() => handleClassSelect(c)}
                    className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:border-[#172D51] hover:bg-[#172D51]/5 hover:shadow-sm transition-all group"
                  >
                    <span className="text-xl font-bold text-gray-700 group-hover:text-[#172D51]">{c}</span>
                    <span className="text-xs text-gray-400 mt-2">{students.filter(s => s.classId === c).length} Siswa</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Input Data Kelas {selectedClass}</h2>
                  <p className="text-sm text-gray-500">Periode: {selectedMonth} {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#172D51] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#34456D] transition-colors w-full sm:w-auto"
              >
                <Save size={18} />
                Simpan Rekap
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12 border-r">No</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Mijel</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">BS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center border-r">{idx + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={currentChecklist[student.id]?.mijel || false}
                            onChange={(e) => handleCheck(student.id, 'mijel', e.target.checked)}
                            className="h-6 w-6 rounded border-gray-300 text-[#172D51] focus:ring-[#172D51] cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={currentChecklist[student.id]?.bs || false}
                            onChange={(e) => handleCheck(student.id, 'bs', e.target.checked)}
                            className="h-6 w-6 rounded border-gray-300 text-[#172D51] focus:ring-[#172D51] cursor-pointer"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {classStudents.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                Tidak ada data siswa untuk kelas ini.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
