import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { MenuItem, PaymentMethod, Transaction, CartItem } from '../../types/erp';
import { formatRupiah } from '../../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import { QrisModal } from './QrisModal';
import { ShiftSummaryModal } from './ShiftSummaryModal';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Flame,
  Check,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
  FileText,
  BookmarkPlus,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = [
  'Semua',
  'Dimsum Mentai',
  'Dimsum Goreng',
  'Dimsum Kukus',
  'Minuman',
  'Frozen Pack',
  'Extra Topping'
];

const PEDAS_OPTIONS = ['Normal', 'Pedas Sedang', 'Extra Pedas'];
const TORCH_OPTIONS = ['Normal Melt', 'Extra Gosong Wangi', 'Tanpa Torch (Dingin)'];

const QUICK_TOPPINGS = [
  { name: 'Keju Mozzarella Melt', price: 5000 },
  { name: 'Extra Tobiko Orange', price: 4000 },
  { name: 'Extra Saus Mentai', price: 4000 },
  { name: 'Extra Chili Oil Botol', price: 4000 },
];

export const PosTab: React.FC = () => {
  const {
    menuItems,
    cart,
    addToCart,
    updateCartQty,
    updateCartNotes,
    removeCartItem,
    clearCart,
    customerName,
    setCustomerName,
    orderType,
    setOrderType,
    tableNo,
    setTableNo,
    discount,
    setDiscount,
    calculateMenuHpp,
    checkMenuStockAvailability,
    processCheckout,
    parkCurrentOrder,
    recallParkedOrder,
    deleteParkedOrder,
    parkedOrders,
    config,
    updateConfig,
    addQuickToppingToCartItem
  } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);

  // Modals & Panels
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('TUNAI');
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showParkedModal, setShowParkedModal] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (Enter, F1, F2, F4, F8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in customer name or notes input
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'F1' && !showCheckoutModal) {
        e.preventDefault();
        if (cart.length > 0) {
          setSelectedPayment('TUNAI');
          setCashAmount(cartTotal);
          setShowCheckoutModal(true);
        }
      } else if (e.key === 'F2' && !showCheckoutModal) {
        e.preventDefault();
        if (cart.length > 0) {
          setSelectedPayment('QRIS');
          setShowQrisModal(true);
        }
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F8' && !isInput) {
        e.preventDefault();
        handleParkOrder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filtered menu
  const filteredMenu = menuItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);
  const cartEstimatedHpp = cart.reduce((sum, item) => sum + item.calculatedHpp * item.qty, 0);
  const cartEstimatedProfit = cartTotal - cartEstimatedHpp;

  // Cash calculations
  const cashGiven = typeof cashAmount === 'number' ? cashAmount : 0;
  const changeDue = cashGiven >= cartTotal ? cashGiven - cartTotal : 0;

  const handleOpenCheckout = (method: PaymentMethod = 'TUNAI') => {
    if (cart.length === 0) return;
    setErrorMessage('');
    setSelectedPayment(method);
    setCashAmount(cartTotal); // Default to exact amount
    setShowCheckoutModal(true);
  };

  const handleExecutePayment = async (overridePayment?: PaymentMethod) => {
    const method = overridePayment || selectedPayment;

    if (method === 'TUNAI' && cashGiven < cartTotal) {
      setErrorMessage(`Uang tunai kurang ${formatRupiah(cartTotal - cashGiven)}!`);
      return;
    }

    try {
      setIsProcessing(true);
      const trx = await processCheckout(
        method,
        method === 'TUNAI' ? cashGiven : cartTotal
      );
      setIsProcessing(false);
      setShowCheckoutModal(false);
      setShowQrisModal(false);
      setCompletedTransaction(trx);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Gagal memproses transaksi.');
    }
  };

  const handleParkOrder = () => {
    if (cart.length === 0) return;
    const ok = parkCurrentOrder();
    if (ok) {
      alert('Pesanan berhasil diparkir / disimpan sementara!');
    }
  };

  // Add search by barcode or quick code Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMenu.length === 1) {
      const target = filteredMenu[0];
      const check = checkMenuStockAvailability(target);
      if (check.available) {
        addToCart(target);
        setSearch('');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 -m-4 md:-m-8 p-3 md:p-5 overflow-hidden bg-slate-100">
      {/* LEFT: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl p-4 shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Top bar with quick buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Kasir POS 77</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                UNPAM
              </span>
            </h2>

            {/* Shift Summary button */}
            <button
              onClick={() => setShowShiftModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Rekap Shift</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
              title={config.soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition text-xs"
            >
              {config.soundEnabled ? <Volume2 size={15} className="text-emerald-600" /> : <VolumeX size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari kode/nama (Enter)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 py-2.5 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
          {filteredMenu.map(item => {
            const stockCheck = checkMenuStockAvailability(item);
            const hpp = calculateMenuHpp(item);
            const grossMargin = item.price > 0 ? Math.round(((item.price - hpp) / item.price) * 100) : 0;
            const inCart = cart.find(c => c.menuItem.id === item.id);

            return (
              <div
                key={item.id}
                onClick={() => stockCheck.available && addToCart(item)}
                className={`relative group p-3.5 rounded-2xl border transition flex flex-col justify-between text-left ${
                  stockCheck.available
                    ? 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 mt-2 group-hover:text-amber-600 transition leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900">
                      {formatRupiah(item.price)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400">HPP: {formatRupiah(hpp)}</span>
                      <span className="text-emerald-600 font-bold">({grossMargin}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {inCart && (
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                        {inCart.qty}
                      </span>
                    )}
                    {stockCheck.available ? (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-xs transition"
                      >
                        <Plus size={16} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                        Habis
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock capacity badge */}
                <div className="mt-1.5 text-[10px] flex items-center justify-between text-slate-400">
                  <span>
                    {stockCheck.available ? (
                      <span className="text-emerald-700 font-semibold">
                        Siap: ~{stockCheck.maxPortions} porsi
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        Kurang: {stockCheck.missingIngredient}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Active Order */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-3xl p-4 md:p-5 shadow-xs border border-slate-200/80 shrink-0">
        {/* Cart Header with Parkir Order */}
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Pesanan Kasir</h3>
              <p className="text-[10px] text-slate-400">{cart.length} menu di keranjang</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Parked Orders button */}
            <button
              onClick={() => setShowParkedModal(true)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                parkedOrders.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Clock size={13} />
              <span>Draft</span>
              {parkedOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-black">
                  {parkedOrders.length}
                </span>
              )}
            </button>

            {cart.length > 0 && (
              <button
                onClick={handleParkOrder}
                title="Parkir Pesanan Ini (F8)"
                className="px-2 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-xl transition"
              >
                Parkir (F8)
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                title="Kosongkan (F4)"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-xl transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Customer & Order Type */}
        <div className="py-2.5 border-b border-slate-100 space-y-2">
          <div className="flex gap-1.5">
            {(['Dine In', 'Take Away', 'Online Grab/Gojek'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition ${
                  orderType === type
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'Online Grab/Gojek' ? 'Ojol' : type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan"
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {orderType === 'Dine In' ? (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Pilih Meja</label>
                <select
                  value={tableNo}
                  onChange={e => setTableNo(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Meja 01">Meja 01</option>
                  <option value="Meja 02">Meja 02</option>
                  <option value="Meja 03">Meja 03</option>
                  <option value="Meja 04">Meja 04</option>
                  <option value="Meja 05">Meja 05</option>
                  <option value="Area Lesehan">Area Lesehan</option>
                  <option value="Bar Kasir">Bar Kasir</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Petugas Kasir</label>
                <div className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 truncate border border-slate-100">
                  {config.cashierName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 min-h-[140px] pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-400">
              <Utensils size={32} className="text-slate-300 stroke-[1.5] mb-2" />
              <p className="text-xs font-bold text-slate-600">Keranjang Kosong</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pilih menu di sebelah kiri untuk menambah pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.menuItem.id}
                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <p className="font-bold text-xs text-slate-900 leading-snug">{item.menuItem.name}</p>
                    <p className="text-[11px] font-black text-amber-600">
                      {formatRupiah(item.menuItem.price * item.qty)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCartItem(item.menuItem.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Stepper & Note button */}
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    onClick={() =>
                      setActiveNotesId(activeNotesId === item.menuItem.id ? null : item.menuItem.id)
                    }
                    className="text-[10px] text-amber-700 hover:text-amber-900 underline font-semibold"
                  >
                    {item.notes ? `Catatan: ${item.notes}` : '+ Pedas & Topping'}
                  </button>

                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQty(item.menuItem.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.menuItem.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Expandable Quick Modifiers Drawer */}
                {activeNotesId === item.menuItem.id && (
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 space-y-2 animate-in fade-in duration-150">
                    {/* Level Pedas */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                        Tingkat Pedas:
                      </span>
                      <div className="flex gap-1">
                        {PEDAS_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const note = item.notes ? `${item.notes}, ${opt}` : opt;
                              updateCartNotes(item.menuItem.id, note);
                            }}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 hover:bg-amber-100 text-slate-700"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tingkat Torch */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                        Panggang Torch:
                      </span>
                      <div className="flex gap-1">
                        {TORCH_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const note = item.notes ? `${item.notes}, ${opt}` : opt;
                              updateCartNotes(item.menuItem.id, note);
                            }}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 hover:bg-amber-100 text-slate-700"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Extra Topping Quick Add */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                        + Tambah Topping Ekstra:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_TOPPINGS.map(top => (
                          <button
                            key={top.name}
                            type="button"
                            onClick={() => addQuickToppingToCartItem(item.menuItem.id, top.name, top.price)}
                            className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100"
                          >
                            +{top.name} ({formatRupiah(top.price)})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Notes input */}
                    <div>
                      <input
                        type="text"
                        defaultValue={item.notes || ''}
                        onBlur={e => updateCartNotes(item.menuItem.id, e.target.value)}
                        placeholder="Ketik catatan khusus..."
                        className="w-full text-[10px] px-2 py-1 rounded border border-slate-200 bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Discount & Totals Section */}
        <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
          {/* Quick discounts */}
          <div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Percent size={12} /> Diskon Pesanan
              </span>
              {discount > 0 && (
                <button onClick={() => setDiscount(0)} className="text-rose-600 font-bold hover:underline">
                  Hapus Diskon
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setDiscount(0)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border ${
                  discount === 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                0%
              </button>
              <button
                onClick={() => setDiscount(5000)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border ${
                  discount === 5000 ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                5rb
              </button>
              <button
                onClick={() => setDiscount(10000)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border ${
                  discount === 10000 ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                10rb
              </button>
              <button
                onClick={() => setDiscount(Math.round(cartSubtotal * 0.1))}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg border ${
                  discount === Math.round(cartSubtotal * 0.1) && discount > 0
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                UNPAM 10%
              </button>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Subtotal</span>
              <span>{formatRupiah(cartSubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold text-[11px]">
                <span>Diskon Promo</span>
                <span>-{formatRupiah(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
              <span className="font-extrabold text-xs text-slate-900">TOTAL BAYAR</span>
              <span className="font-black text-xl text-amber-600">{formatRupiah(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Est. Laba Kotor:</span>
              <span className="text-emerald-700 font-semibold">{formatRupiah(cartEstimatedProfit)}</span>
            </div>
          </div>

          {/* Fast Split Action Buttons: Tunai / QRIS */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOpenCheckout('TUNAI')}
              disabled={cart.length === 0}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm transition disabled:opacity-40 flex items-center justify-center space-x-1.5 text-xs"
            >
              <Banknote size={16} className="text-amber-400" />
              <span>Tunai (F1)</span>
            </button>

            <button
              onClick={() => {
                if (cart.length > 0) {
                  setSelectedPayment('QRIS');
                  setShowQrisModal(true);
                }
              }}
              disabled={cart.length === 0}
              className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-md transition disabled:opacity-40 flex items-center justify-center space-x-1.5 text-xs"
            >
              <QrCode size={16} />
              <span>QRIS (F2)</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAST CASH CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base tracking-wide">Penyelesaian Pembayaran</h3>
                <p className="text-[11px] text-slate-400">Pelanggan: {customerName}</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Total Display */}
              <div className="text-center p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Total Tagihan Kasir</p>
                <p className="text-3xl font-black text-slate-900 mt-0.5">{formatRupiah(cartTotal)}</p>
              </div>

              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {(['TUNAI', 'QRIS', 'TRANSFER'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setSelectedPayment(method);
                      if (method === 'QRIS') {
                        setShowCheckoutModal(false);
                        setShowQrisModal(true);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                      selectedPayment === method
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Tunai fields */}
              {selectedPayment === 'TUNAI' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Uang Tunai Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      autoFocus
                      value={cashAmount}
                      onChange={e => setCashAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xl font-black px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Fast Cash Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashAmount(cartTotal)}
                      className="py-1.5 px-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg text-center"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashAmount(val)}
                        className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg text-center"
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian Calculation */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-900">Uang Kembalian:</span>
                    <span className="text-lg font-black text-emerald-700">
                      {formatRupiah(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecutePayment()}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1"
                >
                  <Check size={16} />
                  <span>{isProcessing ? 'Memproses...' : 'Selesaikan & Cetak'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARKED ORDERS DRAWER MODAL */}
      {showParkedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="text-amber-400" size={18} />
                <h3 className="font-bold text-sm">Pesanan Tertunda / Parkir</h3>
              </div>
              <button onClick={() => setShowParkedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {parkedOrders.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  Tidak ada pesanan yang sedang diparkir saat ini.
                </p>
              ) : (
                parkedOrders.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{p.label}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.cart.length} item • {formatRupiah(p.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          recallParkedOrder(p.id);
                          setShowParkedModal(false);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                      >
                        Lanjutkan
                      </button>
                      <button
                        onClick={() => deleteParkedOrder(p.id)}
                        className="p-1 text-slate-300 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QRIS MODAL */}
      {showQrisModal && (
        <QrisModal
          totalAmount={cartTotal}
          customerName={customerName}
          onConfirm={() => handleExecutePayment('QRIS')}
          onCancel={() => setShowQrisModal(false)}
        />
      )}

      {/* SHIFT SUMMARY MODAL */}
      {showShiftModal && <ShiftSummaryModal onClose={() => setShowShiftModal(false)} />}

      {/* COMPLETED RECEIPT MODAL */}
      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          config={config}
          onClose={() => setCompletedTransaction(null)}
        />
      )}
    </div>
  );
};
