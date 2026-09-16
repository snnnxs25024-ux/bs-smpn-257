import { useState, useEffect } from 'react';
import { Student, ActivityRecord } from './types';

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
        throw new Error('Supabase Server Error');
      }
    } catch (error) {
      console.error("Error saving students:", error);
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
      if (!res.ok) throw new Error('Supabase Server Error');
    } catch (error) {
      console.error("Error adding student:", error);
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
      if (!res.ok) throw new Error('Supabase Server Error');
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id)); // Optimistic UI update
    try {
      await fetch(`/api/students/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const saveRecords = async (newRecords: ActivityRecord[]) => {
    setRecords(newRecords);
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords })
      });
    } catch (error) {
      console.error("Error saving records:", error);
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
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords }) // Just upsert the new ones
      });
    } catch (error) {
      console.error("Error saving records:", error);
    }
  };

  const clearDatabase = async () => {
    setStudents([]);
    setRecords([]);
    try {
      await fetch('/api/students', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Error clearing database:", error);
    }
  };

  return { students, saveStudents, addStudent, updateStudent, deleteStudent, clearDatabase, records, saveRecords, addRecords, loading };
}
