import React from 'react';
import { useERP } from '../../context/ERPContext';
import { formatRupiah, formatDateTime, formatNumber } from '../../utils/formatters';
import { Printer, X, Banknote, QrCode, CreditCard, ShieldCheck, DollarSign } from 'lucide-react';

interface ShiftSummaryModalProps {
  onClose: () => void;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({ onClose }) => {
  const { getShiftSummary, config } = useERP();
  const summary = getShiftSummary();

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-amber-400" size={20} />
            <div>
              <h3 className="font-bold text-base">Rekap Shift Kasir (X-Reading)</h3>
              <p className="text-[11px] text-slate-400">{config.storeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto bg-slate-50">
          {/* Header Info */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Petugas Kasir:</span>
              <span className="font-bold text-slate-900">{summary.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Audit:</span>
              <span className="font-semibold">{formatDateTime(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Transaksi Selesai:</span>
              <span className="font-black text-amber-600">{formatNumber(summary.totalTransactions)} Nota</span>
            </div>
          </div>

          {/* Money in Drawer highlight */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <p className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
              Total Fisik Uang Tunai di Laci (Cash In Drawer)
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatRupiah(summary.cashSales)}
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Wajib dicocokkan dengan uang fisik kasir</p>
          </div>

          {/* Non-Cash Breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Rincian Metode Pembayaran
            </p>
            <div className="space-y-1.5 divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Banknote size={14} className="text-emerald-600" />
                  <span>Tunai (Cash):</span>
                </span>
                <span className="font-black text-slate-900">{formatRupiah(summary.cashSales)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <QrCode size={14} className="text-amber-600" />
                  <span>QRIS Dinamis:</span>
                </span>
                <span className="font-black text-slate-900">{formatRupiah(summary.qrisSales)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <CreditCard size={14} className="text-purple-600" />
                  <span>Transfer Bank:</span>
                </span>
                <span className="font-black text-slate-900">{formatRupiah(summary.transferSales)}</span>
              </div>
            </div>
          </div>

          {/* Revenue & Profit */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Penjualan Kotor (Gross):</span>
              <span>{formatRupiah(summary.grossSales)}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Total Diskon Diberikan:</span>
              <span>-{formatRupiah(summary.totalDiscounts)}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Penjualan Bersih:</span>
              <span className="text-amber-600">{formatRupiah(summary.netSales)}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>HPP Bahan Baku (BOM):</span>
              <span>-{formatRupiah(summary.totalHpp)}</span>
            </div>
            <div className="flex justify-between font-black text-emerald-700 bg-emerald-50/70 p-2 rounded-xl">
              <span>Estimasi Laba Kotor Shift:</span>
              <span>{formatRupiah(summary.grossProfit)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrintSummary}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow-sm"
            >
              <Printer size={15} />
              <span>Cetak Rekap Shift</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
