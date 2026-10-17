import { useState, useEffect } from 'react';
import { Student, ActivityRecord, CashRecord } from './types';
import { showToast } from './components/NotificationToast';
import { supabase } from './lib/supabase';

const LOCAL_CASH_KEY = 'smpn257_cash_records';

export function useAppStore() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [cashRecords, setCashRecords] = useState<CashRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CASH_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, recordsRes, cashRes] = await Promise.allSettled([
          supabase.from('students').select('*'),
          supabase.from('records').select('*'),
          supabase.from('cash_records').select('*')
        ]);
        
        if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
          setStudents(studentsRes.value.data);
        }
        if (recordsRes.status === 'fulfilled' && recordsRes.value.data) {
          setRecords(recordsRes.value.data);
        }
        if (cashRes.status === 'fulfilled' && cashRes.value.data && cashRes.value.data.length > 0) {
          setCashRecords(cashRes.value.data);
          try {
            localStorage.setItem(LOCAL_CASH_KEY, JSON.stringify(cashRes.value.data));
          } catch (e) {
            console.warn(e);
          }
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

  const saveCashRecords = async (newCashRecords: CashRecord[]) => {
    setCashRecords(newCashRecords);
    try {
      localStorage.setItem(LOCAL_CASH_KEY, JSON.stringify(newCashRecords));
    } catch (e) {
      console.warn(e);
    }

    try {
      const { error } = await supabase.from('cash_records').upsert(newCashRecords);
      if (error) {
        console.warn("Supabase cash_records note (fallback active):", error.message);
      }
    } catch (err) {
      console.warn("Supabase cash_records write error, saved locally:", err);
    }
  };

  const setCashPaymentDetail = async (
    parentName: string,
    classId: string,
    month: string,
    year: string,
    paid: boolean,
    amount: number = 0,
    paymentDate: string = ''
  ) => {
    const id = `${classId}-${parentName.trim()}-${month}-${year}`.replace(/\s+/g, '_').toLowerCase();
    const existingIndex = cashRecords.findIndex(r => 
      r.classId === classId && 
      r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase() && 
      r.month === month && 
      r.year === year
    );

    let updated: CashRecord[];
    if (existingIndex >= 0) {
      const current = cashRecords[existingIndex];
      updated = [...cashRecords];
      updated[existingIndex] = {
        ...current,
        paid,
        amount: paid ? amount : 0,
        paymentDate: paid ? paymentDate : '',
        updatedAt: Date.now()
      };
    } else {
      const newRecord: CashRecord = {
        id,
        parentName: parentName.trim(),
        classId,
        month,
        year,
        paid,
        amount: paid ? amount : 0,
        paymentDate: paid ? paymentDate : '',
        updatedAt: Date.now()
      };
      updated = [...cashRecords, newRecord];
    }

    await saveCashRecords(updated);
    showToast(paid ? `Kas ${month} Rp ${amount.toLocaleString('id-ID')} tersimpan!` : `Status ${month} diubah belum bayar`, 'success');
  };

  const toggleCashPayment = async (parentName: string, studentName: string | undefined, classId: string, month: string, year: string) => {
    const id = `${classId}-${parentName.trim()}-${month}-${year}`.replace(/\s+/g, '_').toLowerCase();
    const existingIndex = cashRecords.findIndex(r => 
      r.classId === classId && 
      r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase() && 
      r.month === month && 
      r.year === year
    );

    let updated: CashRecord[];
    if (existingIndex >= 0) {
      const current = cashRecords[existingIndex];
      const newStatus = !current.paid;
      const todayStr = new Date().toISOString().split('T')[0];
      updated = [...cashRecords];
      updated[existingIndex] = {
        ...current,
        paid: newStatus,
        paymentDate: newStatus ? (current.paymentDate || todayStr) : '',
        amount: newStatus ? (current.amount || 10000) : 0,
        updatedAt: Date.now()
      };
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const newRecord: CashRecord = {
        id,
        parentName: parentName.trim(),
        studentName: studentName?.trim() || '',
        classId,
        month,
        year,
        paid: true,
        amount: 10000,
        paymentDate: todayStr,
        updatedAt: Date.now()
      };
      updated = [...cashRecords, newRecord];
    }

    await saveCashRecords(updated);
    showToast('Status Uang Kas diperbarui!', 'success');
  };

  const DEFAULT_PARENT_NAMES = [
    'Lintang', 'Calysta', 'Kamil', 'Bunga', 'Rasya', 'Fatih',
    'Adiba', 'Nadia', 'Nafisa', 'Dara', 'Raina', 'Rega',
    'Adli', 'Buket', 'Gendis', 'Zammy', 'Wildan'
  ];

  const updateCashMemberClass = async (parentName: string, oldClassId: string, newClassId: string) => {
    if (!newClassId.trim()) return;
    const targetClass = newClassId.trim().toUpperCase();
    const updated = cashRecords.map(r => {
      if (r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase() && r.classId === oldClassId) {
        return {
          ...r,
          classId: targetClass,
          id: `${targetClass}-${r.parentName.trim()}-${r.month}-${r.year}`.replace(/\s+/g, '_').toLowerCase(),
          updatedAt: Date.now()
        };
      }
      return r;
    });

    await saveCashRecords(updated);
    showToast(`Kelas untuk ${parentName} diubah ke ${targetClass}!`, 'success');
  };

  const updateCashMemberName = async (oldName: string, newName: string, classId: string) => {
    if (!newName.trim()) return;
    const cleanNew = newName.trim();
    const updated = cashRecords.map(r => {
      if (r.parentName.trim().toLowerCase() === oldName.trim().toLowerCase() && r.classId === classId) {
        return {
          ...r,
          parentName: cleanNew,
          id: `${classId}-${cleanNew}-${r.month}-${r.year}`.replace(/\s+/g, '_').toLowerCase(),
          updatedAt: Date.now()
        };
      }
      return r;
    });

    await saveCashRecords(updated);
    showToast(`Nama wali murid diperbarui menjadi ${cleanNew}!`, 'success');
  };

  const addCashMember = async (parentName: string, classId: string) => {
    if (!parentName.trim() || !classId.trim()) return;
    const dummyMonth = 'Januari';
    const dummyYear = new Date().getFullYear().toString();
    const id = `${classId}-${parentName.trim()}-${dummyMonth}-${dummyYear}`.replace(/\s+/g, '_').toLowerCase();
    
    const exists = cashRecords.some(r => r.classId === classId && r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase());
    if (exists) {
      showToast('Wali murid ini sudah terdaftar di kelas ini.', 'info');
      return;
    }

    const newRecord: CashRecord = {
      id,
      parentName: parentName.trim(),
      classId,
      month: dummyMonth,
      year: dummyYear,
      paid: false,
      updatedAt: Date.now()
    };

    const updated = [...cashRecords, newRecord];
    await saveCashRecords(updated);
    showToast('Data Wali Murid berhasil ditambahkan!', 'success');
  };

  const deleteCashMember = async (parentName: string, classId: string) => {
    const updated = cashRecords.filter(r => !(r.classId === classId && r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase()));
    await saveCashRecords(updated);
    showToast('Data Wali Murid dihapus dari Uang Kas.', 'info');
  };

  return { 
    students, 
    saveStudents, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    clearDatabase, 
    records, 
    saveRecords, 
    addRecords, 
    cashRecords,
    saveCashRecords,
    toggleCashPayment,
    setCashPaymentDetail,
    addCashMember,
    deleteCashMember,
    updateCashMemberClass,
    updateCashMemberName,
    loading 
  };
}
