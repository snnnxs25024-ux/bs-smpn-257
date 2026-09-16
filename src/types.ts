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

export function parseGradeOrder(str: string): number {
  const romanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
  };
  const upper = str.toUpperCase().trim();
  if (romanMap[upper] !== undefined) {
    return romanMap[upper];
  }
  const num = parseInt(upper, 10);
  if (!isNaN(num)) {
    return num;
  }
  return 999;
}

export function sortClasses(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    const partsA = a.trim().split(/[\s\-]+/);
    const partsB = b.trim().split(/[\s\-]+/);
    const ordA = parseGradeOrder(partsA[0]);
    const ordB = parseGradeOrder(partsB[0]);
    if (ordA !== ordB) {
      return ordA - ordB;
    }
    return a.localeCompare(b);
  });
}

