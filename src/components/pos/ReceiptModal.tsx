import React, { useRef } from 'react';
import { Transaction, ERPConfig } from '../../types/erp';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { Printer, Copy, Check, X, Share2 } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  config: ERPConfig;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  config,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [showPhoneInput, setShowPhoneInput] = React.useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getReceiptText = () => {
    return `
================================
     ${config.storeName}
${config.storeAddress}
Telp: ${config.storePhone}
================================
No. Struk : ${transaction.invoiceNo}
Tanggal   : ${formatDateTime(transaction.date)}
Kasir     : ${transaction.cashierName}
Pelanggan : ${transaction.customer} (${transaction.orderType}${transaction.tableNo ? ' - ' + transaction.tableNo : ''})
Metode    : ${transaction.paymentMethod}
--------------------------------
${transaction.items
  .map(
    item =>
      `${item.name}\n  ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}${item.notes ? ' (' + item.notes + ')' : ''}`
  )
  .join('\n')}
--------------------------------
Subtotal : ${formatRupiah(transaction.subtotal)}
Diskon   : ${formatRupiah(transaction.discount)}
TOTAL    : ${formatRupiah(transaction.total)}
${transaction.paymentMethod === 'TUNAI' ? `Bayar    : ${formatRupiah(transaction.cashReceived || transaction.total)}\nKembali  : ${formatRupiah(transaction.change || 0)}` : ''}
================================
Terima kasih telah jajan di
${config.storeName}!
================================
    `.trim();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWA = () => {
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const receiptText = getReceiptText();
    const encoded = encodeURIComponent(`*STRUK DIGITAL ${config.storeName}*\n\n${receiptText}\n\nTerima kasih atas kunjungannya! 🙏`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h3 className="font-bold text-base tracking-wide">Struk Pembayaran Sukses</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-100 hover:text-white hover:bg-red-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div className="p-5 max-h-[70vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="bg-white text-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 w-full max-w-xs font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <img
                src="/assets/aistudio/logo_dm77_d20d4c54.png"
                alt="Dimsum Mentai 77 Logo"
                className="w-14 h-14 mx-auto object-contain mb-2 drop-shadow-xs"
              />
              <h2 className="font-extrabold text-sm text-slate-900 tracking-wider">
                {config.storeName}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{config.storeTagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{config.storeAddress}</p>
              <p className="text-[10px] text-slate-500">WA: {config.storePhone}</p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-semibold">{transaction.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDateTime(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{transaction.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis:</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                  {transaction.orderType} {transaction.tableNo ? `(${transaction.tableNo})` : ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>
                      {item.qty} x {formatRupiah(item.price)}
                    </span>
                    {item.notes && <span className="italic text-amber-600">*{item.notes}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon Promo</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AKHIR</span>
                <span className="text-amber-600">{formatRupiah(transaction.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Metode Bayar</span>
                <span className="font-semibold uppercase">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === 'TUNAI' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Diterima</span>
                    <span>{formatRupiah(transaction.cashReceived || transaction.total)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Kembalian</span>
                    <span>{formatRupiah(transaction.change || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Terima kasih atas pesanan Anda!</p>
              <p>Dimsum Mentai Gurih & Fresh Setiap Hari</p>
              <p className="text-[9px] text-slate-400">--- Simpan struk ini sebagai bukti transaksi ---</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Drawer */}
        {showPhoneInput && (
          <div className="p-3 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2">
            <input
              type="tel"
              placeholder="Nomor WA Pelanggan (0812...)"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-white focus:outline-none"
            />
            <button
              onClick={handleShareWA}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Share2 size={13} />
              <span>Kirim Sekarang</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleCopyText}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>
          <button
            onClick={() => setShowPhoneInput(!showPhoneInput)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            <Share2 size={14} />
            <span>Kirim WA Pelanggan</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak Thermal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
