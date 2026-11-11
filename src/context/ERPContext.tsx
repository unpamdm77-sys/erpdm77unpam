import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Material,
  MenuItem,
  CartItem,
  Transaction,
  PurchaseOrder,
  Expense,
  StockAdjustment,
  StockRequest,
  DailyStockCheck,
  DailyStockCheckItem,
  ERPConfig,
  PaymentMethod,
  ParkedOrder,
  ShiftSummary,
  UserAccount,
  UserRole,
  SalesTarget
} from '../types/erp';
import { mapRowsToBOM } from '../utils/excelExportImport';
import {
  INITIAL_MATERIALS,
  INITIAL_MENU_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_CONFIG,
  INITIAL_USERS,
  DEFAULT_SALES_TARGET,
  DEFAULT_MENU_CATEGORIES,
  DEFAULT_MATERIAL_CATEGORIES,
  DEFAULT_PAYMENT_METHODS
} from '../data/initialData';
import { posSound } from '../utils/formatters';
import { User as FirebaseUser } from 'firebase/auth';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken
} from '../services/googleAuth';
import {
  findErpSpreadsheetOnDrive,
  createErpSpreadsheetOnDrive,
  fetchAllErpDataFromSheets,
  appendTransactionToSheet,
  appendPurchaseToSheet,
  appendExpenseToSheet,
  appendAdjustmentToSheet,
  syncMaterialsToSheet,
  syncUsersToSheet,
  pushEntireDatabaseToSheets,
  initializeTableHeaders
} from '../services/googleSheetsDb';
import {
  db,
  testFirestoreConnection,
  saveMaterialToFirestore,
  deleteMaterialFromFirestore,
  saveMenuItemToFirestore,
  deleteMenuItemFromFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  savePurchaseToFirestore,
  deletePurchaseFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveAdjustmentToFirestore,
  deleteAdjustmentFromFirestore,
  saveStockRequestToFirestore,
  deleteStockRequestFromFirestore,
  saveDailyStockCheckToFirestore,
  deleteDailyStockCheckFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveSettingsToFirestore,
  seedAllToFirestore,
  handleFirestoreError,
  OperationType
} from '../services/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

interface ERPContextType {
  // Firebase Cloud Firestore Real-Time Database
  firestoreStatus: 'connected' | 'connecting' | 'offline';
  isOnline: boolean;
  isManualSyncing: boolean;
  lastManualSyncTime: Date | null;
  pushAllToFirestore: () => Promise<{ success: boolean; message: string }>;
  triggerManualSync: () => Promise<{ success: boolean; message: string }>;

  materials: Material[];
  menuItems: MenuItem[];
  transactions: Transaction[];
  purchases: PurchaseOrder[];
  expenses: Expense[];
  adjustments: StockAdjustment[];
  config: ERPConfig;
  cart: CartItem[];
  customerName: string;
  orderType: 'Dine In' | 'Take Away' | 'Online Grab/Gojek';
  tableNo: string;
  discount: number;
  
  // User Accounts & Authentication (RBAC)
  isAuthenticated: boolean;
  users: UserAccount[];
  currentUser: UserAccount;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<UserAccount, 'id' | 'joinDate' | 'isActive'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  verifySupervisorOrOwnerPin: (pinOrPassword: string) => boolean;

  // Sales Targets
  salesTargets: SalesTarget;
  updateSalesTargets: (targets: Partial<SalesTarget>) => void;

  // Dynamic Categories (Editable & Expandable)
  menuCategories: string[];
  materialCategories: string[];
  addMenuCategory: (cat: string) => void;
  updateMenuCategory: (oldCat: string, newCat: string) => void;
  deleteMenuCategory: (cat: string) => void;
  reorderMenuCategories: (newOrder: string[]) => void;
  addMaterialCategory: (cat: string) => void;
  updateMaterialCategory: (oldCat: string, newCat: string) => void;
  deleteMaterialCategory: (cat: string) => void;
  reorderMaterialCategories: (newOrder: string[]) => void;

  // Dynamic Payment Methods (Customizable, Add, Edit, Delete)
  paymentMethods: string[];
  addPaymentMethod: (method: string) => void;
  updatePaymentMethod: (oldMethod: string, newMethod: string) => void;
  deletePaymentMethod: (method: string) => void;
  
  // Setters
  setCustomerName: (name: string) => void;
  setOrderType: (type: 'Dine In' | 'Take Away' | 'Online Grab/Gojek') => void;
  setTableNo: (table: string) => void;
  setDiscount: (discount: number) => void;
  updateConfig: (newConfig: Partial<ERPConfig>) => void;

  // POS & Cart
  addToCart: (item: MenuItem, qty?: number) => void;
  updateCartQty: (itemId: string, delta: number) => void;
  updateCartNotes: (itemId: string, notes: string) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  calculateMenuHpp: (item: MenuItem) => number;
  checkMenuStockAvailability: (item: MenuItem) => { available: boolean; maxPortions: number; missingIngredient?: string };
  processCheckout: (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string
  ) => Promise<Transaction>;

