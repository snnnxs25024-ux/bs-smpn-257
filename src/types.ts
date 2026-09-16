export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface ActivityRecord {
  id: string;
  month: string;
  year: string;
  classId: string;
  studentId: string;
  mijel: boolean;
  bs: boolean;
  createdAt: number;
}
