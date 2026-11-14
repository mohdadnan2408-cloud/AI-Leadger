export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'Bank Transfer'
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Digital Wallet'
  | 'Other';

export type NavSection = 'overview' | 'transactions' | 'categories' | 'reports';

export interface UserProfile {
  uid: string;
  displayName: string;
  currency: CurrencyCode;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  monthlyBudget: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  notes: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  paymentMethod: PaymentMethod;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MonthlyReport {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  title: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  transactionCount: number;
  topCategory: string;
  summaryNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
];

export const ALLOWED_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR'];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Digital Wallet',
  'Other',
];

export const WARM_CATEGORY_COLORS: string[] = [
  '#059669', // Emerald Green
  '#0B1D3A', // Deep Navy
  '#0284C7', // Cerulean Blue
  '#0D9488', // Deep Teal
  '#1D4ED8', // Cobalt Blue
  '#16A34A', // Forest Green
  '#D97706', // Warm Amber
  '#334155', // Slate Navy
  '#0369A1', // Maritime Blue
  '#047857', // Dark Emerald
];

export interface DefaultCategorySeed {
  idSuffix: string;
  name: string;
  type: TransactionType;
  color: string;
  monthlyBudget: number;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { idSuffix: 'salary', name: 'Salary & Retainer', type: 'income', color: '#059669', monthlyBudget: 0 },
  { idSuffix: 'consulting', name: 'Freelance & Advisory', type: 'income', color: '#0D9488', monthlyBudget: 0 },
  { idSuffix: 'dividends', name: 'Investments & Yields', type: 'income', color: '#0284C7', monthlyBudget: 0 },
  { idSuffix: 'housing', name: 'Housing & Utilities', type: 'expense', color: '#0B1D3A', monthlyBudget: 2000 },
  { idSuffix: 'dining', name: 'Dining & Provisions', type: 'expense', color: '#059669', monthlyBudget: 750 },
  { idSuffix: 'transport', name: 'Transit & Travel', type: 'expense', color: '#0284C7', monthlyBudget: 400 },
  { idSuffix: 'subscriptions', name: 'Software & Subscriptions', type: 'expense', color: '#1D4ED8', monthlyBudget: 200 },
  { idSuffix: 'wellness', name: 'Health & Wellness', type: 'expense', color: '#0D9488', monthlyBudget: 300 },
  { idSuffix: 'personal', name: 'Personal & Leisure', type: 'expense', color: '#334155', monthlyBudget: 450 },
];

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const safeCurrency: CurrencyCode = ALLOWED_CURRENCIES.includes(currency) ? currency : 'USD';
  const locale = safeCurrency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTrailingMonthKeys(anchorMonthKey: string, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(shiftMonthKey(anchorMonthKey, -i));
  }
  return keys;
}