  // Materials
  addMaterial: (material: Omit<Material, 'id' | 'lastUpdated'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  // Menu & HPP
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Purchasing
  addPurchase: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date' | 'total'> & { date?: string }) => Promise<void>;
  updatePurchase: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchase: (id: string) => void;

  // Expenses
  addExpense: (exp: Omit<Expense, 'id' | 'expenseNo' | 'date'> & { date?: string }) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => void;

  // Stock Adjustment
  addAdjustment: (data: {
    materialId: string;
    actualStock: number;
    reason: StockAdjustment['reason'];
    adjustedBy?: string;
  }) => void;
  deleteAdjustment: (id: string, restoreStock?: boolean) => void;

  // Sistem Request Stok Inventaris (RSI)
  stockRequests: StockRequest[];
  addStockRequest: (data: {
    materialId: string;
    qty: number;
    purposeCategory: StockRequest['purposeCategory'];
    requestedBy: string;
    notes?: string;
  }) => StockRequest | null;
  commitStockRequest: (id: string, committedByName: string) => Promise<{ success: boolean; message: string }>;
  deleteStockRequest: (id: string) => void;

  // Cek Stok Yesterday & Harian (Stock Audit & Approval)
  dailyStockChecks: DailyStockCheck[];
  saveDailyStockCheck: (data: Omit<DailyStockCheck, 'id' | 'createdAt' | 'checkNo'> & { id?: string; checkNo?: string }) => DailyStockCheck;
  approveDailyStockCheck: (id: string, supervisorName: string, syncStockToPhysical?: boolean) => Promise<{ success: boolean; message: string }>;
  deleteDailyStockCheck: (id: string) => void;

  // History & Refund
  refundTransaction: (transactionId: string) => void;
  deleteTransaction: (transactionId: string, restoreStock?: boolean) => void;
  clearAllTransactions: () => void;

  // Google Sheets Workspace Realtime Database (1-Click Google Drive Sync)
  googleUser: FirebaseUser | null;
  isGoogleConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  connectGoogleDatabase: () => Promise<{ success: boolean; message: string }>;
  disconnectGoogleDatabase: () => Promise<void>;
  syncFromGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  syncToGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  setCustomSpreadsheetId: (idOrUrl: string) => Promise<{ success: boolean; message: string }>;

  // Google Sheets Apps Script Real-time Database
  cloudSyncStatus: 'connected' | 'syncing' | 'offline' | 'error';
  lastCloudSyncTime: string | null;
  pullFromGoogleSheet: (silent?: boolean) => Promise<{ success: boolean; message: string; count?: number }>;
  seedAllToGoogleSheet: () => Promise<{ success: boolean; message: string }>;
  syncWithGoogleSheet: (action: string, data: any) => Promise<{ success: boolean; message: string }>;
  syncAllToGoogleSheet: () => Promise<{ successCount: number; failCount: number }>;

  // Parked Orders (Hold & Recall)
  parkedOrders: ParkedOrder[];
  parkCurrentOrder: (customLabel?: string) => boolean;
  recallParkedOrder: (orderId: string) => void;
  deleteParkedOrder: (orderId: string) => void;

  // Import Batch for BOM, Bahan Baku, and Menu
  importMaterialsBatch: (newMaterials: Material[]) => { added: number; updated: number };
  importMenuBatch: (newMenuItems: MenuItem[]) => { added: number; updated: number };
  importBOMBatch: (bomRows: any[]) => { matchedCount: number; unmatchedErrors: string[] };

  // Shift & Cashier Utilities
  getShiftSummary: () => ShiftSummary;
  addQuickToppingToCartItem: (itemId: string, toppingName: string, additionalPrice: number) => void;
  resetAllData: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MATERIALS: 'dimsum77_materials_v1',
  MENU: 'dimsum77_menu_v1',
  TRANSACTIONS: 'dimsum77_transactions_v1',
  PURCHASES: 'dimsum77_purchases_v1',
  EXPENSES: 'dimsum77_expenses_v1',
  ADJUSTMENTS: 'dimsum77_adjustments_v1',
  STOCK_REQUESTS: 'dimsum77_stock_requests_v1',
  DAILY_CHECKS: 'dimsum77_daily_checks_v1',
  CONFIG: 'dimsum77_config_v1',
  PARKED: 'dimsum77_parked_v1',
  USERS: 'dimsum77_users_v1',
  CURRENT_USER: 'dimsum77_current_user_v1',
  SALES_TARGETS: 'dimsum77_targets_v1',
  MENU_CATS: 'dimsum77_menu_cats_v1',
  MATERIAL_CATS: 'dimsum77_material_cats_v1',
  PAYMENT_METHODS: 'dimsum77_payment_methods_v1',
  IS_AUTHENTICATED: 'dimsum77_auth_state_v1',
  GOOGLE_SHEET_ID: 'dimsum77_google_sheet_id_v1',
  GOOGLE_SHEET_URL: 'dimsum77_google_sheet_url_v1',
  GOOGLE_AUTO_SYNC: 'dimsum77_google_auto_sync_v1',
};

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_MATERIALS;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_MENU_ITEMS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved !== null) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_TRANSACTIONS;
  });

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved !== null) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_PURCHASES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved !== null) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_EXPENSES;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [stockRequests, setStockRequests] = useState<StockRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_REQUESTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyStockChecks, setDailyStockChecks] = useState<DailyStockCheck[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CHECKS);
    return saved ? JSON.parse(saved) : [];
  });

  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARKED);
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_USERS[0];
  });

  const [salesTargets, setSalesTargets] = useState<SalesTarget>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_TARGETS);
    return saved ? JSON.parse(saved) : DEFAULT_SALES_TARGET;
  });

  const [menuCategories, setMenuCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU_CATS);
    return saved ? JSON.parse(saved) : DEFAULT_MENU_CATEGORIES;
  });

  const [materialCategories, setMaterialCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIAL_CATS);
    return saved ? JSON.parse(saved) : DEFAULT_MATERIAL_CATEGORIES;
  });

  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_METHODS;
  });

  const [config, setConfig] = useState<ERPConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!saved) return INITIAL_CONFIG;
    try {
      const parsed = JSON.parse(saved);
      if (
        !parsed.storeAddress ||
        parsed.storeAddress.includes('Viktor') ||
        parsed.storeAddress.includes('Surya Kencana') ||
        parsed.storeAddress.includes('No.Samping')
      ) {
        parsed.storeAddress = INITIAL_CONFIG.storeAddress;
      }
      if (!parsed.storePhone || parsed.storePhone === '0812-9988-7711') {
        parsed.storePhone = INITIAL_CONFIG.storePhone;
      }
      if (!parsed.storeTagline || parsed.storeTagline.includes('Viktor') || parsed.storeTagline.includes('Torched Spesial')) {
        parsed.storeTagline = INITIAL_CONFIG.storeTagline;
      }
      return { ...INITIAL_CONFIG, ...parsed };
    } catch {
      return INITIAL_CONFIG;
    }
  });

  // Firebase Cloud Firestore Real-Time Database State
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [lastManualSyncTime, setLastManualSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('dm77_last_manual_sync');
    return saved ? new Date(saved) : null;
  });

  // Cloud Real-Time Database Sync States
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.googleWebAppUrl && parsed.googleWebAppUrl.trim().startsWith('http') ? 'connected' : 'offline';
  });
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  // Google Sheets Workspace Real-Time Database States (Direct Google Drive Integration)
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_ID) || null;
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || null;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_AUTO_SYNC);
    return saved !== null ? saved === 'true' : true;
  });

  // Active POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Pelanggan Dimsum');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away' | 'Online Grab/Gojek'>('Dine In');
  const [tableNo, setTableNo] = useState<string>('Meja 01');
  const [discount, setDiscount] = useState<number>(0);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_TARGETS, JSON.stringify(salesTargets));
  }, [salesTargets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU_CATS, JSON.stringify(menuCategories));
  }, [menuCategories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIAL_CATS, JSON.stringify(materialCategories));
  }, [materialCategories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARKED, JSON.stringify(parkedOrders));
  }, [parkedOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_REQUESTS, JSON.stringify(stockRequests));
  }, [stockRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CHECKS, JSON.stringify(dailyStockChecks));
  }, [dailyStockChecks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<ERPConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Calculate live HPP of a menu item based on current material costs
  const calculateMenuHpp = (item: MenuItem): number => {
    if (!item.recipe || item.recipe.length === 0) return 0;
    return item.recipe.reduce((total, ing) => {
      const mat = materials.find(m => m.id === ing.materialId);
      return total + (mat ? mat.costPerUnit * ing.qty : 0);
    }, 0);
  };

  // Check how many portions can be served based on current raw material inventory
  const checkMenuStockAvailability = (item: MenuItem): { available: boolean; maxPortions: number; missingIngredient?: string } => {
    if (!item.recipe || item.recipe.length === 0) {
      return { available: item.isAvailable, maxPortions: 999 };
    }

    let minPortions = 99999;
    let missingName: string | undefined = undefined;

    for (const ing of item.recipe) {
      const mat = materials.find(m => m.id === ing.materialId);
      if (!mat || mat.stock <= 0) {
        return { available: false, maxPortions: 0, missingIngredient: mat ? mat.name : 'Bahan tidak ditemukan' };
      }
      const possible = Math.floor(mat.stock / ing.qty);
      if (possible < minPortions) {
        minPortions = possible;
        if (possible <= 0) {
          missingName = mat.name;
        }
      }
    }

    return {
      available: item.isAvailable && minPortions > 0,
      maxPortions: Math.max(0, minPortions),
      missingIngredient: missingName
    };
  };

  // Cart operations
  const addToCart = (item: MenuItem, qty = 1) => {
    posSound.playBeep();
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      const hpp = calculateMenuHpp(item);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === item.id
            ? { ...i, qty: i.qty + qty, calculatedHpp: hpp }
            : i
        );
      }
      return [...prev, { menuItem: item, qty, calculatedHpp: hpp }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    posSound.playBeep();
    setCart(prev => {
      return prev
        .map(i => {
          if (i.menuItem.id === itemId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(i => (i.menuItem.id === itemId ? { ...i, notes } : i))
    );
  };

  const removeCartItem = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Google Sheets Apps Script Real-Time Cloud Database Integration
  const syncWithGoogleSheet = async (action: string, data: any): Promise<{ success: boolean; message: string }> => {
    if (!config.googleWebAppUrl || !config.googleWebAppUrl.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    try {
      const payload = {
        action,
        data,
        timestamp: new Date().toISOString()
      };

      await fetch(config.googleWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setCloudSyncStatus('connected');
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSyncTime(nowStr);
      return { success: true, message: 'Terkirim ke Google Sheet secara real-time!' };
    } catch (err: any) {
      console.warn('Google Sheets sync notice:', err);
      setCloudSyncStatus('error');
      return { success: false, message: err?.message || 'Gagal mengirim ke Google Apps Script.' };
    }
  };

  // Pull all live data from Google Sheets (Multi-Device Sync)
  const pullFromGoogleSheet = async (silent = false): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!config.googleWebAppUrl || !config.googleWebAppUrl.trim().startsWith('http')) {
      setCloudSyncStatus('offline');
      return { success: false, message: 'URL Google Apps Script belum diatur.' };
    }
    if (!silent) setCloudSyncStatus('syncing');

    try {
      const baseUrl = config.googleWebAppUrl.trim();
      const separator = baseUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${baseUrl}${separator}action=GET_ALL&_t=${Date.now()}`;

      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP status: ${res.status}`);
      }

      const json = await res.json();
      if (json && json.status === 'SUCCESS' && json.data) {
        const d = json.data;

        // Safely update states if arrays are returned from Google Sheets
        if (Array.isArray(d.materials) && d.materials.length > 0) {
          setMaterials(d.materials);
        }
        if (Array.isArray(d.menuItems) && d.menuItems.length > 0) {
          setMenuItems(d.menuItems);
        }
        if (Array.isArray(d.transactions)) {
          setTransactions(d.transactions);
        }
        if (Array.isArray(d.purchases)) {
          setPurchases(d.purchases);
        }
        if (Array.isArray(d.expenses)) {
          setExpenses(d.expenses);
        }
        if (Array.isArray(d.adjustments)) {
          setAdjustments(d.adjustments);
        }
        if (Array.isArray(d.users) && d.users.length > 0) {
          setUsers(d.users);
        }
        if (d.salesTargets && typeof d.salesTargets === 'object' && d.salesTargets.daily) {
          setSalesTargets(d.salesTargets);
        }
        if (Array.isArray(d.menuCategories) && d.menuCategories.length > 0) {
          setMenuCategories(d.menuCategories);
        }
        if (Array.isArray(d.materialCategories) && d.materialCategories.length > 0) {
          setMaterialCategories(d.materialCategories);
        }

        setCloudSyncStatus('connected');
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastCloudSyncTime(nowStr);

        const totalItems = (d.transactions?.length || 0) + (d.materials?.length || 0);
        return {
          success: true,
          message: 'Data real-time berhasil disinkronkan dari Google Sheets!',
          count: totalItems
        };
      } else {
        throw new Error(json?.message || 'Format respon Google Apps Script tidak sesuai.');
      }
    } catch (err: any) {
      console.warn('Pull Google Sheets warning:', err);
      if (!silent) setCloudSyncStatus('error');
      return { success: false, message: err?.message || 'Gagal menyinkronkan data dari Google Sheet.' };
    }
  };

  // Seed / Push whole system data to Google Sheet (One-Click Setup)
  const seedAllToGoogleSheet = async (): Promise<{ success: boolean; message: string }> => {
    if (!config.googleWebAppUrl || !config.googleWebAppUrl.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    setCloudSyncStatus('syncing');
    try {
      const fullState = {
        materials,
        menuItems,
        transactions,
        purchases,
        expenses,
        adjustments,
        users,
        salesTargets,
        menuCategories,
        materialCategories
      };

      await fetch(config.googleWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'SEED_ALL_DATA',
          data: fullState,
          timestamp: new Date().toISOString()
        })
      });

      setCloudSyncStatus('connected');
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSyncTime(nowStr);
      return { success: true, message: 'Semua database awal berhasil dikirim ke Google Sheets!' };
    } catch (err: any) {
      setCloudSyncStatus('error');
      return { success: false, message: err?.message || 'Gagal mengunggah data awal ke Google Sheet.' };
    }
  };

  // Background Polling for Multi-Device Real-Time Sync
  useEffect(() => {
    if (!config.googleWebAppUrl || !config.googleWebAppUrl.trim().startsWith('http')) {
      setCloudSyncStatus('offline');
      return;
    }

    // Pull on initial load
    pullFromGoogleSheet(true);

    // Periodic live pull every 20 seconds when tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pullFromGoogleSheet(true);
      }
    }, 20000);

    // Pull whenever user returns to window / tab
    const handleFocus = () => {
      pullFromGoogleSheet(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [config.googleWebAppUrl]);

  // Firebase Firestore Real-Time Multi-Device Listener
  useEffect(() => {
    testFirestoreConnection().then(connected => {
      setFirestoreStatus(connected ? 'connected' : 'offline');
    });

    // 1. Materials listener
    const unsubMaterials = onSnapshot(collection(db, 'materials'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      if (!snapshot.empty) {
        const cloudMaterials = snapshot.docs.map(d => d.data() as Material);
        setMaterials(cloudMaterials);
      } else {
        INITIAL_MATERIALS.forEach(m => saveMaterialToFirestore(m));
        setMaterials(INITIAL_MATERIALS);
      }
    }, err => handleFirestoreError(err, OperationType.LIST, 'materials'));

    // 2. Menu items listener
    const unsubMenu = onSnapshot(collection(db, 'menuItems'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      if (!snapshot.empty) {
        const cloudMenu = snapshot.docs.map(d => d.data() as MenuItem);
        setMenuItems(cloudMenu);
      } else {
        INITIAL_MENU_ITEMS.forEach(mi => saveMenuItemToFirestore(mi));
        setMenuItems(INITIAL_MENU_ITEMS);
      }
    }, err => handleFirestoreError(err, OperationType.LIST, 'menuItems'));

    // 3. Transactions listener
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudTrx = snapshot.docs.map(d => d.data() as Transaction);
      cloudTrx.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setTransactions(cloudTrx);
    }, err => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    // 4. Purchases listener
    const unsubPurchases = onSnapshot(collection(db, 'purchases'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudPurchases = snapshot.docs.map(d => d.data() as PurchaseOrder);
      cloudPurchases.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setPurchases(cloudPurchases);
    }, err => handleFirestoreError(err, OperationType.LIST, 'purchases'));

    // 5. Expenses listener
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudExpenses = snapshot.docs.map(d => d.data() as Expense);
      cloudExpenses.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setExpenses(cloudExpenses);
    }, err => handleFirestoreError(err, OperationType.LIST, 'expenses'));

    // 6. Adjustments listener
    const unsubAdjustments = onSnapshot(collection(db, 'adjustments'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudAdj = snapshot.docs.map(d => d.data() as StockAdjustment);
      cloudAdj.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setAdjustments(cloudAdj);
    }, err => handleFirestoreError(err, OperationType.LIST, 'adjustments'));

    // 7. Stock Requests (RSI) listener
    const unsubStockRequests = onSnapshot(collection(db, 'stockRequests'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudReqs = snapshot.docs.map(d => d.data() as StockRequest);
      cloudReqs.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setStockRequests(cloudReqs);
    }, err => handleFirestoreError(err, OperationType.LIST, 'stockRequests'));

    // 7b. Daily Stock Checks (Yesterday Audit & Scheduled) listener
    const unsubDailyStockChecks = onSnapshot(collection(db, 'dailyStockChecks'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      const cloudChecks = snapshot.docs.map(d => d.data() as DailyStockCheck);
      cloudChecks.sort((a, b) => (b.date || b.id).localeCompare(a.date || a.id));
      setDailyStockChecks(cloudChecks);
    }, err => handleFirestoreError(err, OperationType.LIST, 'dailyStockChecks'));

    // 8. Users listener
    const unsubUsers = onSnapshot(collection(db, 'users'), snapshot => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      if (!snapshot.empty) {
        const cloudUsers = snapshot.docs.map(d => d.data() as UserAccount);
        setUsers(cloudUsers);
      } else {
        INITIAL_USERS.forEach(u => saveUserToFirestore(u));
      }
    }, err => handleFirestoreError(err, OperationType.LIST, 'users'));

    // 9. Settings listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'store_config'), docSnap => {
      setFirestoreStatus('connected');
      setIsOnline(true);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.menuCategories && Array.isArray(data.menuCategories)) {
          setMenuCategories(data.menuCategories);
        }
        if (data.materialCategories && Array.isArray(data.materialCategories)) {
          setMaterialCategories(data.materialCategories);
        }
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          setPaymentMethods(data.paymentMethods);
        }
        if (data.salesTargets) {
          setSalesTargets(data.salesTargets);
        }
      } else {
        saveSettingsToFirestore({
          menuCategories: DEFAULT_MENU_CATEGORIES,
          materialCategories: DEFAULT_MATERIAL_CATEGORIES,
          paymentMethods: DEFAULT_PAYMENT_METHODS,
          salesTargets: DEFAULT_SALES_TARGET
        });
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'settings/store_config'));

    // Network Online/Offline Handler
    const handleOnline = () => {
      setIsOnline(true);
      testFirestoreConnection().then(connected => {
        setFirestoreStatus(connected ? 'connected' : 'offline');
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setFirestoreStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubMaterials();
      unsubMenu();
      unsubTransactions();
      unsubPurchases();
      unsubExpenses();
      unsubAdjustments();
      unsubStockRequests();
      unsubDailyStockChecks();
      unsubUsers();
      unsubSettings();
    };
  }, []);

  // Google Workspace Auth Listener on Mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGoogleConnected(true);
        setSyncError(null);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save Spreadsheet ID & AutoSync to localStorage
  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_ID, spreadsheetId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_SHEET_ID);
    }
  }, [spreadsheetId]);

  useEffect(() => {
    if (spreadsheetUrl) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, spreadsheetUrl);
    } else {
      localStorage.removeItem(STORAGE_KEYS.GOOGLE_SHEET_URL);
    }
  }, [spreadsheetUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_AUTO_SYNC, String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  // Connect Google Database: Sign in with Google, locate/create Spreadsheet, and pull data
  const connectGoogleDatabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const authResult = await googleSignIn();
      const user = authResult.user;
      const accessToken = authResult.accessToken;
      setGoogleUser(user);
      setIsGoogleConnected(true);

      // Search for existing Dimsum Mentai 77 spreadsheet on Google Drive
      let targetId = spreadsheetId;
      let targetUrl = spreadsheetUrl;

      if (!targetId) {
        const found = await findErpSpreadsheetOnDrive(accessToken);
        if (found) {
          targetId = found.id;
          targetUrl = found.url;
        } else {
          // Create new dedicated spreadsheet on Google Drive
          const created = await createErpSpreadsheetOnDrive(accessToken);
          targetId = created.id;
          targetUrl = created.url;

          // Seed entire initial database into the newly created spreadsheet
          await pushEntireDatabaseToSheets(targetId, accessToken, {
            materials,
            menuItems,
            transactions,
            purchases,
            expenses,
            adjustments,
            users
          });
        }
      }

      setSpreadsheetId(targetId);
      setSpreadsheetUrl(targetUrl);

      // Fetch live data from sheets
      if (targetId) {
        const cloudData = await fetchAllErpDataFromSheets(targetId, accessToken);
        if (cloudData.materials.length > 0) setMaterials(cloudData.materials);
        if (cloudData.menuItems.length > 0) setMenuItems(cloudData.menuItems);
        if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
        if (cloudData.purchases.length > 0) setPurchases(cloudData.purchases);
        if (cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
        if (cloudData.adjustments.length > 0) setAdjustments(cloudData.adjustments);
        if (cloudData.users.length > 0) setUsers(cloudData.users);
      }

      setLastSyncTime(new Date());
      setIsSyncing(false);
      return {
        success: true,
        message: `Terhubung ke Google Drive (${user.email || 'Akun Google'}). Spreadsheet database siap digunakan!`
      };
    } catch (err: any) {
      console.error('Error connecting Google Database:', err);
      setIsSyncing(false);
      const msg = err?.message || 'Gagal menghubungkan Google Sheets.';
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  const disconnectGoogleDatabase = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setIsGoogleConnected(false);
    setSyncError(null);
  };

  const syncFromGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!spreadsheetId) {
      return { success: false, message: 'Belum ada Spreadsheet yang terhubung.' };
    }
    const token = await getGoogleAccessToken();
    if (!token) {
      return { success: false, message: 'Sesi Google telah berakhir. Harap klik Masuk dengan Google kembali.' };
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const cloudData = await fetchAllErpDataFromSheets(spreadsheetId, token);
      if (cloudData.materials.length > 0) setMaterials(cloudData.materials);
      if (cloudData.menuItems.length > 0) setMenuItems(cloudData.menuItems);
      if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
      if (cloudData.purchases.length > 0) setPurchases(cloudData.purchases);
      if (cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
      if (cloudData.adjustments.length > 0) setAdjustments(cloudData.adjustments);
      if (cloudData.users.length > 0) setUsers(cloudData.users);

      setLastSyncTime(new Date());
      setIsSyncing(false);
      return { success: true, message: 'Data real-time berhasil diselaraskan dari Google Sheets!' };
    } catch (err: any) {
      console.error('Sync error:', err);
      setIsSyncing(false);
      const msg = err?.message || 'Gagal mengambil data dari Google Sheets.';
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  const syncToGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!spreadsheetId) {
      return { success: false, message: 'Belum ada Spreadsheet yang terhubung.' };
    }
    const token = await getGoogleAccessToken();
    if (!token) {
      return { success: false, message: 'Sesi Google telah berakhir. Harap klik Masuk dengan Google kembali.' };
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      await pushEntireDatabaseToSheets(spreadsheetId, token, {
        materials,
        menuItems,
        transactions,
        purchases,
        expenses,
        adjustments,
        users
      });
      setLastSyncTime(new Date());
      setIsSyncing(false);
      return { success: true, message: 'Seluruh data lokal berhasil diperbarui ke Google Sheets!' };
    } catch (err: any) {
      console.error('Push error:', err);
      setIsSyncing(false);
      const msg = err?.message || 'Gagal mengirim data ke Google Sheets.';
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  const setCustomSpreadsheetId = async (idOrUrl: string): Promise<{ success: boolean; message: string }> => {
    let cleanId = idOrUrl.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      cleanId = match[1];
    }

    if (!cleanId) {
      return { success: false, message: 'ID atau URL Spreadsheet tidak valid.' };
    }

    const token = await getGoogleAccessToken();
    if (!token) {
      return { success: false, message: 'Harap masuk dengan Google terlebih dahulu.' };
    }

    setIsSyncing(true);
    try {
      await initializeTableHeaders(cleanId, token);
      setSpreadsheetId(cleanId);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${cleanId}/edit`);

      const cloudData = await fetchAllErpDataFromSheets(cleanId, token);
      if (cloudData.materials.length > 0) setMaterials(cloudData.materials);
      if (cloudData.menuItems.length > 0) setMenuItems(cloudData.menuItems);
      if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
      if (cloudData.purchases.length > 0) setPurchases(cloudData.purchases);
      if (cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
      if (cloudData.adjustments.length > 0) setAdjustments(cloudData.adjustments);
      if (cloudData.users.length > 0) setUsers(cloudData.users);

      setLastSyncTime(new Date());
      setIsSyncing(false);
      return { success: true, message: 'Spreadsheet kustom berhasil dihubungkan dan disinkronkan!' };
    } catch (err: any) {
      setIsSyncing(false);
      const msg = err?.message || 'Gagal mengakses Spreadsheet kustom tersebut.';
      setSyncError(msg);
      return { success: false, message: msg };
    }
  };

  // Real-Time Background Polling for Google Workspace Sheets
  useEffect(() => {
    if (!isGoogleConnected || !spreadsheetId || !autoSyncEnabled) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const token = await getGoogleAccessToken();
        if (token && spreadsheetId) {
          try {
            const cloudData = await fetchAllErpDataFromSheets(spreadsheetId, token);
            if (cloudData.materials.length > 0) setMaterials(cloudData.materials);
            if (cloudData.menuItems.length > 0) setMenuItems(cloudData.menuItems);
            if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
            if (cloudData.purchases.length > 0) setPurchases(cloudData.purchases);
            if (cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
            if (cloudData.adjustments.length > 0) setAdjustments(cloudData.adjustments);
            if (cloudData.users.length > 0) setUsers(cloudData.users);
            setLastSyncTime(new Date());
          } catch (e) {
            // Silently ignore background poll errors
          }
        }
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [isGoogleConnected, spreadsheetId, autoSyncEnabled]);

  // Complete checkout & BOM stock deduction
  const processCheckout = async (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    notes?: string
  ): Promise<Transaction> => {
    if (cart.length === 0) {
      throw new Error('Keranjang belanja masih kosong!');
    }

    const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
    const total = Math.max(0, subtotal - discount);
    const totalHpp = cart.reduce((sum, item) => sum + item.calculatedHpp * item.qty, 0);
    const grossProfit = total - totalHpp;

    const change = cashReceived && cashReceived >= total ? cashReceived - total : 0;

    const now = new Date();
    const dateStr = now.toISOString();
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (transactions.length + 1).toString().padStart(3, '0');
    const invoiceNo = `INV-${ymd}-${seq}`;

    const transactionItems = cart.map(i => ({
      id: i.menuItem.id,
      name: i.menuItem.name,
      price: i.menuItem.price,
      qty: i.qty,
      subtotal: i.menuItem.price * i.qty,
      hppPerUnit: i.calculatedHpp,
      totalHpp: i.calculatedHpp * i.qty,
      notes: i.notes || notes || ''
    }));

    // 1. Deduct Materials from Inventory via Bill of Materials (BOM)
    setMaterials(currentMaterials => {
      const updated = currentMaterials.map(mat => ({ ...mat }));

      cart.forEach(cartItem => {
        if (!cartItem.menuItem.recipe) return;
        cartItem.menuItem.recipe.forEach(recipeIng => {
          const target = updated.find(m => m.id === recipeIng.materialId);
          if (target) {
            const deduction = recipeIng.qty * cartItem.qty;
            target.stock = Math.max(0, target.stock - deduction);
            target.lastUpdated = new Date().toISOString().slice(0, 10);
            saveMaterialToFirestore(target);
          }
        });
      });

      return updated;
    });

    // 2. Create Transaction object
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNo,
      date: dateStr,
      customer: customerName || 'Pelanggan Umum',
      orderType,
      tableNo: orderType === 'Dine In' ? (tableNo || '-') : '-',
      paymentMethod,
      items: transactionItems,
      subtotal,
      discount,
      total,
      cashReceived: cashReceived !== undefined && cashReceived !== null ? cashReceived : total,
      change: change !== undefined && change !== null ? change : 0,
      totalHpp,
      grossProfit,
      status: 'COMPLETED',
      cashierName: currentUser?.name || currentUser?.username || config.cashierName || 'Kasir',
      syncedToGoogleSheet: false
    };

    // 3. Play sound & celebratory confetti
    posSound.playCashRegister();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // Ignore
    }

    // 4. Update transactions state
    setTransactions(prev => [newTransaction, ...prev]);

    // 4b. Real-Time Cloud Firestore Sync
    saveTransactionToFirestore(newTransaction);

    // 5. Try syncing to Google Sheet if enabled
    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_TRANSACTION', {
        id: newTransaction.invoiceNo,
        date: newTransaction.date,
        customer: newTransaction.customer,
        paymentMethod: newTransaction.paymentMethod,
        items: newTransaction.items,
        subtotal: newTransaction.subtotal,
        discount: newTransaction.discount,
        total: newTransaction.total,
        totalHpp: newTransaction.totalHpp,
        grossProfit: newTransaction.grossProfit
      }).then(res => {
        if (res.success) {
          setTransactions(prev =>
            prev.map(t => (t.id === newTransaction.id ? { ...t, syncedToGoogleSheet: true } : t))
          );
        }
      });
    }

    // 5b. Direct Google Drive / Google Sheets Realtime API Sync
    if (isGoogleConnected && spreadsheetId) {
      getGoogleAccessToken().then(token => {
        if (token && spreadsheetId) {
          appendTransactionToSheet(spreadsheetId, token, newTransaction).catch(err => {
            console.warn('Failed to append transaction to Google Sheet:', err);
          });
        }
      });
    }

    // Reset Cart
    clearCart();

    return newTransaction;
  };

  // Purchasing restock
  const addPurchase = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date' | 'total'> & { date?: string }) => {
    const now = new Date();
    const dateStr = poData.date || now.toISOString().slice(0, 10);
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (purchases.length + 1).toString().padStart(2, '0');
    const poNumber = `PO-${ymd}-${seq}`;
    const total = poData.qty * poData.unitPrice;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      date: dateStr,
      supplier: poData.supplier,
      materialId: poData.materialId,
      materialName: poData.materialName,
      qty: poData.qty,
      unit: poData.unit,
      unitPrice: poData.unitPrice,
      total,
      paymentStatus: poData.paymentStatus,
      notes: poData.notes,
      syncedToGoogleSheet: false
    };

    // Increase material stock and update weighted average cost
    setMaterials(prev =>
      prev.map(mat => {
        if (mat.id === poData.materialId) {
          const currentTotalVal = mat.stock * mat.costPerUnit;
          const purchaseVal = poData.qty * poData.unitPrice;
          const newStock = mat.stock + poData.qty;
          const newAvgCost = newStock > 0 ? Math.round((currentTotalVal + purchaseVal) / newStock) : poData.unitPrice;

          const updatedMat = {
            ...mat,
            stock: newStock,
            costPerUnit: newAvgCost,
            supplier: poData.supplier || mat.supplier,
            lastUpdated: dateStr
          };
          saveMaterialToFirestore(updatedMat);
          return updatedMat;
        }
        return mat;
      })
    );

    setPurchases(prev => [newPO, ...prev]);
    savePurchaseToFirestore(newPO);

    // Sync to GAS
    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_PURCHASE', {
        id: newPO.poNumber,
        date: newPO.date,
        supplier: newPO.supplier,
        materialName: newPO.materialName,
        qty: newPO.qty,
        unit: newPO.unit,
        unitPrice: newPO.unitPrice,
        total: newPO.total
      });
    }

    // Google Drive Workspace Sheet sync
    if (isGoogleConnected && spreadsheetId) {
      getGoogleAccessToken().then(token => {
        if (token && spreadsheetId) {
          appendPurchaseToSheet(spreadsheetId, token, newPO).catch(err => {
            console.warn('Failed to append purchase to Google Sheet:', err);
          });
        }
      });
    }
  };

  const updatePurchase = async (id: string, updates: Partial<PurchaseOrder>) => {
    const existing = purchases.find(p => p.id === id);
    if (!existing) return;

    const newQty = updates.qty !== undefined ? updates.qty : existing.qty;
    const newUnitPrice = updates.unitPrice !== undefined ? updates.unitPrice : existing.unitPrice;
    const newTotal = newQty * newUnitPrice;

    // Adjust raw material stock & cost if qty or unitPrice changed
    if (newQty !== existing.qty || newUnitPrice !== existing.unitPrice) {
      const qtyDiff = newQty - existing.qty;
      setMaterials(prev =>
        prev.map(mat => {
          if (mat.id === existing.materialId) {
            const currentTotalVal = mat.stock * mat.costPerUnit;
            const adjustmentVal = (newQty * newUnitPrice) - (existing.qty * existing.unitPrice);
            const newStock = Math.max(0, mat.stock + qtyDiff);
            const newAvgCost = newStock > 0 ? Math.round((currentTotalVal + adjustmentVal) / newStock) : newUnitPrice;

            const updatedMat = {
              ...mat,
              stock: newStock,
              costPerUnit: Math.max(1, newAvgCost),
              lastUpdated: new Date().toISOString().slice(0, 10)
            };
            saveMaterialToFirestore(updatedMat);
            return updatedMat;
          }
          return mat;
        })
      );
    }

    const updatedPO: PurchaseOrder = {
      ...existing,
      ...updates,
      qty: newQty,
      unitPrice: newUnitPrice,
      total: newTotal
    };

    setPurchases(prev => prev.map(p => (p.id === id ? updatedPO : p)));
    savePurchaseToFirestore(updatedPO);
  };

  const deletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
    deletePurchaseFromFirestore(id);
  };

  // Non-stock operational expenses
  const addExpense = async (expData: Omit<Expense, 'id' | 'expenseNo' | 'date'> & { date?: string }) => {
    const now = new Date();
    const dateStr = expData.date || now.toISOString().slice(0, 10);
    const ymd = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const seq = (expenses.length + 1).toString().padStart(2, '0');
    const expenseNo = `EXP-${ymd}-${seq}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseNo,
      date: dateStr,
      name: expData.name,
      category: expData.category,
      amount: expData.amount,
      notes: expData.notes,
      syncedToGoogleSheet: false
    };

    setExpenses(prev => [newExpense, ...prev]);
    saveExpenseToFirestore(newExpense);

    if (config.autoSyncGoogleSheet && config.googleWebAppUrl) {
      syncWithGoogleSheet('ADD_EXPENSE', {
        id: newExpense.expenseNo,
        name: newExpense.name,
        amount: newExpense.amount
      });
    }

    // Google Drive Workspace Sheet sync
    if (isGoogleConnected && spreadsheetId) {
      getGoogleAccessToken().then(token => {
        if (token && spreadsheetId) {
          appendExpenseToSheet(spreadsheetId, token, newExpense).catch(err => {
            console.warn('Failed to append expense to Google Sheet:', err);
          });
        }
      });
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const existing = expenses.find(e => e.id === id);
    if (!existing) return;

    const updatedExp: Expense = {
      ...existing,
      ...updates
    };

    setExpenses(prev => prev.map(e => (e.id === id ? updatedExp : e)));
    saveExpenseToFirestore(updatedExp);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    deleteExpenseFromFirestore(id);
  };

  // Stock Adjustment / Stock Opname
  const addAdjustment = (data: {
    materialId: string;
    actualStock: number;
    reason: StockAdjustment['reason'];
    adjustedBy?: string;
  }) => {
    const mat = materials.find(m => m.id === data.materialId);
    if (!mat) return;

    const diff = data.actualStock - mat.stock;
    const lossCost = diff < 0 ? Math.abs(diff) * mat.costPerUnit : 0;

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString(),
      materialId: mat.id,
      materialName: mat.name,
      unit: mat.unit,
      systemStock: mat.stock,
      actualStock: data.actualStock,
      difference: diff,
      reason: data.reason,
      lossCost,
      adjustedBy: data.adjustedBy || config.cashierName
    };

    // Update material to actual stock
    setMaterials(prev =>
      prev.map(m => {
        if (m.id === mat.id) {
          const updatedMat = { ...m, stock: data.actualStock, lastUpdated: new Date().toISOString().slice(0, 10) };
          saveMaterialToFirestore(updatedMat);
          return updatedMat;
        }
        return m;
      })
    );

    setAdjustments(prev => [newAdjustment, ...prev]);
    saveAdjustmentToFirestore(newAdjustment);

    // Google Drive Workspace Sheet sync
    if (isGoogleConnected && spreadsheetId) {
      getGoogleAccessToken().then(token => {
        if (token && spreadsheetId) {
          appendAdjustmentToSheet(spreadsheetId, token, newAdjustment).catch(err => {
            console.warn('Failed to append adjustment to Google Sheet:', err);
          });
        }
      });
    }
  };

  const deleteAdjustment = (id: string, restoreStock = false) => {
    const target = adjustments.find(a => a.id === id);
    if (!target) return;

    if (restoreStock) {
      setMaterials(prev =>
        prev.map(m => {
          if (m.id === target.materialId) {
            const restoredMat = { ...m, stock: Math.max(0, m.stock - target.difference), lastUpdated: new Date().toISOString().slice(0, 10) };
            saveMaterialToFirestore(restoredMat);
            return restoredMat;
          }
          return m;
        })
      );
    }

    setAdjustments(prev => prev.filter(a => a.id !== id));
    deleteAdjustmentFromFirestore(id);
  };

  // Sistem Request Stok Inventaris (RSI)
  const addStockRequest = (data: {
    materialId: string;
    qty: number;
    purposeCategory: StockRequest['purposeCategory'];
    requestedBy: string;
    notes?: string;
  }): StockRequest | null => {
    const mat = materials.find(m => m.id === data.materialId);
    if (!mat) return null;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = stockRequests.filter(r => r.date && r.date.startsWith(new Date().toISOString().slice(0, 10))).length + 1;
    const requestNo = `RSI-${todayStr}-${countToday.toString().padStart(3, '0')}`;

    const newReq: StockRequest = {
      id: `rsi-${Date.now()}`,
      requestNo,
      date: new Date().toISOString(),
      materialId: mat.id,
      materialName: mat.name,
      materialCode: mat.code,
      qty: Number(data.qty),
      unit: mat.unit,
      costPerUnit: mat.costPerUnit,
      totalCost: Number(data.qty) * mat.costPerUnit,
      purposeCategory: data.purposeCategory,
      requestedBy: data.requestedBy || currentUser.name,
      notes: data.notes || '',
      status: 'PENDING'
    };

    setStockRequests(prev => [newReq, ...prev]);
    saveStockRequestToFirestore(newReq);
    return newReq;
  };

  const commitStockRequest = async (id: string, committedByName: string): Promise<{ success: boolean; message: string }> => {
    const req = stockRequests.find(r => r.id === id);
    if (!req) return { success: false, message: 'Request stok tidak ditemukan.' };
    if (req.status === 'COMMITTED') return { success: false, message: 'Pengajuan ini sudah berstatus COMMITTED.' };

    const mat = materials.find(m => m.id === req.materialId);
    if (!mat) return { success: false, message: 'Data bahan material tidak ditemukan di inventaris.' };

    const updatedStock = Math.max(0, mat.stock - req.qty);
    const updatedMat: Material = {
      ...mat,
      stock: updatedStock,
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    // Eksekusi Stok: kurangi stok bahan di state & Firestore
    setMaterials(prev => prev.map(m => m.id === mat.id ? updatedMat : m));
    await saveMaterialToFirestore(updatedMat);

    // Update RSI record status menjadi COMMITTED
    const committedReq: StockRequest = {
      ...req,
      status: 'COMMITTED',
      committedBy: committedByName,
      committedAt: new Date().toISOString()
    };

    setStockRequests(prev => prev.map(r => r.id === id ? committedReq : r));
    await saveStockRequestToFirestore(committedReq);

    posSound.playCashRegister();
    return {
      success: true,
      message: `Berhasil commit ${req.requestNo}! Stok ${mat.name} berkurang ${req.qty} ${mat.unit} (sisa stok: ${updatedStock} ${mat.unit}).`
    };
  };

  const deleteStockRequest = (id: string) => {
    setStockRequests(prev => prev.filter(r => r.id !== id));
    deleteStockRequestFromFirestore(id);
  };

  // Cek Stok Yesterday & Harian (Stock Audit & Approval)
  const saveDailyStockCheck = (data: Omit<DailyStockCheck, 'id' | 'createdAt' | 'checkNo'> & { id?: string; checkNo?: string }): DailyStockCheck => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = dailyStockChecks.length + 1;
    const checkNo = data.checkNo || `CHK-${todayStr}-${count.toString().padStart(3, '0')}`;
    const newCheck: DailyStockCheck = {
      ...data,
      id: data.id || `chk-${Date.now()}`,
      checkNo,
      createdAt: new Date().toISOString(),
      syncedToFirestore: true
    };

    setDailyStockChecks(prev => {
      const existingIdx = prev.findIndex(c => c.id === newCheck.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newCheck;
        return updated;
      }
      return [newCheck, ...prev];
    });

    saveDailyStockCheckToFirestore(newCheck);
    return newCheck;
  };

  const approveDailyStockCheck = async (
    id: string,
    supervisorName: string,
    syncStockToPhysical = false
  ): Promise<{ success: boolean; message: string }> => {
    const check = dailyStockChecks.find(c => c.id === id);
    if (!check) return { success: false, message: 'Data audit cek stok tidak ditemukan.' };
    if (check.status === 'APPROVED') return { success: false, message: 'Audit cek stok ini sudah disetujui (Approved) sebelumnya.' };

    // If syncStockToPhysical is true, synchronize materials in database to physical count
    if (syncStockToPhysical && check.items && check.items.length > 0) {
      setMaterials(prev => {
        return prev.map(m => {
          const matchingItem = check.items.find(ci => ci.materialId === m.id);
          if (matchingItem !== undefined) {
            const updatedMat: Material = {
              ...m,
              stock: matchingItem.physicalStock,
              lastUpdated: new Date().toISOString().slice(0, 10)
            };
            saveMaterialToFirestore(updatedMat);
            return updatedMat;
          }
          return m;
        });
      });
    }

    const approvedCheck: DailyStockCheck = {
      ...check,
      status: 'APPROVED',
      approvedBy: supervisorName,
      approvedAt: new Date().toISOString(),
      syncStockOnApproval: syncStockToPhysical
    };

    setDailyStockChecks(prev => prev.map(c => c.id === id ? approvedCheck : c));
    await saveDailyStockCheckToFirestore(approvedCheck);
    posSound.playCashRegister();

    return {
      success: true,
      message: `Audit Cek Stok ${approvedCheck.checkNo} berhasil disetujui & dikunci oleh ${supervisorName}!${syncStockToPhysical ? ' Stok bahan baku telah disinkronkan ke hitungan fisik.' : ''}`
    };
  };

  const deleteDailyStockCheck = (id: string) => {
    setDailyStockChecks(prev => prev.filter(c => c.id !== id));
    deleteDailyStockCheckFromFirestore(id);
  };

  // Void / Refund Transaction (Restores Raw Material Stock!)
  const refundTransaction = (transactionId: string) => {
    const trx = transactions.find(t => t.id === transactionId);
    if (!trx || trx.status === 'REFUNDED') return;

    // Restore raw materials
    setMaterials(currentMaterials => {
      const updated = currentMaterials.map(m => ({ ...m }));

      trx.items.forEach(tItem => {
        const menuItem = menuItems.find(m => m.name === tItem.name);
        if (menuItem && menuItem.recipe) {
          menuItem.recipe.forEach(recipeIng => {
            const target = updated.find(m => m.id === recipeIng.materialId);
            if (target) {
              target.stock += recipeIng.qty * tItem.qty;
              saveMaterialToFirestore(target);
            }
          });
        }
      });

      return updated;
    });

    setTransactions(prev =>
      prev.map(t => {
        if (t.id === transactionId) {
          const updated = { ...t, status: 'REFUNDED' as const };
          saveTransactionToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // Delete Transaction Permanently (with optional stock restoration)
  const deleteTransaction = (transactionId: string, restoreStock: boolean = true) => {
    const trx = transactions.find(t => t.id === transactionId);
    if (!trx) return;

    if (restoreStock && trx.status === 'COMPLETED') {
      setMaterials(currentMaterials => {
        const updated = currentMaterials.map(m => ({ ...m }));
        trx.items.forEach(tItem => {
          const menuItem = menuItems.find(m => m.name === tItem.name);
          if (menuItem && menuItem.recipe) {
            menuItem.recipe.forEach(recipeIng => {
              const target = updated.find(m => m.id === recipeIng.materialId);
              if (target) {
                target.stock += recipeIng.qty * tItem.qty;
                saveMaterialToFirestore(target);
              }
            });
          }
        });
        return updated;
      });
    }

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    deleteTransactionFromFirestore(transactionId);
  };

  const clearAllTransactions = () => {
    transactions.forEach(t => deleteTransactionFromFirestore(t.id));
    setTransactions([]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  };

  // Materials CRUD
  const addMaterial = (mat: Omit<Material, 'id' | 'lastUpdated'>) => {
    const newMat: Material = {
      ...mat,
      id: `mat-${Date.now()}`,
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setMaterials(prev => [...prev, newMat]);
    saveMaterialToFirestore(newMat);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(prev =>
      prev.map(m => {
        if (m.id === id) {
          const updated = { ...m, ...updates, lastUpdated: new Date().toISOString().slice(0, 10) };
          saveMaterialToFirestore(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    deleteMaterialFromFirestore(id);
  };

  // Menu items CRUD
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`
    };
    setMenuItems(prev => [...prev, newItem]);
    saveMenuItemToFirestore(newItem);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev =>
      prev.map(m => {
        if (m.id === id) {
          const updated = { ...m, ...updates };
          saveMenuItemToFirestore(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    deleteMenuItemFromFirestore(id);
  };

  // Parked Orders (Hold & Recall)
  const parkCurrentOrder = (customLabel?: string): boolean => {
    if (cart.length === 0) return false;
    const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
    const total = Math.max(0, subtotal - discount);

    const defaultLabel = orderType === 'Dine In'
      ? `${tableNo} - ${customerName}`
      : `${orderType} - ${customerName}`;

    const newParked: ParkedOrder = {
      id: `parked-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: customLabel || defaultLabel,
      customer: customerName,
      orderType,
      tableNo: orderType === 'Dine In' ? tableNo : undefined,
      cart: [...cart],
      discount,
      total
    };

    setParkedOrders(prev => [newParked, ...prev]);
    clearCart();
    setCustomerName('Pelanggan Dimsum');
    return true;
  };

  const recallParkedOrder = (orderId: string) => {
    const target = parkedOrders.find(p => p.id === orderId);
    if (!target) return;

    setCart(target.cart);
    setCustomerName(target.customer);
    setOrderType(target.orderType);
    if (target.tableNo) setTableNo(target.tableNo);
    setDiscount(target.discount);

    setParkedOrders(prev => prev.filter(p => p.id !== orderId));
  };

  const deleteParkedOrder = (orderId: string) => {
    setParkedOrders(prev => prev.filter(p => p.id !== orderId));
  };

  // Batch import materials from Excel / CSV (Updates existing if matched, else appends)
  const importMaterialsBatch = (newMats: Material[]): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    setMaterials(prev => {
      const copy = [...prev];
      newMats.forEach(nm => {
        const existingIdx = copy.findIndex(
          m => m.code.toLowerCase() === nm.code.toLowerCase() || m.name.toLowerCase() === nm.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...nm,
            id: copy[existingIdx].id,
            lastUpdated: new Date().toISOString().slice(0, 10)
          };
          updated++;
        } else {
          copy.push(nm);
          added++;
        }
      });
      return copy;
    });

    return { added, updated };
  };

  // Batch import Menu items from Excel / CSV
  const importMenuBatch = (newMenuItems: MenuItem[]): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    setMenuItems(prev => {
      const copy = [...prev];
      newMenuItems.forEach(nMenu => {
        const existingIdx = copy.findIndex(
          m => m.code.toLowerCase() === nMenu.code.toLowerCase() || m.name.toLowerCase() === nMenu.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...nMenu,
            id: copy[existingIdx].id,
            recipe: copy[existingIdx].recipe.length > 0 ? copy[existingIdx].recipe : nMenu.recipe
          };
          updated++;
        } else {
          copy.push(nMenu);
          added++;
        }
      });
      return copy;
    });

    return { added, updated };
  };

  // Batch import BOM (Recipe Formulas) linking Menu with Raw Materials
  const importBOMBatch = (bomRows: any[]): { matchedCount: number; unmatchedErrors: string[] } => {
    const res = mapRowsToBOM(bomRows, menuItems, materials);
    if (res.matchedCount > 0) {
      setMenuItems(res.updatedMenuItems);
    }
    return {
      matchedCount: res.matchedCount,
      unmatchedErrors: res.unmatchedErrors
    };
  };

  // Quick modifier / Topping addition for Cashier
  const addQuickToppingToCartItem = (itemId: string, toppingName: string, additionalPrice: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.menuItem.id === itemId) {
          const currentNotes = i.notes ? `${i.notes}, +${toppingName}` : `+${toppingName}`;
          return {
            ...i,
            notes: currentNotes,
            menuItem: {
              ...i.menuItem,
              price: i.menuItem.price + additionalPrice
            }
          };
        }
        return i;
      })
    );
  };

  // Cashier Shift Summary (X-Reading)
  const getShiftSummary = (): ShiftSummary => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const shiftTrx = transactions.filter(t => t.status === 'COMPLETED' && t.date.startsWith(todayStr));

    const grossSales = shiftTrx.reduce((sum, t) => sum + t.subtotal, 0);
    const totalDiscounts = shiftTrx.reduce((sum, t) => sum + t.discount, 0);
    const netSales = shiftTrx.reduce((sum, t) => sum + t.total, 0);
    const cashSales = shiftTrx.filter(t => t.paymentMethod === 'TUNAI').reduce((sum, t) => sum + t.total, 0);
    const qrisSales = shiftTrx.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.total, 0);
    const transferSales = shiftTrx.filter(t => t.paymentMethod === 'TRANSFER').reduce((sum, t) => sum + t.total, 0);
    const debitSales = shiftTrx.filter(t => t.paymentMethod === 'DEBIT').reduce((sum, t) => sum + t.total, 0);
    const totalHpp = shiftTrx.reduce((sum, t) => sum + t.totalHpp, 0);
    const grossProfit = netSales - totalHpp;

    return {
      cashierName: currentUser?.name || currentUser?.username || config.cashierName || 'Kasir',
      startTime: shiftTrx.length > 0 ? shiftTrx[shiftTrx.length - 1].date : new Date().toISOString(),
      totalTransactions: shiftTrx.length,
      grossSales,
      totalDiscounts,
      netSales,
      cashSales,
      qrisSales,
      transferSales,
      debitSales,
      totalHpp,
      grossProfit
    };
  };

  // Sync all transactions & purchases & expenses to GAS
  const syncAllToGoogleSheet = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const trx of transactions) {
      if (!trx.syncedToGoogleSheet) {
        const res = await syncWithGoogleSheet('ADD_TRANSACTION', {
          id: trx.invoiceNo,
          date: trx.date,
          customer: trx.customer,
          paymentMethod: trx.paymentMethod,
          items: trx.items,
          subtotal: trx.subtotal,
          discount: trx.discount,
          total: trx.total,
          totalHpp: trx.totalHpp,
          grossProfit: trx.grossProfit
        });
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    return { successCount, failCount };
  };

  // User Accounts & Authentication (RBAC)
  const login = (username: string, password: string): boolean => {
    const found = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password && u.isActive
    );
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
      updateConfig({ cashierName: found.name });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
  };

  const addUser = (userData: Omit<UserAccount, 'id' | 'joinDate' | 'isActive'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      joinDate: new Date().toISOString().slice(0, 10),
      isActive: true
    };
    setUsers(prev => [...prev, newUser]);
    saveUserToFirestore(newUser);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          saveUserToFirestore(updated);
          return updated;
        }
        return u;
      })
    );
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Tidak dapat menghapus satu-satunya akun pengguna.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteUserFromFirestore(id);
    if (currentUser.id === id) {
      const nextUser = users.find(u => u.id !== id) || users[0];
      setCurrentUser(nextUser);
    }
  };

  const verifySupervisorOrOwnerPin = (pinOrPassword: string): boolean => {
    return users.some(
      u => (u.role === 'OWNER' || u.role === 'SUPERVISOR') && u.isActive && u.password === pinOrPassword.trim()
    );
  };

  // Sales Targets
  const updateSalesTargets = (targets: Partial<SalesTarget>) => {
    setSalesTargets(prev => {
      const updated = { ...prev, ...targets };
      saveSettingsToFirestore({ salesTargets: updated });
      return updated;
    });
  };

  // Dynamic Categories (Menu)
  const addMenuCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed || menuCategories.includes(trimmed)) return;
    setMenuCategories(prev => {
      const updated = [...prev, trimmed];
      saveSettingsToFirestore({ menuCategories: updated });
      return updated;
    });
  };

  const updateMenuCategory = (oldCat: string, newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || oldCat === trimmed) return;
    setMenuCategories(prev => {
      const updated = prev.map(c => (c === oldCat ? trimmed : c));
      saveSettingsToFirestore({ menuCategories: updated });
      return updated;
    });
    // Also update any menu items using this category
    setMenuItems(prev =>
      prev.map(m => {
        const currentCats = m.categories && m.categories.length > 0 ? m.categories : [m.category];
        const hasOld = currentCats.includes(oldCat) || m.category === oldCat;
        if (!hasOld) return m;

        const newCats = currentCats.map(c => (c === oldCat ? trimmed : c));
        const newPrimary = m.category === oldCat ? trimmed : m.category;
        const updated = { ...m, category: newPrimary, categories: newCats };
        saveMenuItemToFirestore(updated);
        return updated;
      })
    );
  };

  const deleteMenuCategory = (cat: string) => {
    if (menuCategories.length <= 1) {
      alert('Minimal harus ada 1 kategori menu.');
      return;
    }
    const remaining = menuCategories.filter(c => c !== cat);
    const fallbackCat = remaining[0] || 'Umum';

    setMenuCategories(prev => {
      const updated = prev.filter(c => c !== cat);
      saveSettingsToFirestore({ menuCategories: updated });
      return updated;
    });

    setMenuItems(prev =>
      prev.map(m => {
        const currentCats = m.categories && m.categories.length > 0 ? m.categories : [m.category];
        const hasTarget = currentCats.includes(cat) || m.category === cat;
        if (!hasTarget) return m;

        const filtered = currentCats.filter(c => c !== cat);
        const newCats = filtered.length > 0 ? filtered : [fallbackCat];
        const newPrimary = m.category === cat ? newCats[0] : m.category;
        const updated = { ...m, category: newPrimary, categories: newCats };
        saveMenuItemToFirestore(updated);
        return updated;
      })
    );
  };

  const reorderMenuCategories = (newOrder: string[]) => {
    setMenuCategories(newOrder);
    localStorage.setItem(STORAGE_KEYS.MENU_CATS, JSON.stringify(newOrder));
    saveSettingsToFirestore({ menuCategories: newOrder });
  };

  // Dynamic Categories (Material)
  const addMaterialCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed || materialCategories.includes(trimmed)) return;
    setMaterialCategories(prev => {
      const updated = [...prev, trimmed];
      saveSettingsToFirestore({ materialCategories: updated });
      return updated;
    });
  };

  const updateMaterialCategory = (oldCat: string, newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || oldCat === trimmed) return;
    setMaterialCategories(prev => {
      const updated = prev.map(c => (c === oldCat ? trimmed : c));
      saveSettingsToFirestore({ materialCategories: updated });
      return updated;
    });
    setMaterials(prev => prev.map(m => (m.category === oldCat ? { ...m, category: trimmed } : m)));
  };

  const deleteMaterialCategory = (cat: string) => {
    if (materialCategories.length <= 1) {
      alert('Minimal harus ada 1 kategori bahan.');
      return;
    }
    setMaterialCategories(prev => {
      const updated = prev.filter(c => c !== cat);
      saveSettingsToFirestore({ materialCategories: updated });
      return updated;
    });
  };

  const reorderMaterialCategories = (newOrder: string[]) => {
    setMaterialCategories(newOrder);
    localStorage.setItem(STORAGE_KEYS.MATERIAL_CATS, JSON.stringify(newOrder));
    saveSettingsToFirestore({ materialCategories: newOrder });
  };

  // Dynamic Payment Methods (Customizable, Add, Edit, Delete)
  const addPaymentMethod = (method: string) => {
    const clean = method.trim().toUpperCase();
    if (!clean || paymentMethods.includes(clean)) return;
    setPaymentMethods(prev => {
      const updated = [...prev, clean];
      saveSettingsToFirestore({ paymentMethods: updated });
      return updated;
    });
  };

  const updatePaymentMethod = (oldMethod: string, newMethod: string) => {
    const clean = newMethod.trim().toUpperCase();
    if (!clean || oldMethod === clean) return;
    setPaymentMethods(prev => {
      const updated = prev.map(m => (m === oldMethod ? clean : m));
      saveSettingsToFirestore({ paymentMethods: updated });
      return updated;
    });
  };

  const deletePaymentMethod = (method: string) => {
    if (paymentMethods.length <= 1) return;
    setPaymentMethods(prev => {
      const updated = prev.filter(m => m !== method);
      saveSettingsToFirestore({ paymentMethods: updated });
      return updated;
    });
  };

  const pushAllToFirestore = async (): Promise<{ success: boolean; message: string }> => {
    return await seedAllToFirestore({
      materials,
      menuItems,
      transactions,
      purchases,
      expenses,
      adjustments,
      users,
      menuCategories,
      materialCategories,
      salesTargets
    });
  };

  const triggerManualSync = async (): Promise<{ success: boolean; message: string }> => {
    setIsManualSyncing(true);
    try {
      const conn = await testFirestoreConnection();
      if (!conn) {
        setIsManualSyncing(false);
        setFirestoreStatus('offline');
        return {
          success: false,
          message: 'Koneksi ke Cloud gagal. Periksa koneksi internet Anda lalu coba lagi.'
        };
      }
      setFirestoreStatus('connected');

      // 1. Sync everything to Firebase Cloud Firestore
      const firestoreRes = await seedAllToFirestore({
        materials,
        menuItems,
        transactions,
        purchases,
        expenses,
        adjustments,
        users,
        menuCategories,
        materialCategories,
        salesTargets
      });

      // 2. Also push to Google Drive Sheets if connected
      if (isGoogleConnected && spreadsheetId) {
        try {
          const token = await getGoogleAccessToken();
          if (token) {
            await pushEntireDatabaseToSheets(spreadsheetId, token, {
              materials,
              menuItems,
              transactions,
              purchases,
              expenses,
              adjustments,
              users
            });
          }
        } catch (e) {
          console.warn('Google Sheets background sync note:', e);
        }
      }

      const now = new Date();
      setLastManualSyncTime(now);
      setLastSyncTime(now);
      localStorage.setItem('dm77_last_manual_sync', now.toISOString());
      setIsManualSyncing(false);

      return {
        success: firestoreRes.success,
        message: firestoreRes.success
          ? 'Sinkronisasi manual berhasil! Seluruh data transaksi, bahan baku, menu, dan pengaturan telah diselaraskan ke Cloud Firestore.'
          : firestoreRes.message
      };
    } catch (err: any) {
      setIsManualSyncing(false);
      return { success: false, message: err?.message || 'Gagal melakukan sinkronisasi manual.' };
    }
  };

  const resetAllData = () => {
    setMaterials(INITIAL_MATERIALS);
    setMenuItems(INITIAL_MENU_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setAdjustments([]);
    setParkedOrders([]);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setSalesTargets(DEFAULT_SALES_TARGET);
    setMenuCategories(DEFAULT_MENU_CATEGORIES);
    setMaterialCategories(DEFAULT_MATERIAL_CATEGORIES);
    setConfig(INITIAL_CONFIG);
    setCart([]);
  };

  return (
    <ERPContext.Provider
      value={{
        firestoreStatus,
        isOnline,
        isManualSyncing,
        lastManualSyncTime,
        pushAllToFirestore,
        triggerManualSync,
        materials,
        menuItems,
        transactions,
        purchases,
        expenses,
        adjustments,
        stockRequests,
        parkedOrders,
        config,
        cart,
        customerName,
        orderType,
        tableNo,
        discount,
        isAuthenticated,
        users,
        currentUser,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        verifySupervisorOrOwnerPin,
        salesTargets,
        updateSalesTargets,
        menuCategories,
        materialCategories,
        addMenuCategory,
        updateMenuCategory,
        deleteMenuCategory,
        reorderMenuCategories,
        addMaterialCategory,
        updateMaterialCategory,
        deleteMaterialCategory,
        reorderMaterialCategories,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        setCustomerName,
        setOrderType,
        setTableNo,
        setDiscount,
        updateConfig,
        addToCart,
        updateCartQty,
        updateCartNotes,
        removeCartItem,
        clearCart,
        calculateMenuHpp,
        checkMenuStockAvailability,
        processCheckout,
        parkCurrentOrder,
        recallParkedOrder,
        deleteParkedOrder,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addPurchase,
        updatePurchase,
        deletePurchase,
        addExpense,
        updateExpense,
        deleteExpense,
        addAdjustment,
        deleteAdjustment,
        addStockRequest,
        commitStockRequest,
        deleteStockRequest,
        dailyStockChecks,
        saveDailyStockCheck,
        approveDailyStockCheck,
        deleteDailyStockCheck,
        refundTransaction,
        deleteTransaction,
        clearAllTransactions,
        cloudSyncStatus,
        lastCloudSyncTime,
        pullFromGoogleSheet,
        seedAllToGoogleSheet,
        syncWithGoogleSheet,
        syncAllToGoogleSheet,
        // Google Sheets Workspace Realtime Database (Google Drive direct integration)
        googleUser,
        isGoogleConnected,
        spreadsheetId,
        spreadsheetUrl,
        isSyncing,
        lastSyncTime,
        syncError,
        autoSyncEnabled,
        setAutoSyncEnabled,
        connectGoogleDatabase,
        disconnectGoogleDatabase,
        syncFromGoogleSheets,
        syncToGoogleSheets,
        setCustomSpreadsheetId,
        importMaterialsBatch,
        importMenuBatch,
        importBOMBatch,
        getShiftSummary,
        addQuickToppingToCartItem,
        resetAllData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
