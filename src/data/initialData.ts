import { Material, MenuItem, PurchaseOrder, Expense, Transaction, ERPConfig, UserAccount, SalesTarget } from '../types/erp';

export const INITIAL_CONFIG: ERPConfig = {
  storeName: 'DIMSUM MENTAI 77 UNPAM',
  storeTagline: 'Outlet Dimsum Mentai 77 UNPAM (Universitas Pamulang)',
  storeAddress: 'Jl. Pamulang Permai 1, Samping Gapura, Kec. Pamulang, Kota Tangerang Selatan, Banten 15417',
  storePhone: '0819-9645-1323',
  cashierName: 'Kasir Shift 1 (Rian)',
  googleWebAppUrl: '',
  autoSyncGoogleSheet: false,
  paperSize: '58mm',
  qrisPayload: '00020101021226600016ID.CO.DIMSUM77.WWW011893600999012345678902150000000000000015204581253033605802ID5919DIMSUM MENTAI 77 UNPAM6013TANGSEL61051541762070703A016304ABCD',
  soundEnabled: true,
};

export const DEFAULT_SALES_TARGET: SalesTarget = {
  daily: 1500000,
  weekly: 10000000,
  monthly: 45000000,
};

export const DEFAULT_MENU_CATEGORIES: string[] = [
  'Dimsum Mentai',
  'Dimsum Goreng',
  'Dimsum Kukus',
  'Minuman',
  'Frozen Pack',
  'Extra Topping'
];

export const DEFAULT_MATERIAL_CATEGORIES: string[] = [
  'Daging & Isian',
  'Saus & Bumbu',
  'Topping & Keju',
  'Kemasan & Alat',
  'Bahan Minuman',
  'Lainnya'
];

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'TUNAI',
  'QRIS',
  'TRANSFER',
  'DEBIT'
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'owner77',
    password: 'owner123',
    name: 'Haji Rahmat (Pemilik Usaha)',
    role: 'OWNER',
    phone: '0812-9988-7711',
    address: 'Pamulang Permai Blok A No. 12',
    joinDate: '2026-01-01',
    isActive: true
  },
  {
    id: 'usr-2',
    username: 'spv_dimas',
    password: 'spv123',
    name: 'Dimas Prasetyo (Kepala Toko UNPAM)',
    role: 'SUPERVISOR',
    phone: '0857-1122-3344',
    address: 'Jl. Pamulang Permai 1, Tangerang Selatan',
    joinDate: '2026-02-15',
    isActive: true
  },
  {
    id: 'usr-3',
    username: 'finance_siti',
    password: 'fin123',
    name: 'Siti Nurhaliza (Admin Finance & Pajak)',
    role: 'FINANCE',
    phone: '0813-4455-6677',
    address: 'Reni Jaya Pamulang Barat',
    joinDate: '2026-03-01',
    isActive: true
  },
  {
    id: 'usr-4',
    username: 'staff_rian',
    password: 'staff123',
    name: 'Rian Kasir (Staff Frontliner)',
    role: 'STAFF',
    phone: '0896-7788-9900',
    address: 'Jl. Surya Kencana Pamulang',
    joinDate: '2026-05-10',
    isActive: true
  }
];

// All demo input data cleared as requested for live production
export const INITIAL_MATERIALS: Material[] = [];
export const INITIAL_MENU_ITEMS: MenuItem[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_PURCHASES: PurchaseOrder[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
