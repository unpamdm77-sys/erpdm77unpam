export type UnitType = 'pcs' | 'gr' | 'kg' | 'ml' | 'liter' | 'lembar' | 'pack' | 'porsi' | 'botol';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  unit: UnitType;
  minStock: number;
  costPerUnit: number; // Harga beli rata-rata per satuan
  supplier?: string;
  lastUpdated: string;
}

export interface RecipeIngredient {
  materialId: string;
  qty: number; // e.g. 4 pcs dimsum, 25 gr saus mentai, 1 pcs mika
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  category: string; // Kategori utama (backward-compatible)
  categories?: string[]; // Daftar multi-kategori (satu menu bisa banyak kategori)
  price: number;
  description: string;
  recipe: RecipeIngredient[];
  image?: string;
  isAvailable: boolean;
}

export const getMenuItemCategories = (item: { category?: string; categories?: string[] }): string[] => {
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories.filter(Boolean);
  }
  return item.category ? [item.category] : [];
};

export interface CartItem {
  menuItem: MenuItem;
  qty: number;
  notes?: string;
  calculatedHpp: number; // Calculated at time of sale
}

export type PaymentMethod = string;

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  hppPerUnit: number;
  totalHpp: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  date: string; // ISO string
  customer: string;
  orderType: 'Dine In' | 'Take Away' | 'Online Grab/Gojek';
  tableNo?: string;
  paymentMethod: PaymentMethod;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashReceived?: number;
  change?: number;
  totalHpp: number;
  grossProfit: number;
  status: 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  cashierName: string;
  syncedToGoogleSheet?: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplier: string;
  materialId: string;
  materialName: string;
  qty: number;
  unit: UnitType;
  unitPrice: number;
  total: number;
  paymentStatus: 'LUNAS' | 'HUTANG';
  notes?: string;
  syncedToGoogleSheet?: boolean;
}

export interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  name: string;
  category: 'Operasional' | 'Sewa Tempat' | 'Gaji Pegawai' | 'Listrik & Air' | 'Gas LPG' | 'Marketing' | 'Kebersihan' | 'Lainnya';
  amount: number;
  notes?: string;
  syncedToGoogleSheet?: boolean;
}

export interface StockAdjustment {
  id: string;
  date: string;
  materialId: string;
  materialName: string;
  unit: UnitType;
  systemStock: number;
  actualStock: number;
  difference: number;
  reason: 'Barang Rusak / Basi' | 'Tumpah / Waste Masak' | 'Selisih Hitung / Opname' | 'Kadaluarsa (Expired)' | 'Tester / Konsumsi' | 'Koreksi Lainnya';
  lossCost: number; // difference * costPerUnit
  adjustedBy: string;
}

export interface ParkedOrder {
  id: string;
  timestamp: string;
  label: string; // e.g. "Meja 03 - Kak Rina" or "Take Away 1"
  customer: string;
  orderType: 'Dine In' | 'Take Away' | 'Online Grab/Gojek';
  tableNo?: string;
  cart: CartItem[];
  discount: number;
  total: number;
}

export interface ShiftSummary {
  cashierName: string;
  startTime: string;
  totalTransactions: number;
  grossSales: number;
  totalDiscounts: number;
  netSales: number;
  cashSales: number;
  qrisSales: number;
  transferSales: number;
  debitSales: number;
  totalHpp: number;
  grossProfit: number;
}

export interface SalesTarget {
  daily: number;
  weekly: number;
  monthly: number;
}

export type UserRole = 'OWNER' | 'SUPERVISOR' | 'FINANCE' | 'STAFF';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string;
  address: string;
  joinDate: string;
  isActive: boolean;
}

export interface ERPConfig {
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
  cashierName: string;
  googleWebAppUrl?: string;
  autoSyncGoogleSheet: boolean;
  paperSize: '58mm' | '80mm';
  qrisPayload?: string;
  soundEnabled: boolean;
}
