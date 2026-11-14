import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import {
  Category,
  getTodayDateString,
  PAYMENT_METHODS,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/ledger';
import { TransactionInput } from '../hooks/useLedgerData';

interface TransactionModalProps {
  open: boolean;
  initialTransaction: Transaction | null;
  categories: Category[];
  defaultMonthKey: string;
  onClose: () => void;
  onSave: (input: TransactionInput, existingId?: string) => Promise<void>;
}

export function TransactionModal({
  open,
  initialTransaction,
  categories,
  defaultMonthKey,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amount));
      setCategoryId(initialTransaction.categoryId);
      setDescription(initialTransaction.description);
      setNotes(initialTransaction.notes || '');
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod);
    } else {
      const defaultType: TransactionType = 'expense';
      setType(defaultType);
      setAmount('');
      const firstExpenseCat = categories.find((c) => c.type === defaultType);
      setCategoryId(firstExpenseCat?.id || '');
      setDescription('');
      setNotes('');
      const today = getTodayDateString();
      setDate(today.startsWith(defaultMonthKey) ? today : `${defaultMonthKey}-01`);
      setPaymentMethod('Credit Card');
    }
  }, [open, initialTransaction, categories, defaultMonthKey]);

  useEffect(() => {
    if (!open) return;
    if (!filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, categoryId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000000000) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length > 140) {
      setFormError('Description is required (up to 140 characters).');
      return;
    }

    const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
    if (!selectedCategory) {
      setFormError('Please select a valid category for this transaction type.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Please provide a valid date.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          type,
          amount: Math.round(parsedAmount * 100) / 100,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          description: trimmedDesc,
          notes: notes.trim().slice(0, 400),
          date,
          paymentMethod,
        },
        initialTransaction?.id
      );
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save transaction. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1D3A]/60 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 id="tx-modal-title" className="font-display text-2xl font-semibold text-[#0B1D3A]">
                {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-lg text-[#64748B] hover:text-[#0B1D3A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <span className="block text-xs font-medium text-[#475569] mb-2">
                  Transaction Type
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                  {(['expense', 'income'] as const).map((option) => {
                    const active = type === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        className={`relative py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'text-[#FFFFFF]'
                            : 'text-[#475569] hover:text-[#0B1D3A]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="tx-type-pill"
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className={`absolute inset-0 rounded-md ${
                              option === 'income' ? 'bg-[#047857]' : 'bg-[#0B1D3A]'
                            }`}
                          />
                        )}
                        <span className="relative z-10">
                          {option === 'income' ? '+ Income' : '- Expense'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tx-amount"
                    className="block text-xs font-medium text-[#475569] mb-1.5"
                  >
                    Amount
                  </label>
                  <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-mono tabular-nums text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tx-date"
                    className="block text-xs font-medium text-[#475569] mb-1.5"
                  >
                    Date
                  </label>
                  <input
                    id="tx-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-mono tabular-nums text-[#0B1D3A] focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tx-description"
                  className="block text-xs font-medium text-[#475569] mb-1.5"
                >
                  Description
                </label>
                <input
                  id="tx-description"
                  type="text"
                  required
                  maxLength={140}
                  placeholder={type === 'income' ? 'e.g., Monthly Salary Deposit' : 'e.g., Grocery Market & Utilities'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tx-category"
                    className="block text-xs font-medium text-[#475569] mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="tx-category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] focus:outline-none focus:border-[#059669] cursor-pointer"
                  >
                    {filteredCategories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tx-method"
                    className="block text-xs font-medium text-[#475569] mb-1.5"
                  >
                    Payment Method
                  </label>
                  <select
                    id="tx-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] focus:outline-none focus:border-[#059669] cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tx-notes"
                  className="block text-xs font-medium text-[#475569] mb-1.5"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="tx-notes"
                  rows={2}
                  maxLength={400}
                  placeholder="Reference number, invoice, or memo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669] resize-none"
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs sm:text-sm font-medium text-[#475569] hover:text-[#0B1D3A] hover:bg-[#F8FAFC] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || filteredCategories.length === 0}
                  className="px-5 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  {saving ? 'Saving...' : initialTransaction ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
