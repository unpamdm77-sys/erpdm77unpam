import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Material,
  MenuItem,
  Transaction,
  PurchaseOrder,
  Expense,
  StockAdjustment,
  StockRequest,
  UserAccount,
  SalesTarget
} from '../types/erp';

// Initialize Firebase App safely (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'test_connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
      return false;
    }
    // Any other response means we connected to the server
    return true;
  }
}

// -------------------------------------------------------------
// Real-Time Firestore Sync Methods
// -------------------------------------------------------------

/**
 * Recursively remove `undefined` properties so Firestore never receives unsupported field values
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  try {
    const serialized = JSON.stringify(data, (_, value) => (value === undefined ? undefined : value));
    if (!serialized || serialized === 'undefined') {
      return null as any;
    }
    return JSON.parse(serialized);
  } catch {
    if (Array.isArray(data)) {
      return data
        .filter(item => item !== undefined)
        .map(item => sanitizeForFirestore(item)) as any;
    }
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(data as object)) {
        const val = (data as any)[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeForFirestore(val);
        }
      }
      return cleaned;
    }
    return data;
  }
}

export async function saveMaterialToFirestore(mat: Material) {
  const path = `materials/${mat.id}`;
  try {
    await setDoc(doc(db, 'materials', mat.id), sanitizeForFirestore(mat), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMaterialFromFirestore(id: string) {
  const path = `materials/${id}`;
  try {
    await deleteDoc(doc(db, 'materials', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveMenuItemToFirestore(item: MenuItem) {
  const path = `menuItems/${item.id}`;
  try {
    await setDoc(doc(db, 'menuItems', item.id), sanitizeForFirestore(item), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteMenuItemFromFirestore(id: string) {
  const path = `menuItems/${id}`;
  try {
    await deleteDoc(doc(db, 'menuItems', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveTransactionToFirestore(trx: Transaction) {
  const path = `transactions/${trx.id}`;
  try {
    await setDoc(doc(db, 'transactions', trx.id), sanitizeForFirestore(trx), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFromFirestore(id: string) {
  const path = `transactions/${id}`;
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function savePurchaseToFirestore(po: PurchaseOrder) {
  const path = `purchases/${po.id}`;
  try {
    await setDoc(doc(db, 'purchases', po.id), sanitizeForFirestore(po), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePurchaseFromFirestore(id: string) {
  const path = `purchases/${id}`;
  try {
    await deleteDoc(doc(db, 'purchases', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveExpenseToFirestore(exp: Expense) {
  const path = `expenses/${exp.id}`;
  try {
    await setDoc(doc(db, 'expenses', exp.id), sanitizeForFirestore(exp), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirestore(id: string) {
  const path = `expenses/${id}`;
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveAdjustmentToFirestore(adj: StockAdjustment) {
  const path = `adjustments/${adj.id}`;
  try {
    await setDoc(doc(db, 'adjustments', adj.id), sanitizeForFirestore(adj), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAdjustmentFromFirestore(id: string) {
  const path = `adjustments/${id}`;
  try {
    await deleteDoc(doc(db, 'adjustments', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveStockRequestToFirestore(req: StockRequest) {
  const path = `stockRequests/${req.id}`;
  try {
    await setDoc(doc(db, 'stockRequests', req.id), sanitizeForFirestore(req), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStockRequestFromFirestore(id: string) {
  const path = `stockRequests/${id}`;
  try {
    await deleteDoc(doc(db, 'stockRequests', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveUserToFirestore(user: UserAccount) {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(id: string) {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveSettingsToFirestore(settings: {
  menuCategories?: string[];
  materialCategories?: string[];
  paymentMethods?: string[];
  salesTargets?: SalesTarget;
}) {
  const path = 'settings/store_config';
  try {
    await setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore(settings), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Seed entire database to Firestore in atomic batches
 */
export async function seedAllToFirestore(data: {
  materials: Material[];
  menuItems: MenuItem[];
  transactions: Transaction[];
  purchases: PurchaseOrder[];
  expenses: Expense[];
  adjustments: StockAdjustment[];
  users: UserAccount[];
  menuCategories: string[];
  materialCategories: string[];
  salesTargets: SalesTarget;
  paymentMethods?: string[];
}) {
  try {
    // 1. Settings
    await setDoc(doc(db, 'settings', 'store_config'), sanitizeForFirestore({
      menuCategories: data.menuCategories || [],
      materialCategories: data.materialCategories || [],
      paymentMethods: data.paymentMethods || [],
      salesTargets: data.salesTargets || {},
      lastUpdated: new Date().toISOString()
    }), { merge: true });

    // 2. Materials, Menu, and Users batch
    const batch = writeBatch(db);
    (data.materials || []).filter(m => m && m.id).forEach(m => {
      batch.set(doc(db, 'materials', m.id), sanitizeForFirestore(m), { merge: true });
    });
    (data.menuItems || []).filter(mi => mi && mi.id).forEach(mi => {
      batch.set(doc(db, 'menuItems', mi.id), sanitizeForFirestore(mi), { merge: true });
    });
    (data.users || []).filter(u => u && u.id).forEach(u => {
      batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u), { merge: true });
    });
    await batch.commit();

    // 3. Transactions, purchases, expenses, adjustments batch
    const batch2 = writeBatch(db);
    (data.transactions || []).filter(t => t && t.id).slice(0, 50).forEach(t => {
      batch2.set(doc(db, 'transactions', t.id), sanitizeForFirestore(t), { merge: true });
    });
    (data.purchases || []).filter(p => p && p.id).forEach(p => {
      batch2.set(doc(db, 'purchases', p.id), sanitizeForFirestore(p), { merge: true });
    });
    (data.expenses || []).filter(e => e && e.id).forEach(e => {
      batch2.set(doc(db, 'expenses', e.id), sanitizeForFirestore(e), { merge: true });
    });
    (data.adjustments || []).filter(a => a && a.id).forEach(a => {
      batch2.set(doc(db, 'adjustments', a.id), sanitizeForFirestore(a), { merge: true });
    });
    await batch2.commit();

    return { success: true, message: 'Database Dimsum Mentai 77 berhasil disinkronkan ke Firebase Cloud Firestore!' };
  } catch (err: any) {
    console.error('Seed to Firestore error:', err);
    return { success: false, message: err?.message || 'Gagal menyimpan ke Firebase Firestore.' };
  }
}
