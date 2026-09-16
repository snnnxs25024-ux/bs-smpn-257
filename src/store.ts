import { useState, useEffect } from 'react';
import { Student, ActivityRecord } from './types';
import { showToast } from './components/NotificationToast';

export function useAppStore() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, recordsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/records')
        ]);
        
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(recordsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast('Gagal memuat data dari server.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveStudents = async (newStudents: Student[]) => {
    setStudents(newStudents); // Optimistic UI update
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: newStudents })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Supabase Server Error');
      }
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
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [newStudent] })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Supabase Server Error');
      }
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
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [updatedStudent] })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Supabase Server Error');
      }
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
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Siswa berhasil dihapus.', 'success');
    } catch (error) {
      console.error("Error deleting student:", error);
      showToast('Gagal menghapus siswa.', 'error');
    }
  };

  const saveRecords = async (newRecords: ActivityRecord[]) => {
    setRecords(newRecords);
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords })
      });
      if (!res.ok) throw new Error('Gagal menyimpan rekap');
      showToast('Catatan kegiatan berhasil disimpan!', 'success');
    } catch (error) {
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
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords }) // Just upsert the new ones
      });
      if (!res.ok) throw new Error('Gagal menyimpan rekap');
      showToast(`Berhasil mencatat ${newRecords.length} data kegiatan!`, 'success');
    } catch (error) {
      console.error("Error saving records:", error);
      showToast('Gagal mencatat kegiatan ke server.', 'error');
    }
  };

  const clearDatabase = async () => {
    setStudents([]);
    setRecords([]);
    try {
      const res = await fetch('/api/students', {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal mereset database');
      showToast('Database berhasil dikosongkan.', 'info');
    } catch (error) {
      console.error("Error clearing database:", error);
      showToast('Gagal mengosongkan database.', 'error');
    }
  };

  return { students, saveStudents, addStudent, updateStudent, deleteStudent, clearDatabase, records, saveRecords, addRecords, loading };
}
