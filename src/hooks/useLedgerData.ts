import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Category,
  MonthlyReport,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/ledger';

function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  notes: string;
  date: string;
  paymentMethod: PaymentMethod;
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  monthlyBudget: number;
}

export interface ReportSnapshotInput {
  monthKey: string;
  title: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  topCategory: string;
  summaryNote: string;
}

export function useLedgerData() {
  const { user, authReady } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setCategories([]);
      setTransactions([]);
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let catsLoaded = false;
    let txsLoaded = false;
    let reportsLoaded = false;

    const markLoaded = () => {
      if (catsLoaded && txsLoaded && reportsLoaded) {
        setLoading(false);
      }
    };

    const catsQuery = query(
      collection(db, 'categories'),
      where('userId', '==', user.uid)
    );
    const unsubCats = onSnapshot(
      catsQuery,
      (snapshot) => {
        const items: Category[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, 'id'>),
        }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(items);
        catsLoaded = true;
        markLoaded();
      },
      (err) => {
        setError('Unable to load categories.');
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'categories');
      }
    );

    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    const unsubTxs = onSnapshot(
      txQuery,
      (snapshot) => {
        const items: Transaction[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }));
        items.sort((a, b) => b.date.localeCompare(a.date));
        setTransactions(items);
        txsLoaded = true;
        markLoaded();
      },
      (err) => {
        setError('Unable to load transactions.');
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'transactions');
      }
    );

    const reportsQuery = query(
      collection(db, 'monthlyReports'),
      where('userId', '==', user.uid)
    );
    const unsubReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const items: MonthlyReport[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MonthlyReport, 'id'>),
        }));
        items.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
        setReports(items);
        reportsLoaded = true;
        markLoaded();
      },
      (err) => {
        setError('Unable to load monthly reports.');
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'monthlyReports');
      }
    );

    return () => {
      unsubCats();
      unsubTxs();
      unsubReports();
    };
  }, [authReady, user]);

  const addTransaction = async (input: TransactionInput) => {
    if (!user) throw new Error('User must be authenticated.');
    const txId = generateSafeId('tx');
    const monthKey = input.date.slice(0, 7);
    const payload = {
      userId: user.uid,
      type: input.type,
      amount: Number(input.amount),
      categoryId: input.categoryId,
      categoryName: input.categoryName.trim().slice(0, 48),
      description: input.description.trim().slice(0, 140),
      notes: input.notes.trim().slice(0, 400),
      date: input.date,
      monthKey,
      paymentMethod: input.paymentMethod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const txRef = doc(db, 'transactions', txId);
    try {
      await setDoc(txRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `transactions/${txId}`);
    }
  };

  const updateTransaction = async (txId: string, input: TransactionInput) => {
    if (!user) throw new Error('User must be authenticated.');
    const monthKey = input.date.slice(0, 7);
    const txRef = doc(db, 'transactions', txId);
    try {
      await updateDoc(txRef, {
        type: input.type,
        amount: Number(input.amount),
        categoryId: input.categoryId,
        categoryName: input.categoryName.trim().slice(0, 48),
        description: input.description.trim().slice(0, 140),
        notes: input.notes.trim().slice(0, 400),
        date: input.date,
        monthKey,
        paymentMethod: input.paymentMethod,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `transactions/${txId}`);
    }
  };

  const deleteTransaction = async (txId: string) => {
    if (!user) throw new Error('User must be authenticated.');
    const txRef = doc(db, 'transactions', txId);
    try {
      await deleteDoc(txRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${txId}`);
    }
  };

  const addCategory = async (input: CategoryInput) => {
    if (!user) throw new Error('User must be authenticated.');
    const catId = generateSafeId('cat');
    const catRef = doc(db, 'categories', catId);
    try {
      await setDoc(catRef, {
        userId: user.uid,
        name: input.name.trim().slice(0, 48),
        type: input.type,
        color: input.color,
        monthlyBudget: Math.max(0, Number(input.monthlyBudget) || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${catId}`);
    }
  };

  const updateCategory = async (catId: string, input: CategoryInput) => {
    if (!user) throw new Error('User must be authenticated.');
    const catRef = doc(db, 'categories', catId);
    try {
      await updateDoc(catRef, {
        name: input.name.trim().slice(0, 48),
        type: input.type,
        color: input.color,
        monthlyBudget: Math.max(0, Number(input.monthlyBudget) || 0),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${catId}`);
    }
  };

  const deleteCategory = async (catId: string) => {
    if (!user) throw new Error('User must be authenticated.');
    const catRef = doc(db, 'categories', catId);
    try {
      await deleteDoc(catRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`);
    }
  };

  const saveMonthlyReport = async (input: ReportSnapshotInput) => {
    if (!user) throw new Error('User must be authenticated.');
    const reportId = `${user.uid}_${input.monthKey}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const existing = reports.find((r) => r.id === reportId);
    const reportRef = doc(db, 'monthlyReports', reportId);

    try {
      if (existing) {
        await updateDoc(reportRef, {
          title: input.title.trim().slice(0, 80),
          totalIncome: Number(input.totalIncome),
          totalExpenses: Number(input.totalExpenses),
          netSavings: Number(input.netSavings),
          transactionCount: Math.round(input.transactionCount),
          topCategory: input.topCategory.slice(0, 48),
          summaryNote: input.summaryNote.trim().slice(0, 500),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(reportRef, {
          userId: user.uid,
          monthKey: input.monthKey,
          title: input.title.trim().slice(0, 80),
          totalIncome: Number(input.totalIncome),
          totalExpenses: Number(input.totalExpenses),
          netSavings: Number(input.netSavings),
          transactionCount: Math.round(input.transactionCount),
          topCategory: input.topCategory.slice(0, 48),
          summaryNote: input.summaryNote.trim().slice(0, 500),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `monthlyReports/${reportId}`);
    }
  };

  const deleteMonthlyReport = async (reportId: string) => {
    if (!user) throw new Error('User must be authenticated.');
    const reportRef = doc(db, 'monthlyReports', reportId);
    try {
      await deleteDoc(reportRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `monthlyReports/${reportId}`);
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  return {
    categories,
    categoryMap,
    transactions,
    reports,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    saveMonthlyReport,
    deleteMonthlyReport,
  };
}
