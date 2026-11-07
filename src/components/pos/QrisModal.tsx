import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../utils/formatters';
import { QrCode, CheckCircle2, X, RefreshCw } from 'lucide-react';

interface QrisModalProps {
  totalAmount: number;
  customerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QrisModal: React.FC<QrisModalProps> = ({
  totalAmount,
  customerName,
  onConfirm,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 mins timer
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onConfirm();
    }, 1200);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="text-white" size={20} />
            <h3 className="font-bold text-sm tracking-wide">Pembayaran QRIS Dinamis</h3>
          </div>
          <button onClick={onCancel} className="text-red-100 hover:text-white p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          {/* QRIS Header Graphic */}
          <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 shadow-2xs">
            <div className="flex items-center justify-center space-x-2">
              <span className="font-black text-rose-600 text-xs tracking-widest">QRIS</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Standar Pembayaran Nasional</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">DIMSUM MENTAI 77 UNPAM</p>
            <p className="text-[10px] text-slate-400">NMID: ID1020087711202</p>
          </div>

          {/* QR Code Illustration */}
          <div className="flex justify-center">
            <div className="p-3 bg-white border-2 border-dashed border-red-300 rounded-2xl shadow-inner relative group">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226580016ID.CO.DIMSUM77520458125303360540${totalAmount}5802ID5919DIMSUM MENTAI 776013TANGSEL6304`}
                alt="QRIS Payment"
                className="w-44 h-44 object-contain"
                onError={(e) => {
                  // Fallback SVG if external image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition bg-white/70">
                <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded shadow">Scan via BCA / GoPay / OVO / Dana / ShopeePay</span>
              </div>
            </div>
          </div>

          {/* Tagihan Info */}
          <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3">
            <p className="text-xs text-slate-600 font-medium">Total Nominal Tagihan</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{formatRupiah(totalAmount)}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Pelanggan: <span className="font-semibold text-slate-700">{customerName}</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center space-x-1">
            <span>Masa berlaku QR:</span>
            <span className="font-bold text-rose-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </p>

          {/* Simulation button */}
          <button
            onClick={handleSimulatePayment}
            disabled={isVerifying}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Memverifikasi Notifikasi Bank...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Konfirmasi Pembayaran Masuk</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
