import React, { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store';
import { Upload, Download, Plus, Trash2, Edit2, X, Check, ArrowLeft, Users } from 'lucide-react';
import Papa from 'papaparse';
import { Student } from '../types';
import { showToast } from '../components/NotificationToast';

export default function Database() {
  const { students, saveStudents, addStudent, updateStudent, deleteStudent, clearDatabase } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newName, setNewName] = useState('');
  const [newKelas, setNewKelas] = useState('');
  const [newHuruf, setNewHuruf] = useState('');

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  // Editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKelas, setEditKelas] = useState('');
  const [editHuruf, setEditHuruf] = useState('');

  const existingClasses = Array.from(new Set(students.map(s => s.classId))).sort();

  const handleQuickClassSelect = (classId: string) => {
    const parts = classId.trim().split(' ');
    setNewKelas(parts[0] || '');
    setNewHuruf(parts.length > 1 ? parts.slice(1).join(' ') : '');
  };

  const handleClearAll = async () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH database (seluruh siswa dan catatan kegiatan)? Tindakan ini tidak dapat dibatalkan.')) {
      if (confirm('Konfirmasi sekali lagi: Hapus semua data?')) {
        try {
          await clearDatabase();
          alert('Database berhasil dikosongkan.');
        } catch (err) {
          alert('Gagal mengosongkan database.');
        }
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newKelas.trim() || !newHuruf.trim()) {
      alert('Mohon lengkapi Nama, Kelas, dan Huruf!');
      return;
    }

    const classId = `${newKelas} ${newHuruf}`.trim().toUpperCase();
    const newStudent: Student = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: newName.trim(),
      classId: classId
    };

    try {
      if (addStudent) {
        await addStudent(newStudent);
      } else {
        await saveStudents([...students, newStudent]);
      }
      setNewName('');
      setNewKelas('');
      setNewHuruf('');
      alert('Berhasil menambahkan siswa!');
    } catch (error) {
      alert('Gagal menyimpan! Pastikan Anda telah membuat tabel "students" dan "records" di SQL Editor Supabase Anda.');
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id);
    setEditName(student.name);
    const parts = student.classId.trim().split(' ');
    setEditKelas(parts[0] || '');
    setEditHuruf(parts.length > 1 ? parts.slice(1).join(' ') : '');
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setEditName('');
    setEditKelas('');
    setEditHuruf('');
  };

  const handleSaveEdit = async (studentId: string) => {
    if (!editName.trim() || !editKelas.trim() || !editHuruf.trim()) {
      alert('Nama, Kelas, dan Huruf tidak boleh kosong!');
      return;
    }
    
    const newClassId = `${editKelas} ${editHuruf}`.trim().toUpperCase();
    const updated: Student = {
      id: studentId,
      name: editName.trim(),
      classId: newClassId
    };

    try {
      if (updateStudent) {
        await updateStudent(updated);
      } else {
        await saveStudents(students.map(s => s.id === studentId ? updated : s));
      }
      setEditingStudentId(null);
    } catch (error) {
      alert('Gagal mengupdate data siswa.');
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      deleteStudent(id);
    }
  };

  const exportCSV = () => {
    const data = students.map(s => {
      const parts = s.classId.trim().split(' ');
      const kelas = parts[0] || '';
      const huruf = parts.length > 1 ? parts.slice(1).join(' ') : '';
      return {
        'nama': s.name,
        'kelas': kelas,
        'huruf': huruf
      };
    });
    
    // If empty, provide a dummy row so they know the format
    if (data.length === 0) {
      data.push({ 'nama': 'Ari', 'kelas': '7', 'huruf': 'B' });
    }

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_siswa_smpn257.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "",
      transformHeader: (header) => header.trim().toLowerCase().replace(/^\uFEFF/, ''),
      complete: (results) => {
        const importedStudents: Student[] = [];
        
        results.data.forEach((row: any) => {
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.trim().toLowerCase().replace(/^\uFEFF/, '');
            normalizedRow[cleanKey] = row[k];
          });

          const name = normalizedRow['name'] || normalizedRow['nama'] || normalizedRow['namasiswa'] || '';
          let classId = normalizedRow['classid'] || normalizedRow['class_id'] || '';
          
          if (!classId) {
            const kelas = normalizedRow['kelas'] || '';
            const huruf = normalizedRow['huruf'] || '';
            if (kelas && huruf) {
              classId = `${kelas} ${huruf}`.trim().toUpperCase();
            } else if (kelas) {
              classId = kelas.toString().trim().toUpperCase();
            }
          } else {
            classId = classId.toString().trim().toUpperCase();
          }

          const values = Object.values(normalizedRow).map(v => String(v).trim()).filter(Boolean);
          const finalName = name ? name.toString().trim() : (values.length >= 2 ? values[0] : '');
          const finalClassId = classId ? classId : (values.length >= 2 ? values.slice(1).join(' ').toUpperCase() : '');

          if (finalName && finalClassId) {
            importedStudents.push({
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              name: finalName,
              classId: finalClassId
            });
          }
        });

        if (importedStudents.length > 0) {
          if (confirm(`Ditemukan ${importedStudents.length} data siswa valid. Tambahkan ke database?`)) {
            // Check for duplicates based on name and class
            const existingKeys = new Set(students.map(s => `${s.name.toLowerCase()}-${s.classId.toLowerCase()}`));
            const uniqueNewStudents = importedStudents.filter(s => !existingKeys.has(`${s.name.toLowerCase()}-${s.classId.toLowerCase()}`));
            
            if (uniqueNewStudents.length > 0) {
              saveStudents([...students, ...uniqueNewStudents])
                .then(() => {
                  showToast(`Berhasil menambahkan ${uniqueNewStudents.length} siswa baru!`, 'success');
                })
                .catch((err: any) => {
                  showToast(`Gagal menyimpan: ${err.message}`, 'error');
                });
            } else {
              showToast('Semua data dalam CSV sudah ada di database (duplikat).', 'info');
            }
          }
        } else {
          showToast('Format file tidak valid atau data kosong. Pastikan kolom "nama", "kelas", dan "huruf" terisi.', 'error');
        }
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showToast('Terjadi kesalahan saat membaca file CSV.', 'error');
      }
    });
  };

  const sortedStudents = [...students].sort((a, b) => a.classId.localeCompare(b.classId) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Data Base Siswa</h1>
        <p className="text-sm text-gray-500">Kelola daftar siswa dan kelas. Anda bisa tambah manual atau via CSV.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tambah Manual Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-md bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tambah Siswa Baru</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih dari Kelas yang Ada:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingClasses.length > 0 ? existingClasses.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleQuickClassSelect(c)}
                      className="px-3 py-1 text-xs font-medium bg-[#172D51]/5 text-[#172D51] rounded-full border border-[#172D51]/20 hover:bg-[#172D51]/10 transition-colors"
                    >
                      {c}
                    </button>
                  )) : <span className="text-xs text-gray-400">Belum ada data kelas</span>}
                </div>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-3"
                  placeholder="Misal: Rian"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="kelas" className="block text-sm font-medium text-gray-700">Kelas</label>
                  <input
                    type="text"
                    id="kelas"
                    required
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-3"
                    placeholder="Misal: 7"
                  />
                </div>
                <div>
                  <label htmlFor="huruf" className="block text-sm font-medium text-gray-700">Huruf</label>
                  <input
                    type="text"
                    id="huruf"
                    required
                    value={newHuruf}
                    onChange={(e) => setNewHuruf(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-3"
                    placeholder="Misal: A"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 flex justify-center items-center gap-2 rounded-lg bg-[#172D51] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#34456D] transition-colors"
              >
                <Plus size={18} />
                Tambah Siswa
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Import / Export CSV</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Gunakan template CSV untuk menambahkan banyak siswa sekaligus. Pastikan memiliki kolom "nama", "kelas", dan "huruf".
            </p>
            <div className="space-y-3">
              <button
                onClick={exportCSV}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download size={18} />
                Unduh Template CSV
              </button>
              
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleImport}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#172D51]/5 px-3 py-2.5 text-sm font-semibold text-[#172D51] shadow-sm ring-1 ring-inset ring-[#172D51] hover:bg-[#172D51]/10 transition-colors"
              >
                <Upload size={18} />
                Upload CSV
              </button>

              <button
                onClick={handleClearAll}
                className="w-full mt-4 flex justify-center items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                Hapus Seluruh Database
              </button>
            </div>
          </div>
        </div>

        {/* Tabel Data / Class Cards */}
        <div className="lg:col-span-2">
          {!selectedClass ? (
            <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col p-6 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Pilih Kelas</h2>
              {existingClasses.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingClasses.map(c => {
                    const count = students.filter(s => s.classId === c).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedClass(c)}
                        className="flex flex-col items-start justify-center p-4 rounded-xl border border-gray-200 hover:border-[#172D51] hover:bg-[#172D51]/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-2 text-gray-700 group-hover:text-[#172D51]">
                          <Users size={20} />
                          <span className="font-bold text-lg">{c}</span>
                        </div>
                        <span className="text-sm text-gray-500">{count} Siswa</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Belum ada data kelas. Tambahkan siswa terlebih dahulu.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col max-h-[600px]">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedClass(null)}
                    className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Kembali ke daftar kelas"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">Kelas {selectedClass}</h2>
                </div>
                <h2 className="text-sm font-medium text-gray-700">Total: <span className="font-bold text-[#172D51]">{students.filter(s => s.classId === selectedClass).length}</span> Siswa</h2>
              </div>
              <div className="overflow-y-auto flex-1 p-0 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Kelas</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStudents.filter(s => s.classId === selectedClass).map((student, idx) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        {editingStudentId === student.id ? (
                          <>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                              <input 
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-2"
                              />
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex gap-1">
                                <input 
                                  type="text"
                                  value={editKelas}
                                  onChange={e => setEditKelas(e.target.value)}
                                  placeholder="Kls"
                                  className="block w-12 rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-2 text-center"
                                />
                                <input 
                                  type="text"
                                  value={editHuruf}
                                  onChange={e => setEditHuruf(e.target.value)}
                                  placeholder="Hrf"
                                  className="block w-12 rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#172D51] sm:text-sm px-2 text-center"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleSaveEdit(student.id)}
                                  className="text-[#F6B23D] hover:text-[#FDC159] bg-[#172D51]/5 p-1.5 rounded-md hover:bg-[#172D51]/10 transition-colors"
                                  title="Simpan"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                                  title="Batal"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.classId}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(student)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md hover:bg-blue-100 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(student.id)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {students.filter(s => s.classId === selectedClass).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                          Belum ada data siswa di kelas ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
