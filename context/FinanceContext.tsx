import { type Recurrence, shouldExecToday } from '@/utils/format';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

// ──── RE-EXPORTAR para que otros la usen sin importar utils/format ────────────
export type { Recurrence };

// ──── TIPOS ────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type AccountType = 'cash' | 'debit' | 'credit';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  budget?: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  initialBalance?: number;
  // Solo crédito
  limit?: number;
  cutoffDay?: number;
  paymentDay?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  accountId?: string;
  date: string;
  note?: string;
}

export interface QuickTransaction {
  id: string;
  name: string;
  icon: string;
  amount?: number;
  categoryId: string;
  type: TransactionType;
  note?: string;
  recurrence?: Recurrence;   // ← nuevo: config de recurrencia
  lastAutoExec?: string;     // ← nuevo: última auto-ejecución (ISO string)
}

interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  quickTransactions: QuickTransaction[];
  accounts: Account[];
  isLoaded: boolean;
}

type Action =
  | { type: 'LOAD'; payload: FinanceState }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_QUICK'; payload: QuickTransaction }
  | { type: 'UPDATE_QUICK'; payload: QuickTransaction }
  | { type: 'DELETE_QUICK'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string };

// ──── DATOS POR DEFECTO ─────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Comida', icon: 'fast-food', color: '#FF6B35', type: 'expense' },
  { id: 'cat-transport', name: 'Transporte', icon: 'car', color: '#4ECDC4', type: 'expense' },
  { id: 'cat-bills', name: 'Servicios', icon: 'flash', color: '#F5A623', type: 'expense' },
  { id: 'cat-health', name: 'Salud', icon: 'heart', color: '#FF6B9D', type: 'expense' },
  { id: 'cat-leisure', name: 'Ocio', icon: 'game-controller', color: '#C77DFF', type: 'expense' },
  { id: 'cat-shop', name: 'Compras', icon: 'bag', color: '#3483FA', type: 'expense' },
  { id: 'cat-salary', name: 'Salario', icon: 'briefcase', color: '#00A650', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: 'laptop', color: '#00BCD4', type: 'income' },
  { id: 'cat-other-exp', name: 'Otros gastos', icon: 'flag', color: '#999999', type: 'expense' },
  { id: 'cat-other-inc', name: 'Otros ingresos', icon: 'cash', color: '#FFA000', type: 'income' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Efectivo', type: 'cash', icon: 'cash', color: '#00A650', initialBalance: 0 },
  { id: 'acc-debit', name: 'Cuenta Ahorro', type: 'debit', icon: 'card-outline', color: '#3483FA', initialBalance: 0 },
];

export const DEFAULT_QUICK_TRANSACTIONS: QuickTransaction[] = [
  {
    id: 'qt-netflix', name: 'Netflix', icon: 'film', amount: 219,
    categoryId: 'cat-leisure', type: 'expense',
    recurrence: { frequency: 'monthly', dayOfMonth: 1 },
  },
  { id: 'qt-cafe', name: 'Café', icon: 'cafe', amount: 55, categoryId: 'cat-food', type: 'expense' },
  { id: 'qt-uber', name: 'Uber', icon: 'car', categoryId: 'cat-transport', type: 'expense' },
  {
    id: 'qt-spotify', name: 'Spotify', icon: 'musical-notes', amount: 99,
    categoryId: 'cat-leisure', type: 'expense',
    recurrence: { frequency: 'monthly', dayOfMonth: 15 },
  },
  {
    id: 'qt-salario', name: 'Salario', icon: 'briefcase',
    categoryId: 'cat-salary', type: 'income',
    recurrence: { frequency: 'monthly', dayOfMonth: 1 },
  },
];

// ──── REDUCER ────────────────────────────────────────────────────────────────

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'LOAD': return action.payload;
    case 'ADD_TRANSACTION': return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'DELETE_TRANSACTION': return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) };
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map((c) => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter((c) => c.id !== action.payload) };
    case 'ADD_QUICK': return { ...state, quickTransactions: [...state.quickTransactions, action.payload] };
    case 'UPDATE_QUICK': return { ...state, quickTransactions: state.quickTransactions.map((q) => q.id === action.payload.id ? action.payload : q) };
    case 'DELETE_QUICK': return { ...state, quickTransactions: state.quickTransactions.filter((q) => q.id !== action.payload) };
    case 'ADD_ACCOUNT': return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT': return { ...state, accounts: state.accounts.map((a) => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT': return { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) };
    default: return state;
  }
}

// ──── CONTEXTO ────────────────────────────────────────────────────────────────

