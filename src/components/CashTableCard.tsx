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
  Filter,
  DollarSign,
  Clock,
  FileDown,
  Loader2
} from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { showToast } from './NotificationToast';

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

const ALL_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHORT_ALL_MONTHS: Record<string, string> = {
  Januari: 'Jan',
  Februari: 'Feb',
  Maret: 'Mar',
  April: 'Apr',
  Mei: 'Mei',
  Juni: 'Jun',
  Juli: 'Jul',
  Agustus: 'Ags',
  September: 'Sep',
  Oktober: 'Okt',
  November: 'Nov',
  Desember: 'Des'
};

const YEARS = ['2026', '2027', '2028'];

interface PaymentModalState {
  isOpen: boolean;
  parentName: string;
  classId: string;
  month: string;
  year: string;
  paid: boolean;
  amount: number;
  paymentDate: string;
}

export default function CashTableCard() {
  const { 
    cashRecords, 
    setCashPaymentDetail, 
    addCashMember, 
    deleteCashMember, 
    updateCashMemberClass,
    updateCashMemberName 
  } = useAppStore();

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline editing state for Member (Name & Class)
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [editClassValue, setEditClassValue] = useState<string>('');

  // Add Member Modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParentName, setNewParentName] = useState('');
  const [newClassId, setNewClassId] = useState('');

  // Payment Recording Modal state (For Date & Amount)
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    isOpen: false,
    parentName: '',
    classId: '',
    month: '',
    year: '',
    paid: false,
    amount: 10000,
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // LOGIKA BULAN:
  // Untuk tahun 2026: dimulai dari Agustus (Agustus - Desember).
  // Untuk tahun 2027 ke atas: otomatis reset lengkap mulai Januari (Januari - Desember).
  const visibleMonths = useMemo(() => {
    const yearNum = parseInt(selectedYear, 10);
    if (!isNaN(yearNum) && yearNum <= 2026) {
      return ['Agustus', 'September', 'Oktober', 'November', 'Desember'];
    }
    return ALL_MONTHS;
  }, [selectedYear]);

  // Combine default 17 members with saved cash records
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, { parentName: string; classId: string }>();

    // 1. First populate the default 17 requested members
    DEFAULT_MEMBERS.forEach(name => {
      memberMap.set(name.toLowerCase(), {
        parentName: name,
        classId: '7 A'
      });
    });

    // 2. Enrich/override with saved records from store
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

  // Filtered members
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

  // Helper to get record info
  const getRecord = (parentName: string, classId: string, month: string) => {
    return cashRecords.find(r => 
      r.parentName.trim().toLowerCase() === parentName.trim().toLowerCase() &&
      r.classId === classId &&
      r.month === month &&
      r.year === selectedYear
    );
  };

  // Open Payment Detail Modal on Month Click
  const handleOpenPaymentModal = (parentName: string, classId: string, month: string) => {
    const record = getRecord(parentName, classId, month);
    const today = new Date().toISOString().split('T')[0];

    setPaymentModal({
      isOpen: true,
      parentName,
      classId,
      month,
      year: selectedYear,
      paid: record ? record.paid : true, // default checked when opening
      amount: record && record.amount ? record.amount : 10000,
      paymentDate: record && record.paymentDate ? record.paymentDate : today
    });
  };

  // Save Payment Detail
  const handleSavePaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    setCashPaymentDetail(
      paymentModal.parentName,
      paymentModal.classId,
      paymentModal.month,
      paymentModal.year,
      paymentModal.paid,
      Number(paymentModal.amount) || 0,
      paymentModal.paymentDate
    );
    setPaymentModal(prev => ({ ...prev, isOpen: false }));
  };

  // Stats calculation
  const stats = useMemo(() => {
    let totalPaidChecks = 0;
    let totalNominal = 0;
    const totalPotential = filteredMembers.length * visibleMonths.length;

    filteredMembers.forEach(m => {
      visibleMonths.forEach(month => {
        const rec = getRecord(m.parentName, m.classId, month);
        if (rec && rec.paid) {
          totalPaidChecks += 1;
          totalNominal += (rec.amount || 0);
        }
      });
    });

    return {
      totalPaidChecks,
      totalNominal,
      totalPotential,
      percent: totalPotential > 0 ? Math.round((totalPaidChecks / totalPotential) * 100) : 0
    };
  }, [filteredMembers, cashRecords, selectedYear, visibleMonths]);

  // Start Editing inline
  const handleStartEdit = (m: { parentName: string; classId: string }) => {
    setEditingKey(`${m.parentName}___${m.classId}`);
    setEditNameValue(m.parentName);
    setEditClassValue(m.classId);
  };

  // Save Inline Edit (Update Name & Class)
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

  // Handle Add Member Submit (Create)
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName.trim()) return;
    const targetClass = newClassId.trim().toUpperCase() || '7 A';

    addCashMember(newParentName.trim(), targetClass);
    setNewParentName('');
    setNewClassId('');
    setShowAddForm(false);
  };

  const printRef = React.useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Export to Professional Native Vector PDF (Not a screenshot/printscreen)
  const handleDownloadPDF = () => {
    if (filteredMembers.length === 0) {
      showToast('Tidak ada data untuk diunduh ke PDF.', 'info');
      return;
    }

    setIsExportingPdf(true);
    showToast('Membuat dokumen PDF resmi...', 'info');

    try {
      // Landscape A4: 297mm x 210mm
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const leftMargin = 14;
      const rightMargin = 14;
      const printableWidth = pageWidth - leftMargin - rightMargin;

      // 1. KOP SURAT RESMI SEKOLAH (Vector Typography & Rules)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', pageWidth / 2, 13, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('DINAS PENDIDIKAN', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(15);
      doc.setTextColor(23, 45, 81); // #172D51
      doc.text('SMP NEGERI 257 JAKARTA', pageWidth / 2, 24, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Jl. Balai Rakyat No. 49, Ciracas, Kota Jakarta Timur, DKI Jakarta • Telp: (021) 8710257', pageWidth / 2, 29, { align: 'center' });

      // Garis Ganda Kop Surat (Official Double Border)
      doc.setDrawColor(23, 45, 81);
      doc.setLineWidth(0.8);
      doc.line(leftMargin, 32, pageWidth - rightMargin, 32);

      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.25);
      doc.line(leftMargin, 33, pageWidth - rightMargin, 33);

      // 2. JUDUL DOKUMEN & METADATA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text('LAPORAN REKAPITULASI PEMBAYARAN UANG KAS KOMITE', pageWidth / 2, 40, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);

      const filterClassText = selectedClassFilter === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedClassFilter}`;
      doc.text(`Tahun Ajaran / Periode : ${selectedYear}`, leftMargin, 46);
      doc.text(`Filter Kelas : ${filterClassText}`, leftMargin + 80, 46);
      
      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Tanggal Cetak : ${printDateStr}`, pageWidth - rightMargin, 46, { align: 'right' });

      // 3. MENYUSUN DATA TABEL UNTUK AUTOTABLE
      // Header Kolom
      const headColumns = [
        'NO',
        'NAMA KOMITE',
        'KELAS',
        ...visibleMonths.map(m => (SHORT_ALL_MONTHS[m] || m).toUpperCase()),
        'TOTAL KAS'
      ];

      // Baris Data Body
      const bodyRows: any[][] = filteredMembers.map((m, idx) => {
        let memberTotal = 0;
        let lunasMonthsCount = 0;

        const monthCells = visibleMonths.map(month => {
          const rec = getRecord(m.parentName, m.classId, month);
          if (rec && rec.paid) {
            memberTotal += (rec.amount || 0);
            lunasMonthsCount++;
            const nominalFormatted = (rec.amount || 0) >= 1000 ? `${(rec.amount || 0) / 1000}k` : `${rec.amount || 0}`;
            return `LUNAS\n(Rp ${nominalFormatted})`;
          }
          return '-';
        });

        return [
          idx + 1,
          m.parentName,
          m.classId,
          ...monthCells,
          `Rp ${memberTotal.toLocaleString('id-ID')}\n(${lunasMonthsCount}/${visibleMonths.length} bln)`
        ];
      });

      // Baris Ringkasan Footer
      const footerCells: any[] = [
        { content: 'TOTAL KAS MASUK', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
      ];

      visibleMonths.forEach(month => {
        let monthTotal = 0;
        let count = 0;
        filteredMembers.forEach(m => {
          const rec = getRecord(m.parentName, m.classId, month);
          if (rec && rec.paid) {
            monthTotal += (rec.amount || 0);
            count++;
          }
        });

        footerCells.push({
          content: count > 0 ? `${count} Org\nRp ${(monthTotal / 1000)}k` : '-',
          styles: { halign: 'center', fontStyle: 'bold' }
        });
      });

      footerCells.push({
        content: `Rp ${stats.totalNominal.toLocaleString('id-ID')}`,
        styles: { halign: 'center', fontStyle: 'bold', fillColor: [246, 178, 61], textColor: [17, 24, 39] }
      });

      // 4. GENERATE AUTOTABLE DENGAN DESAIN RESMI BERSIH
      autoTable(doc, {
        head: [headColumns],
        body: bodyRows,
        foot: [footerCells],
        startY: 50,
        margin: { left: leftMargin, right: rightMargin },
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          valign: 'middle',
          font: 'helvetica',
          lineColor: [209, 213, 219], // #d1d5db
          lineWidth: 0.15
        },
        headStyles: {
          fillColor: [23, 45, 81], // #172D51
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        footStyles: {
          fillColor: [243, 244, 246],
          textColor: [17, 24, 39],
          fontSize: 7.5
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Zebra striping halus
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 }, // NO
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 42 }, // NAMA WALI
          2: { halign: 'center', cellWidth: 16 }, // KELAS
          // Bulan-bulan diatur center
          ...visibleMonths.reduce((acc: any, _, i) => {
            acc[3 + i] = { halign: 'center' };
            return acc;
          }, {}),
          [3 + visibleMonths.length]: { halign: 'center', fontStyle: 'bold', cellWidth: 30 } // TOTAL
        },
        didParseCell: (data) => {
          // Highlight lunas cell text color
          if (data.section === 'body' && typeof data.cell.raw === 'string' && data.cell.raw.includes('LUNAS')) {
            data.cell.styles.textColor = [4, 120, 87]; // Emerald dark
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // 5. BLOK TANDA TANGAN RESMI (SIGNATURE SECTION)
      const finalY = (doc as any).lastAutoTable.finalY || 160;
      let signatureY = finalY + 12;

      // Jika ruang tidak cukup di halaman yang sama, buat halaman baru untuk tanda tangan
      if (signatureY + 38 > 200) {
        doc.addPage();
        signatureY = 20;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      // Sisi Kiri: Wali Kelas
      doc.text('Mengetahui,', leftMargin + 25, signatureY, { align: 'center' });
      doc.text('Wali Kelas', leftMargin + 25, signatureY + 5, { align: 'center' });

      doc.line(leftMargin + 5, signatureY + 28, leftMargin + 45, signatureY + 28);
      doc.text('( ................................................ )', leftMargin + 25, signatureY + 33, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('NIP. ........................................', leftMargin + 25, signatureY + 37, { align: 'center' });

      // Sisi Kanan: Bendahara Kelas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const rightX = pageWidth - rightMargin - 30;
      doc.text(`Jakarta, ${printDateStr}`, rightX, signatureY, { align: 'center' });
      doc.text('Bendahara Kelas', rightX, signatureY + 5, { align: 'center' });

      doc.line(rightX - 20, signatureY + 28, rightX + 20, signatureY + 28);
      doc.text('( ................................................ )', rightX, signatureY + 33, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Pengelola Uang Kas', rightX, signatureY + 37, { align: 'center' });

      // 6. SIMPAN DOKUMEN PDF VEKTOR
      const cleanClass = selectedClassFilter.replace(/\s+/g, '_');
      const fileName = `Laporan_Uang_Kas_Komite_SMPN257_${cleanClass}_${selectedYear}.pdf`;
      doc.save(fileName);

      showToast('PDF resmi Uang Kas Komite berhasil diunduh!', 'success');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      showToast('Gagal membuat PDF: ' + (error.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;

    const data = filteredMembers.map((m, idx) => {
      const row: Record<string, any> = {
        'NO': idx + 1,
        'NAMA KOMITE': m.parentName,
        'KELAS': m.classId,
      };

      let paidCount = 0;
      let memberTotalAmount = 0;

      visibleMonths.forEach(month => {
        const rec = getRecord(m.parentName, m.classId, month);
        if (rec && rec.paid) {
          row[month.toUpperCase()] = `LUNAS (Rp ${rec.amount || 0} - ${rec.paymentDate || '-'})`;
          paidCount++;
          memberTotalAmount += (rec.amount || 0);
        } else {
          row[month.toUpperCase()] = '-';
        }
      });

      row['TOTAL BULAN LUNAS'] = paidCount;
      row['TOTAL NOMINAL (RP)'] = memberTotalAmount;
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
                  Tabel Uang Kas Komite
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  CRUD & Setoran
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Kelola nama anggota komite & kelas secara manual, catat tanggal bayar, nominal kas, dan pantau status bulanan.
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
              Tambah Anggota Komite
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-60"
              title="Unduh Lembar Rekap Uang Kas ke format PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Membuat PDF...
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  Download PDF
                </>
              )}
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
                  <option key={y} value={y}>{y} {y === '2026' ? '(Mulai Ags)' : '(Mulai Jan)'}</option>
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
                placeholder="Cari nama komite / kelas..."
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

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-1.5 text-xs text-emerald-900 font-semibold">
              <span>Lunas:</span>
              <span className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                {stats.totalPaidChecks} Bulan
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200/60 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-semibold">
              <span>Total Kas:</span>
              <span className="text-[#172D51] font-bold">
                Rp {stats.totalNominal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Add Form (Create) */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-end gap-3 animate-fade-in">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Nama Anggota Komite <span className="text-red-500">*</span>
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

      {/* Spreadsheet / Excel Matrix Table Container */}
      <div className="bg-white p-2 sm:p-4">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            {/* Header Rows */}
            <thead className="bg-[#172D51] text-white sticky top-0 z-20 shadow-sm select-none">
              <tr className="divide-x divide-[#233f6e]">
                <th scope="col" className="px-3 py-3 font-bold text-center w-12 tracking-wider">
                  NO
                </th>
                <th scope="col" className="px-4 py-3 font-bold min-w-[180px] tracking-wider">
                  NAMA KOMITE
                </th>
                <th scope="col" className="px-3 py-3 font-bold text-center w-24 tracking-wider">
                  KELAS
                </th>
              {visibleMonths.map((mName) => (
                <th 
                  key={mName} 
                  scope="col" 
                  className="px-2 py-3 font-bold text-center min-w-[70px] tracking-wider bg-[#1b345d]"
                  title={mName}
                >
                  {(SHORT_ALL_MONTHS[mName] || mName).toUpperCase()}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 font-bold text-center min-w-[80px] bg-[#F6B23D] text-gray-900 tracking-wider">
                TOTAL KAS
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
                <td colSpan={visibleMonths.length + 4} className="text-center py-12 px-4 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Tidak ada anggota komite yang sesuai filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((m, index) => {
                let paidMonthsCount = 0;
                let memberTotalAmount = 0;
                const isEditing = editingKey === `${m.parentName}___${m.classId}`;

                visibleMonths.forEach(month => {
                  const rec = getRecord(m.parentName, m.classId, month);
                  if (rec && rec.paid) {
                    paidMonthsCount++;
                    memberTotalAmount += (rec.amount || 0);
                  }
                });

                return (
                  <tr 
                    key={`${m.parentName}-${m.classId}`} 
                    className="hover:bg-blue-50/40 transition-colors divide-x divide-gray-100 group"
                  >
                    {/* Index */}
                    <td className="px-3 py-2 text-center text-gray-500 font-mono text-[11px] bg-gray-50/50">
                      {index + 1}
                    </td>

                    {/* Nama Wali Murid (Editable) */}
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
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
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
                          title="Klik untuk ubah nama / kelas"
                        >
                          {m.classId}
                          <Edit2 size={10} className="text-gray-400 group-hover:text-blue-600" />
                        </span>
                      )}
                    </td>

                    {/* Month Checkboxes & Details */}
                    {visibleMonths.map((month) => {
                      const rec = getRecord(m.parentName, m.classId, month);
                      const paid = rec ? rec.paid : false;
                      const dateStr = rec && rec.paymentDate ? rec.paymentDate : '';
                      const amt = rec && rec.amount ? rec.amount : 0;

                      return (
                        <td 
                          key={month}
                          onClick={() => handleOpenPaymentModal(m.parentName, m.classId, month)}
                          className={`px-1.5 py-1 text-center cursor-pointer select-none transition-all ${
                            paid 
                              ? 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700' 
                              : 'hover:bg-gray-100/80 text-gray-300'
                          }`}
                          title={paid ? `Lunas: Rp ${amt.toLocaleString('id-ID')} (${dateStr || 'Tanggal tidak diset'})\nKlik untuk ubah` : `Belum bayar. Klik untuk catat tanggal & nominal`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            {paid ? (
                              <>
                                <div className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                  <Check size={13} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-bold text-emerald-800 leading-none">
                                  {amt >= 1000 ? `${amt / 1000}k` : amt}
                                </span>
                              </>
                            ) : (
                              <div className="h-6 w-6 rounded border border-gray-300 bg-white hover:border-gray-400 flex items-center justify-center group-hover:border-[#172D51]/40">
                                <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100">+</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Kas Paid */}
                    <td className="px-2 py-2 text-center font-bold text-gray-900 bg-amber-50/60 font-mono text-xs whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-800 font-bold">
                          Rp {memberTotalAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {paidMonthsCount}/{visibleMonths.length} bln
                        </span>
                      </div>
                    </td>

                    {/* Actions: Edit & Delete */}
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
                            if (confirm(`Hapus ${m.parentName} (${m.classId}) dari daftar uang kas?`)) {
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
                {visibleMonths.map((month) => {
                  let monthCount = 0;
                  let monthAmount = 0;
                  filteredMembers.forEach(m => {
                    const rec = getRecord(m.parentName, m.classId, month);
                    if (rec && rec.paid) {
                      monthCount++;
                      monthAmount += (rec.amount || 0);
                    }
                  });

                  return (
                    <td key={month} className="px-1.5 py-2 text-center text-[10px] font-mono">
                      <div className="flex flex-col items-center">
                        <span className={monthCount > 0 ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                          {monthCount} org
                        </span>
                        {monthAmount > 0 && (
                          <span className="text-[9px] text-gray-500 font-normal">
                            {monthAmount >= 1000 ? `${monthAmount / 1000}k` : monthAmount}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center bg-[#F6B23D]/30 text-gray-900 font-mono text-xs whitespace-nowrap">
                  Rp {stats.totalNominal.toLocaleString('id-ID')}
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
              <span className="font-medium text-gray-700">Sudah Bayar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-gray-300 bg-white flex items-center justify-center text-[10px] text-gray-400">+</div>
              <span className="text-gray-500">Belum Bayar</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="font-semibold text-gray-700">Bank Sampah & Uang Kas SMPN 257 Jakarta</span>
            </div>
          </div>

          <div className="text-gray-500 italic">
            {selectedYear === '2026' 
              ? '* Tahun 2026: Kolom bulan dimulai dari Agustus (Ags-Des).' 
              : `* Tahun ${selectedYear}: Kolom bulan otomatis lengkap mulai Januari (Jan-Des).`}
          </div>
        </div>
      </div>

      {/* MODAL PENCATATAN PEMBAYARAN KAS (TANGGAL & NOMINAL) */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#172D51] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-400" />
                  Setoran Kas - {paymentModal.month} {paymentModal.year}
                </h4>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  {paymentModal.parentName} ({paymentModal.classId})
                </p>
              </div>
              <button 
                onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePaymentModal} className="p-5 space-y-4">
              {/* Checkbox Status */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  id="paidCheckbox"
                  checked={paymentModal.paid}
                  onChange={(e) => setPaymentModal(prev => ({ ...prev, paid: e.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="paidCheckbox" className="text-xs font-bold text-gray-800 cursor-pointer select-none">
                  Tandai Lunas untuk Bulan {paymentModal.month}
                </label>
              </div>

              {paymentModal.paid && (
                <>
                  {/* Nominal Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-600" />
                      Nominal Pembayaran (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      required
                      value={paymentModal.amount}
                      onChange={(e) => setPaymentModal(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder="10000"
                      className="w-full text-sm font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#172D51] focus:outline-none"
                    />
                    <div className="flex gap-2 mt-1.5">
                      {[5000, 10000, 20000, 50000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPaymentModal(prev => ({ ...prev, amount: amt }))}
                          className="text-[10px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 transition-colors"
                        >
                          {(amt / 1000)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tanggal Bayar Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#172D51]" />
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentModal.paymentDate}
                      onChange={(e) => setPaymentModal(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#172D51] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
