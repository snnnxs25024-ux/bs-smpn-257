import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  Download,
  Users,
  Search,
  Edit2,
  Filter
} from 'lucide-react';
import Papa from 'papaparse';

const DEFAULT_MEMBERS = [
  'Lintang',
  'Calysta',
  'Kamil',
  'Bunga',
  'Rasya',
  'Fatih',
  'Adiba',
  'Nadia',
  'Nafisa',
  'Dara',
  'Raina',
  'Rega',
  'Adli',
  'Buket',
  'Gendis',
  'Zammy',
  'Wildan'
];

const MONTH_COLUMNS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const YEARS = ['2024', '2025', '2026', '2027'];

export default function CashTableCard() {
  const { 
    cashRecords, 
    toggleCashPayment, 
    addCashMember, 
    deleteCashMember, 
    updateCashMemberClass,
    updateCashMemberName 
  } = useAppStore();

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline editing state for Class and Name
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editClassValue, setEditClassValue] = useState<string>('');
  const [editNameValue, setEditNameValue] = useState<string>('');

  // Add Member Modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newClassId, setNewClassId] = useState('');

  // Combine default members with saved cash records
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, { parentName: string; classId: string }>();

    // 1. First populate the default 17 requested members
    DEFAULT_MEMBERS.forEach(name => {
      memberMap.set(name.toLowerCase(), {
        parentName: name,
        classId: '7 A' // default initial class, can be edited manually
      });
    });

    // 2. Override / enrich from cashRecords in storage
    cashRecords.forEach(r => {
      if (!r.parentName) return;
      const key = r.parentName.trim().toLowerCase();
      memberMap.set(key, {
        parentName: r.parentName.trim(),
        classId: r.classId ? r.classId.trim().toUpperCase() : '7 A'
      });
    });

    return Array.from(memberMap.values());
  }, [cashRecords]);

  // Available classes for filtering
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    allMembers.forEach(m => {
      if (m.classId) set.add(m.classId);
    });
    return Array.from(set).sort();
  }, [allMembers]);

  // Filtered members by class and search query
  const filteredMembers = useMemo(() => {
    let list = allMembers;

    if (selectedClassFilter !== 'SEMUA') {
      list = list.filter(m => m.classId === selectedClassFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.parentName.toLowerCase().includes(q) || 
        m.classId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMembers, selectedClassFilter, searchQuery]);

  // Check payment status helper
  const isPaid = (parentName: string, classId: string, month: string) => {
    return cashRecords.some(r => 
      r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase() &&
      r.classId === classId &&
      r.month === month &&
      r.year === selectedYear &&
      r.paid
    );
  };

  // Stats calculation
  const stats = useMemo(() => {
    let totalPaidChecks = 0;
    const totalPotential = filteredMembers.length * 12;

    filteredMembers.forEach(m => {
      MONTH_COLUMNS.forEach(month => {
        if (isPaid(m.parentName, m.classId, month)) {
          totalPaidChecks += 1;
        }
      });
    });

    return {
      totalPaidChecks,
      totalPotential,
      percent: totalPotential > 0 ? Math.round((totalPaidChecks / totalPotential) * 100) : 0
    };
  }, [filteredMembers, cashRecords, selectedYear]);

  // Start Editing inline
  const handleStartEdit = (m: { parentName: string; classId: string }) => {
    setEditingKey(`${m.parentName}___${m.classId}`);
    setEditNameValue(m.parentName);
    setEditClassValue(m.classId);
  };

  // Save Inline Edit
  const handleSaveEdit = (oldParentName: string, oldClassId: string) => {
    if (!editClassValue.trim() && !editNameValue.trim()) return;

    if (editNameValue.trim() && editNameValue.trim() !== oldParentName) {
      updateCashMemberName(oldParentName, editNameValue.trim(), oldClassId);
    }

    if (editClassValue.trim() && editClassValue.trim().toUpperCase() !== oldClassId) {
      updateCashMemberClass(editNameValue.trim() || oldParentName, oldClassId, editClassValue.trim().toUpperCase());
    }

    setEditingKey(null);
  };

  // Handle Add Member Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName.trim()) return;
    const targetClass = newClassId.trim().toUpperCase() || '7 A';

    addCashMember(newParentName.trim(), targetClass);
    setNewParentName('');
    setNewClassId('');
    setShowAddForm(false);
  };

  // Export to CSV (Excel format)
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;

    const data = filteredMembers.map((m, idx) => {
      const row: Record<string, any> = {
        'NO': idx + 1,
        'NAMA WALI MURID': m.parentName,
        'KELAS': m.classId,
      };

      let paidCount = 0;
      MONTH_COLUMNS.forEach(month => {
        const paid = isPaid(m.parentName, m.classId, month);
        row[month.toUpperCase()] = paid ? 'LUNAS' : '-';
        if (paid) paidCount++;
      });

      row['TOTAL BULAN LUNAS'] = paidCount;
      return row;
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rekap_uang_kas_${selectedClassFilter}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all">
      {/* Header Card */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/40 via-white to-blue-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Tabel Uang Kas Wali Murid
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Format Excel
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Kelola nama wali murid dan kelas secara manual, serta pantau setoran bulanan langsung di tabel.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#172D51] text-white hover:bg-[#34456D] shadow-sm transition-colors"
            >
              <Plus size={16} />
              Tambah Wali Murid
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              title="Unduh file Excel (CSV)"
            >
              <Download size={16} />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-4 pt-4 border-t border-gray-100/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[260px]">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-xs">
              <Filter size={15} className="text-[#172D51]" />
              <span className="text-xs font-medium text-gray-600">Filter Kelas:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs sm:text-sm font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="SEMUA">Semua Kelas ({allMembers.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-xs">
              <Calendar size={15} className="text-[#172D51]" />
              <span className="text-xs font-medium text-gray-600">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs sm:text-sm font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[150px] max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama wali murid..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172D51] text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-1.5 text-xs text-emerald-900 font-semibold">
            <span>Tercentang:</span>
            <span className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
              {stats.totalPaidChecks} Bulan
            </span>
          </div>
        </div>

        {/* Collapsible Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-end gap-3 animate-fade-in">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Nama Wali Murid <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
                placeholder="Misal: Bpk. Ahmad"
                className="w-full text-xs rounded-md border-gray-300 py-1.5 px-2.5 shadow-sm border focus:ring-1 focus:ring-[#172D51] focus:outline-none bg-white"
              />
            </div>
            <div className="w-40">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Kelas (Isi Manual) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newClassId}
                onChange={(e) => setNewClassId(e.target.value)}
                placeholder="Misal: 7 A, 8 B"
                className="w-full text-xs rounded-md border-gray-300 py-1.5 px-2.5 shadow-sm border focus:ring-1 focus:ring-[#172D51] focus:outline-none bg-white font-medium uppercase"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Spreadsheet / Excel Matrix Table */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs font-sans">
          {/* Header Rows */}
          <thead className="bg-[#172D51] text-white sticky top-0 z-20 shadow-sm select-none">
            <tr className="divide-x divide-[#233f6e]">
              <th scope="col" className="px-3 py-3 font-bold text-center w-12 tracking-wider">
                NO
              </th>
              <th scope="col" className="px-4 py-3 font-bold min-w-[180px] tracking-wider">
                NAMA WALI MURID
              </th>
              <th scope="col" className="px-3 py-3 font-bold text-center w-28 tracking-wider">
                KELAS
              </th>
              {SHORT_MONTHS.map((mShort, idx) => (
                <th 
                  key={mShort} 
                  scope="col" 
                  className="px-2 py-3 font-bold text-center w-14 sm:w-16 tracking-wider bg-[#1b345d]"
                  title={MONTH_COLUMNS[idx]}
                >
                  {mShort.toUpperCase()}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 font-bold text-center w-16 bg-[#F6B23D] text-gray-900 tracking-wider">
                TOTAL
              </th>
              <th scope="col" className="px-2 py-3 font-medium text-center w-16 text-gray-300">
                AKSI
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={17} className="text-center py-12 px-4 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Tidak ada wali murid yang sesuai filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((m, index) => {
                let paidMonthsCount = 0;
                const isEditing = editingKey === `${m.parentName}___${m.classId}`;

                return (
                  <tr 
                    key={`${m.parentName}-${m.classId}`} 
                    className="hover:bg-blue-50/40 transition-colors divide-x divide-gray-100 group"
                  >
                    {/* Index */}
                    <td className="px-3 py-2 text-center text-gray-500 font-mono text-[11px] bg-gray-50/50">
                      {index + 1}
                    </td>

                    {/* Nama Wali Murid */}
                    <td className="px-4 py-2 font-bold text-gray-900 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-[#172D51] rounded bg-white font-bold"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span>{m.parentName}</span>
                        </div>
                      )}
                    </td>

                    {/* Kelas (Editable secara manual) */}
                    <td className="px-2 py-1 text-center font-semibold text-gray-700 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={editClassValue}
                            onChange={(e) => setEditClassValue(e.target.value)}
                            placeholder="KLS"
                            className="w-16 text-center text-xs px-1.5 py-1 border border-[#172D51] rounded bg-white font-bold uppercase"
                          />
                          <button
                            onClick={() => handleSaveEdit(m.parentName, m.classId)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Simpan"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                            title="Batal"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleStartEdit(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 hover:bg-blue-100 text-gray-800 text-[11px] cursor-pointer transition-colors"
                          title="Klik untuk ubah kelas"
                        >
                          {m.classId}
                          <Edit2 size={10} className="text-gray-400 group-hover:text-blue-600" />
                        </span>
                      )}
                    </td>

                    {/* Month Checkboxes (Jan - Des) */}
                    {MONTH_COLUMNS.map((month) => {
                      const paid = isPaid(m.parentName, m.classId, month);
                      if (paid) paidMonthsCount += 1;

                      return (
                        <td 
                          key={month}
                          onClick={() => toggleCashPayment(m.parentName, undefined, m.classId, month, selectedYear)}
                          className={`px-1.5 py-1 text-center cursor-pointer select-none transition-all ${
                            paid 
                              ? 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700' 
                              : 'hover:bg-gray-100/80 text-gray-300'
                          }`}
                          title={`Klik untuk ubah status ${m.parentName} (${m.classId}) - ${month} ${selectedYear}`}
                        >
                          <div className="flex items-center justify-center">
                            {paid ? (
                              <div className="h-6 w-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <Check size={14} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-md border border-gray-300 bg-white hover:border-gray-400 flex items-center justify-center group-hover:border-[#172D51]/40">
                                <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100">•</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Months Paid */}
                    <td className="px-2 py-2 text-center font-bold text-gray-900 bg-amber-50/60 font-mono text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded ${
                        paidMonthsCount === 12 
                          ? 'bg-emerald-600 text-white' 
                          : paidMonthsCount > 0 
                            ? 'bg-[#F6B23D]/20 text-gray-900 font-bold' 
                            : 'text-gray-400'
                      }`}>
                        {paidMonthsCount}/12
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit nama / kelas"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus ${m.parentName} dari tabel uang kas?`)) {
                              deleteCashMember(m.parentName, m.classId);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus baris ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Summary Row */}
          {filteredMembers.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-800 sticky bottom-0 z-10 select-none shadow-xs">
              <tr className="divide-x divide-gray-200">
                <td colSpan={2} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs">
                  TOTAL SETORAN:
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">
                  {filteredMembers.length} Orang
                </td>
                {MONTH_COLUMNS.map((month) => {
                  const monthTotal = filteredMembers.filter(m => isPaid(m.parentName, m.classId, month)).length;
                  return (
                    <td key={month} className="px-1.5 py-2 text-center text-[11px] font-mono">
                      <span className={monthTotal > 0 ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                        {monthTotal}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center bg-[#F6B23D]/30 text-gray-900 font-mono text-xs">
                  {stats.totalPaidChecks}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Table Legend and Notes */}
      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-emerald-600 text-white flex items-center justify-center">
              <Check size={11} strokeWidth={3} />
            </div>
            <span className="font-medium text-gray-700">Sudah Bayar Kas (Lunas)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-gray-300 bg-white"></div>
            <span className="text-gray-500">Belum Bayar (Klik kotak untuk mencentang)</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Edit2 size={12} className="text-blue-500" />
            <span>Klik badge kelas untuk edit kelas secara manual</span>
          </div>
        </div>

        <div className="text-gray-500 italic">
          * Data otomatis tersimpan dan dapat diekspor ke Excel (CSV).
        </div>
      </div>
    </div>
  );
}
