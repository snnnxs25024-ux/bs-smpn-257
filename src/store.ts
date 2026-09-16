import { useState, useEffect } from 'react';
import { Student, ActivityRecord } from './types';
import { showToast } from './components/NotificationToast';
import { supabase } from './lib/supabase';

export function useAppStore() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, recordsRes] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('records').select('*')
        ]);
        
        if (studentsRes.data) {
          setStudents(studentsRes.data);
        }
        if (recordsRes.data) {
          setRecords(recordsRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast('Gagal memuat data dari database.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveStudents = async (newStudents: Student[]) => {
    setStudents(newStudents); // Optimistic UI update
    try {
      const { error } = await supabase.from('students').upsert(newStudents);
      if (error) throw error;
      showToast('Data siswa berhasil disimpan ke database!', 'success');
    } catch (error: any) {
      console.error("Error saving students:", error);
      showToast(`Gagal menyimpan: ${error.message}`, 'error');
      throw error;
    }
  };

  const addStudent = async (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    try {
      const { error } = await supabase.from('students').upsert([newStudent]);
      if (error) throw error;
      showToast('Siswa baru berhasil ditambahkan!', 'success');
    } catch (error: any) {
      console.error("Error adding student:", error);
      showToast(`Gagal menambah siswa: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    try {
      const { error } = await supabase.from('students').upsert([updatedStudent]);
      if (error) throw error;
      showToast('Data siswa berhasil diperbarui!', 'success');
    } catch (error: any) {
      console.error("Error updating student:", error);
      showToast(`Gagal memperbarui: ${error.message}`, 'error');
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id)); // Optimistic UI update
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      showToast('Siswa berhasil dihapus.', 'success');
    } catch (error: any) {
      console.error("Error deleting student:", error);
      showToast('Gagal menghapus siswa.', 'error');
    }
  };

  const saveRecords = async (newRecords: ActivityRecord[]) => {
    setRecords(newRecords);
    try {
      const { error } = await supabase.from('records').upsert(newRecords);
      if (error) throw error;
      showToast('Catatan kegiatan berhasil disimpan!', 'success');
    } catch (error: any) {
      console.error("Error saving records:", error);
      showToast('Gagal menyimpan catatan kegiatan.', 'error');
    }
  };

  const addRecords = async (newRecords: ActivityRecord[]) => {
    const updated = [...records];
    newRecords.forEach(nr => {
      const existingIndex = updated.findIndex(r => r.month === nr.month && r.year === nr.year && r.studentId === nr.studentId);
      if (existingIndex >= 0) {
        updated[existingIndex] = nr;
      } else {
        updated.push(nr);
      }
    });
    setRecords(updated); // Optimistic UI update
    
    try {
      const { error } = await supabase.from('records').upsert(newRecords);
      if (error) throw error;
      showToast(`Berhasil mencatat ${newRecords.length} data kegiatan!`, 'success');
    } catch (error: any) {
      console.error("Error saving records:", error);
      showToast('Gagal mencatat kegiatan ke database.', 'error');
    }
  };

  const clearDatabase = async () => {
    setStudents([]);
    setRecords([]);
    try {
      await supabase.from('students').delete().neq('id', '0');
      await supabase.from('records').delete().neq('id', '0');
      showToast('Database berhasil dikosongkan.', 'info');
    } catch (error: any) {
      console.error("Error clearing database:", error);
      showToast('Gagal mengosongkan database.', 'error');
    }
  };

  return { students, saveStudents, addStudent, updateStudent, deleteStudent, clearDatabase, records, saveRecords, addRecords, loading };
}
