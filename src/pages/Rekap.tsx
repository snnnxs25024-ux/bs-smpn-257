import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Download, FileImage, Calendar, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sortClasses, parseGradeOrder } from '../types';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const YEARS = ['2023', '2024', '2025', '2026', '2027'];

export default function Rekap() {
  const { students, records } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  
  const printRef = useRef<HTMLDivElement>(null);

  // Extract unique classes
  const uniqueClasses = sortClasses(Array.from(new Set(students.map(s => s.classId))));

  // Group by Grade Level (e.g. "IX" from "IX A", "7" from "7A")
  const levelsMap: { [level: string]: string[] } = {};
  uniqueClasses.forEach(cls => {
    const trimmed = cls.trim();
    const parts = trimmed.split(/[\s\-]+/);
    const level = parts[0].toUpperCase();
    if (!levelsMap[level]) {
      levelsMap[level] = [];
    }
    levelsMap[level].push(cls);
  });

  // Sort sub-classes within each level
  Object.keys(levelsMap).forEach(lvl => {
    levelsMap[lvl] = sortClasses(levelsMap[lvl]);
  });

  const levels = Object.keys(levelsMap).sort((a, b) => parseGradeOrder(a) - parseGradeOrder(b));

  // Filter students for the selected class
  let displayStudents = students;
  if (selectedClass) {
    displayStudents = displayStudents.filter(s => s.classId === selectedClass);
  }
  displayStudents = displayStudents.sort((a, b) => a.name.localeCompare(b.name));

  const exportPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        windowWidth: element.scrollWidth,
        width: element.scrollWidth
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      pdf.save(`Rekap_Kelas_${selectedClass}_${filterMonth}_${filterYear}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const exportJPEG = async () => {
    const element = printRef.current;
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        windowWidth: element.scrollWidth,
        width: element.scrollWidth
      });
      const link = document.createElement('a');
      link.download = `Rekap_Kelas_${selectedClass}_${filterMonth}_${filterYear}.jpeg`;
      link.href = canvas.toDataURL('image/jpeg', 1.0);
      link.click();
    } catch (err) {
      console.error("Error exporting JPEG:", err);
    }
  };

  // If a specific class is selected, show the month selector & report view
  if (selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 text-sm font-semibold text-[#172D51] hover:text-[#34456D] transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Kembali ke Sub-Kelas Kelas {selectedLevel}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 rounded-lg bg-[#172D51] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#34456D] transition-colors"
            >
              <Download size={16} /> Unduh PDF
            </button>
            <button
              onClick={exportJPEG}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FileImage size={16} /> Unduh JPEG
            </button>
          </div>
        </div>

        {/* Month & Year Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#172D51]" />
            <span className="text-sm font-semibold text-gray-700">Pilih Periode Laporan:</span>
          </div>
          <div className="flex-1 min-w-[150px]">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-[#172D51] focus:outline-none focus:ring-[#172D51] border ring-1 ring-inset ring-gray-300"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-32">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-[#172D51] focus:outline-none focus:ring-[#172D51] border ring-1 ring-inset ring-gray-300"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-x-auto sm:overflow-x-visible border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
          <div className="p-3 sm:p-10 min-w-0 sm:min-w-[700px] w-full inline-block bg-white rounded-xl" ref={printRef}>
            <div className="mb-0 pb-0">
              <div className="w-full">
                <img src="https://i.imgur.com/S6mcib2.png" alt="Header Banner" className="w-full h-auto object-contain block mx-auto" crossOrigin="anonymous" />
              </div>
            </div>

            <div className="mt-1 mb-2 text-sm font-bold text-gray-900 space-y-0.5" style={{ marginTop: '4px' }}>
              <div>Kelas : {selectedClass}</div>
              <div>Bulan : {filterMonth} {filterYear}</div>
            </div>

            <table className="w-full border-collapse border border-black mb-4">
              <thead>
                <tr className="sticky top-[-17px] sm:top-[-33px] z-20">
                  <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-10 sm:w-16 sticky top-[-17px] sm:top-[-33px] z-10">NO</th>
                  <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-left text-[10px] sm:text-xs font-bold text-gray-900 uppercase sticky top-[-17px] sm:top-[-33px] z-10">NAMA</th>
                  <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-14 sm:w-28 sticky top-[-17px] sm:top-[-33px] z-10">MIJEL</th>
                  <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-14 sm:w-28 sticky top-[-17px] sm:top-[-33px] z-10">BS</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {displayStudents.map((student, idx) => {
                  const record = records.find(r => 
                    r.studentId === student.id && 
                    r.month === filterMonth && 
                    r.year === filterYear
                  );
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-gray-900 text-center" style={{ verticalAlign: 'middle' }}>{idx + 1}</td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-gray-900 font-semibold break-words" style={{ verticalAlign: 'middle' }}>{student.name}</td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-center font-bold" style={{ verticalAlign: 'middle' }}>
                        {record?.mijel ? <span className="text-gray-900">✓</span> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-center font-bold" style={{ verticalAlign: 'middle' }}>
                        {record?.bs ? <span className="text-gray-900">✓</span> : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })}
                {displayStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 sm:px-4 sm:py-8 border border-black text-center text-sm text-gray-500">
                      Tidak ada data siswa untuk kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 text-xs font-semibold text-gray-900 space-y-1">
              <div>keterangan :</div>
              <div>mijel : minyak jelantah</div>
              <div>bs : bank sampah</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a grade level is selected (e.g., "7"), show stacked long cards for its sub-classes (7A, 7B, 7C)
  if (selectedLevel) {
    const subClasses = levelsMap[selectedLevel] || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedLevel(null)}
            className="flex items-center gap-2 text-sm font-semibold text-[#172D51] hover:text-[#34456D] transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Kembali ke Daftar Tingkat Kelas
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daftar Sub-Kelas Kelas {selectedLevel}</h1>
          <p className="text-sm text-gray-500">Pilih sub-kelas di bawah ini untuk melihat rekapitulasi bulanan siswa.</p>
        </div>

        <div className="flex flex-col gap-4">
          {subClasses.map((cls) => {
            const classStudentsCount = students.filter(s => s.classId === cls).length;

            return (
              <div 
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className="group relative bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-[#172D51] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Kelas {cls}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {classStudentsCount} Siswa terdaftar
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#172D51]/10 group-hover:text-[#172D51] transition-colors">
                    Buka Rekapitulasi →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Main View: Stacked long banner cards for grade levels (e.g. "Kelas 7", "Kelas 8")
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rekap Kegiatan Per Tingkat Kelas</h1>
        <p className="text-sm text-gray-500">Pilih tingkat kelas di bawah ini untuk melihat daftar sub-kelas dan rekapitulasi laporan.</p>
      </div>

      {levels.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center border border-gray-200 shadow-sm">
          <Users size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Belum ada data kelas</h3>
          <p className="text-sm text-gray-500 mt-1">Tambahkan data siswa terlebih dahulu melalui menu Data Siswa.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {levels.map((level) => {
            const subClasses = levelsMap[level];
            const totalStudentsInLevel = students.filter(s => subClasses.includes(s.classId)).length;

            return (
              <div 
                key={level}
                onClick={() => setSelectedLevel(level)}
                className="group relative bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-[#172D51] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Kelas {level}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total Kelas: {subClasses.length} Sub-Kelas ({subClasses.join(', ')}) • {totalStudentsInLevel} Siswa
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#172D51]/10 group-hover:text-[#172D51] transition-colors">
                    Lihat Sub-Kelas →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