interface FinanceContextValue extends FinanceState {
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addQuickTransaction: (q: Omit<QuickTransaction, 'id'>) => void;
  updateQuickTransaction: (q: QuickTransaction) => void;
  deleteQuickTransaction: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  getCategoryById: (id: string) => Category | undefined;
  getAccountById: (id: string) => Account | undefined;
  getAccountBalance: (accountId: string) => number;
  getAccountExpense: (accountId: string) => number;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
const STORAGE_KEY = '@finance_app_data_v3';

// ──── HELPERS ────────────────────────────────────────────────────────────────

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ──── PROVIDER ────────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    quickTransactions: DEFAULT_QUICK_TRANSACTIONS,
    accounts: DEFAULT_ACCOUNTS,
    isLoaded: false,
  });

  // ── Cargar datos ──
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as FinanceState;
          dispatch({
            type: 'LOAD',
            payload: {
              ...parsed,
              quickTransactions: parsed.quickTransactions ?? DEFAULT_QUICK_TRANSACTIONS,
              accounts: parsed.accounts ?? DEFAULT_ACCOUNTS,
              isLoaded: true,
            },
          });
        } else {
          dispatch({ type: 'LOAD', payload: { transactions: [], categories: DEFAULT_CATEGORIES, quickTransactions: DEFAULT_QUICK_TRANSACTIONS, accounts: DEFAULT_ACCOUNTS, isLoaded: true } });
        }
      } catch {
        dispatch({ type: 'LOAD', payload: { transactions: [], categories: DEFAULT_CATEGORIES, quickTransactions: DEFAULT_QUICK_TRANSACTIONS, accounts: DEFAULT_ACCOUNTS, isLoaded: true } });
      }
    })();
  }, []);

  // ── Auto-ejecutar recurrentes al abrir la app ──
  useEffect(() => {
    if (!state.isLoaded) return;
    for (const qt of state.quickTransactions) {
      if (!qt.recurrence || !qt.amount) continue;
      if (shouldExecToday(qt.recurrence, qt.lastAutoExec)) {
        const now = new Date().toISOString();
        dispatch({
          type: 'ADD_TRANSACTION',
          payload: {
            id: makeId('tx'),
            type: qt.type,
            amount: qt.amount,
            description: qt.name,
            categoryId: qt.categoryId,
            note: qt.note,
            date: now,
          },
        });
        dispatch({ type: 'UPDATE_QUICK', payload: { ...qt, lastAutoExec: now } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isLoaded]);

  // ── Persistir ──
  useEffect(() => {
    if (!state.isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.error);
  }, [state]);

  // ── Acciones ──
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'date'>) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...t, id: makeId('tx'), date: new Date().toISOString() } });
  }, []);
  const deleteTransaction = useCallback((id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }), []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => dispatch({ type: 'ADD_CATEGORY', payload: { ...c, id: makeId('cat') } }), []);
  const updateCategory = useCallback((c: Category) => dispatch({ type: 'UPDATE_CATEGORY', payload: c }), []);
  const deleteCategory = useCallback((id: string) => dispatch({ type: 'DELETE_CATEGORY', payload: id }), []);

  const addQuickTransaction = useCallback((q: Omit<QuickTransaction, 'id'>) => dispatch({ type: 'ADD_QUICK', payload: { ...q, id: makeId('qt') } }), []);
  const updateQuickTransaction = useCallback((q: QuickTransaction) => dispatch({ type: 'UPDATE_QUICK', payload: q }), []);
  const deleteQuickTransaction = useCallback((id: string) => dispatch({ type: 'DELETE_QUICK', payload: id }), []);

  const addAccount = useCallback((a: Omit<Account, 'id'>) => dispatch({ type: 'ADD_ACCOUNT', payload: { ...a, id: makeId('acc') } }), []);
  const updateAccount = useCallback((a: Account) => dispatch({ type: 'UPDATE_ACCOUNT', payload: a }), []);
  const deleteAccount = useCallback((id: string) => dispatch({ type: 'DELETE_ACCOUNT', payload: id }), []);

  const totalIncome = state.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const getCategoryById = useCallback((id: string) => state.categories.find((c) => c.id === id), [state.categories]);
  const getAccountById = useCallback((id: string) => state.accounts.find((a) => a.id === id), [state.accounts]);

  const getAccountBalance = useCallback((accountId: string) => {
    const acc = state.accounts.find((a) => a.id === accountId);
    const initial = acc?.initialBalance ?? 0;
    const txs = state.transactions.filter((t) => t.accountId === accountId);
    return initial + txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      - txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [state.transactions, state.accounts]);

  const getAccountExpense = useCallback((accountId: string) =>
    state.transactions.filter((t) => t.accountId === accountId && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [state.transactions]);

  return (
    <FinanceContext.Provider value={{
      ...state,
      addTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addQuickTransaction, updateQuickTransaction, deleteQuickTransaction,
      addAccount, updateAccount, deleteAccount,
      totalBalance, totalIncome, totalExpense,
      getCategoryById, getAccountById, getAccountBalance, getAccountExpense,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}
