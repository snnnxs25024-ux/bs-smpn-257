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
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    const printArea = printAreaRef.current;
    if (!printArea) return;
    
    try {
      setIsExporting(true);
      // Wait for React to render the printable area offscreen
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pages = printArea.querySelectorAll('.print-page');
      if (pages.length === 0) return;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, { 
          scale: 3.125, // Produces highly crisp A4 (2481 x 3509 px at 300 DPI)
          useCORS: true, 
          allowTaint: true,
          windowWidth: 794,
          width: 794,
          height: 1123,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // Fit perfectly onto standard A4 page (0 margins because padding is baked into the canvas image)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      pdf.save(`Rekap_Kelas_${selectedClass}_${filterMonth}_${filterYear}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportJPEG = async () => {
    const printArea = printAreaRef.current;
    if (!printArea) return;
    
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pages = printArea.querySelectorAll('.print-page');
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, { 
          scale: 3.125, // For 300 DPI resolution (2481 x 3509 px)
          useCORS: true, 
          allowTaint: true,
          windowWidth: 794,
          width: 794,
          height: 1123,
          backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        const pageSuffix = pages.length > 1 ? `_Halaman_${i + 1}` : '';
        link.download = `Rekap_Kelas_${selectedClass}_${filterMonth}_${filterYear}${pageSuffix}.jpeg`;
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
        
        // Prevent browser from blocking multiple quick downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err) {
      console.error("Error exporting JPEG:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // If a specific class is selected, show the month selector & report view
  if (selectedClass) {
    const ITEMS_PER_PAGE = 22;
    const studentChunks: (typeof displayStudents)[] = [];
    for (let i = 0; i < displayStudents.length; i += ITEMS_PER_PAGE) {
      studentChunks.push(displayStudents.slice(i, i + ITEMS_PER_PAGE));
    }
    if (studentChunks.length === 0) {
      studentChunks.push([]);
    }

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
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-[#172D51] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#34456D] transition-colors disabled:opacity-50"
            >
              <Download size={16} /> Unduh PDF
            </button>
            <button
              onClick={exportJPEG}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
          <div 
            className="p-3 sm:p-10 inline-block bg-white rounded-xl min-w-0 sm:min-w-[700px] w-full" 
            ref={printRef}
          >
            <div className="mb-0 pb-0">
              <div className="w-full">
                <img src="https://i.imgur.com/e2tp2Js.png" alt="Header Banner" className="w-full h-auto object-contain block mx-auto" crossOrigin="anonymous" />
              </div>
            </div>

            <div className="mt-1 mb-2 text-sm font-bold text-gray-900 space-y-0.5" style={{ marginTop: '4px' }}>
              <div>Kelas : {selectedClass}</div>
              <div>Bulan : {filterMonth} {filterYear}</div>
            </div>

            <div className="max-h-[380px] sm:max-h-none overflow-y-auto sm:overflow-visible relative border border-black mb-4 rounded-sm">
              <table className="w-full border-collapse border-none">
                <thead>
                  <tr className="sticky top-0 z-20">
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-10 sm:w-16 sticky top-0 z-10" style={{ verticalAlign: 'middle' }}>
                      <div className="flex items-center justify-center min-h-[16px] leading-none">NO</div>
                    </th>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-left text-[10px] sm:text-xs font-bold text-gray-900 uppercase sticky top-0 z-10" style={{ verticalAlign: 'middle' }}>
                      <div className="flex items-center min-h-[16px] leading-none">NAMA</div>
                    </th>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-14 sm:w-28 sticky top-0 z-10" style={{ verticalAlign: 'middle' }}>
                      <div className="flex items-center justify-center min-h-[16px] leading-none">MIJEL</div>
                    </th>
                    <th scope="col" className="px-2 py-2 sm:px-4 sm:py-2.5 border border-black bg-[#F6B23D] text-center text-[10px] sm:text-xs font-bold text-gray-900 uppercase w-14 sm:w-28 sticky top-0 z-10" style={{ verticalAlign: 'middle' }}>
                      <div className="flex items-center justify-center min-h-[16px] leading-none">BS</div>
                    </th>
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
                        <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-gray-900 text-center" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[20px] leading-none">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-gray-900 font-semibold break-words" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center min-h-[20px] leading-tight">
                            {student.name}
                          </div>
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-center font-bold" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[20px] leading-none">
                            {record?.mijel ? <span className="text-gray-900 text-base">✓</span> : <span className="text-gray-300">-</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2 sm:px-4 sm:py-3 border border-black text-[11px] sm:text-sm text-center font-bold" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[20px] leading-none">
                            {record?.bs ? <span className="text-gray-900 text-base">✓</span> : <span className="text-gray-300">-</span>}
                          </div>
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
            </div>

            <div className="mt-4 text-xs font-semibold text-gray-900 space-y-1">
              <div>keterangan :</div>
              <div>mijel : minyak jelantah</div>
              <div>bs : bank sampah</div>
            </div>
          </div>
        </div>

        {/* Hidden Off-Screen Dedicated Multi-Page Print Layout (Guarantees A4 Margins & High-DPI Output) */}
        {isExporting && (
          <div 
            ref={printAreaRef} 
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              top: '0px', 
              width: '794px', 
              zIndex: -100, 
              backgroundColor: '#ffffff' 
            }}
          >
            {studentChunks.map((chunk, chunkIdx) => (
              <div 
                key={chunkIdx}
                className="print-page bg-white relative box-border flex flex-col justify-between"
                style={{
                  width: '794px',
                  height: '1123px',
                  padding: '45px', // Exact 45px padding yields standard ~12mm physical margin on A4 print setups
                  backgroundColor: '#ffffff'
                }}
              >
                <div>
                  {/* Header Banner - aspect-ratio perfectly preserved */}
                  <div className="w-full mb-6">
                    <img 
                      src="https://i.imgur.com/e2tp2Js.png" 
                      alt="Header Banner" 
                      className="w-full h-auto object-contain block mx-auto" 
                      crossOrigin="anonymous" 
                    />
                  </div>

                  {/* Meta info */}
                  <div className="mb-4 text-sm font-bold text-gray-900 space-y-0.5" style={{ marginTop: '4px' }}>
                    <div>Kelas : {selectedClass}</div>
                    <div>Bulan : {filterMonth} {filterYear}</div>
                  </div>

                  {/* Table with crisp alignments */}
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-2 border border-black bg-[#F6B23D] text-center font-bold text-gray-900 uppercase w-12" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[16px] leading-none">NO</div>
                        </th>
                        <th scope="col" className="px-3 py-2 border border-black bg-[#F6B23D] text-left font-bold text-gray-900 uppercase" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center min-h-[16px] leading-none">NAMA</div>
                        </th>
                        <th scope="col" className="px-3 py-2 border border-black bg-[#F6B23D] text-center font-bold text-gray-900 uppercase w-24" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[16px] leading-none">MIJEL</div>
                        </th>
                        <th scope="col" className="px-3 py-2 border border-black bg-[#F6B23D] text-center font-bold text-gray-900 uppercase w-24" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center min-h-[16px] leading-none">BS</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {chunk.map((student, idx) => {
                        const globalIndex = chunkIdx * ITEMS_PER_PAGE + idx + 1;
                        const record = records.find(r => 
                          r.studentId === student.id && 
                          r.month === filterMonth && 
                          r.year === filterYear
                        );
                        
                        return (
                          <tr key={student.id}>
                            <td className="px-3 py-1.5 border border-black text-gray-900 text-center" style={{ verticalAlign: 'middle' }}>
                              <div className="flex items-center justify-center min-h-[22px] leading-none">
                                {globalIndex}
                              </div>
                            </td>
                            <td className="px-3 py-1.5 border border-black text-gray-900 font-semibold break-words" style={{ verticalAlign: 'middle' }}>
                              <div className="flex items-center min-h-[22px] leading-tight">
                                {student.name}
                              </div>
                            </td>
                            <td className="px-3 py-1.5 border border-black text-center font-bold" style={{ verticalAlign: 'middle' }}>
                              <div className="flex items-center justify-center min-h-[22px] leading-none">
                                {record?.mijel ? <span className="text-gray-900 text-sm">✓</span> : <span className="text-gray-300">-</span>}
                              </div>
                            </td>
                            <td className="px-3 py-1.5 border border-black text-center font-bold" style={{ verticalAlign: 'middle' }}>
                              <div className="flex items-center justify-center min-h-[22px] leading-none">
                                {record?.bs ? <span className="text-gray-900 text-sm">✓</span> : <span className="text-gray-300">-</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Keterangan & Paginasi */}
                <div className="border-t border-gray-200 pt-3 flex items-end justify-between text-xs font-semibold text-gray-500">
                  <div className="space-y-1">
                    <div>keterangan :</div>
                    <div>mijel : minyak jelantah</div>
                    <div>bs : bank sampah</div>
                  </div>
                  <div>
                    Halaman {chunkIdx + 1} dari {studentChunks.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

        <div className="flex flex-col gap-2.5 sm:gap-4">
          {subClasses.map((cls) => {
            const classStudentsCount = students.filter(s => s.classId === cls).length;

            return (
              <div 
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className="group relative bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-200 hover:border-[#172D51] hover:shadow-md transition-all cursor-pointer flex items-center justify-between animate-fade-in"
              >
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900">Kelas {cls}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    {classStudentsCount} Siswa terdaftar
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#172D51]/10 group-hover:text-[#172D51] transition-colors">
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
        <div className="flex flex-col gap-2.5 sm:gap-4">
          {levels.map((level) => {
            const subClasses = levelsMap[level];
            const totalStudentsInLevel = students.filter(s => subClasses.includes(s.classId)).length;

            return (
              <div 
                key={level}
                onClick={() => setSelectedLevel(level)}
                className="group relative bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-200 hover:border-[#172D51] hover:shadow-md transition-all cursor-pointer flex items-center justify-between animate-fade-in"
              >
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900">Kelas {level}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    Total Kelas: {subClasses.length} Sub-Kelas ({subClasses.join(', ')}) • {totalStudentsInLevel} Siswa
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-100 text-gray-700 group-hover:bg-[#172D51]/10 group-hover:text-[#172D51] transition-colors">
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
