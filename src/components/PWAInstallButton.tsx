import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, X, Share2, PlusSquare } from 'lucide-react';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Do not show anything if the app is already installed/running standalone
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-[#172D51] hover:bg-[#34456D] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
      >
        <Download size={14} />
        Install Aplikasi
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#172D51] hover:bg-[#34456D] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
        >
          <Download size={14} />
          Pasang Aplikasi
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Pasang di iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4 py-2">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ikuti langkah mudah di bawah ini untuk menambahkan aplikasi ke Layar Utama Anda:
                </p>
                
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="bg-white p-2 rounded-lg border border-gray-150 shadow-sm shrink-0">
                    <Share2 size={18} className="text-[#172D51]" />
                  </div>
                  <div className="text-xs text-gray-600 leading-normal">
                    <span className="font-bold text-gray-900 block mb-0.5">Langkah 1</span>
                    Tekan tombol <strong className="text-[#172D51]">Bagikan (Share)</strong> di bagian bawah menu Safari Anda.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="bg-white p-2 rounded-lg border border-gray-150 shadow-sm shrink-0">
                    <PlusSquare size={18} className="text-[#172D51]" />
                  </div>
                  <div className="text-xs text-gray-600 leading-normal">
                    <span className="font-bold text-gray-900 block mb-0.5">Langkah 2</span>
                    Gulir ke bawah lalu pilih menu <strong className="text-[#172D51]">Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#172D51] py-2.5 text-sm font-semibold text-white hover:bg-[#34456D] transition"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
