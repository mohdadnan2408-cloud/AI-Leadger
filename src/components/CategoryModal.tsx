import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Category, TransactionType, WARM_CATEGORY_COLORS } from '../types/ledger';
import { CategoryInput } from '../hooks/useLedgerData';

interface CategoryModalProps {
  open: boolean;
  initialCategory: Category | null;
  onClose: () => void;
  onSave: (input: CategoryInput, existingId?: string) => Promise<void>;
}

export function CategoryModal({
  open,
  initialCategory,
  onClose,
  onSave,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState(WARM_CATEGORY_COLORS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState('0');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setColor(initialCategory.color);
      setMonthlyBudget(String(initialCategory.monthlyBudget || 0));
    } else {
      setName('');
      setType('expense');
      setColor(WARM_CATEGORY_COLORS[0]);
      setMonthlyBudget('500');
    }
  }, [open, initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 48) {
      setFormError('Category name must be between 1 and 48 characters.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setFormError('Please select a valid color swatch.');
      return;
    }

    const budgetVal = type === 'expense' ? Number(monthlyBudget) || 0 : 0;
    if (budgetVal < 0 || budgetVal > 100000000) {
      setFormError('Monthly budget must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          name: trimmedName,
          type,
          color,
          monthlyBudget: budgetVal,
        },
        initialCategory?.id
      );
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save category.');
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
            aria-labelledby="cat-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 id="cat-modal-title" className="font-display text-2xl font-semibold text-[#0B1D3A]">
                {initialCategory ? 'Edit Category' : 'New Category'}
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
                  Category Classification
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
                          active ? 'text-[#FFFFFF]' : 'text-[#475569] hover:text-[#0B1D3A]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="cat-type-pill"
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className={`absolute inset-0 rounded-md ${
                              option === 'income' ? 'bg-[#047857]' : 'bg-[#0B1D3A]'
                            }`}
                          />
                        )}
                        <span className="relative z-10">
                          {option === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="cat-name" className="block text-xs font-medium text-[#475569] mb-1.5">
                  Category Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  maxLength={48}
                  placeholder="e.g., Travel & Lodging"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669]"
                />
              </div>

              {type === 'expense' && (
                <div>
                  <label
                    htmlFor="cat-budget"
                    className="block text-xs font-medium text-[#475569] mb-1.5"
                  >
                    Monthly Budget Target (0 for no limit)
                  </label>
                  <input
                    id="cat-budget"
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-mono tabular-nums text-[#0B1D3A] focus:outline-none focus:border-[#059669]"
                  />
                </div>
              )}

              <div>
                <span className="block text-xs font-medium text-[#475569] mb-2">
                  Ledger Color Key
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {WARM_CATEGORY_COLORS.map((swatch) => {
                    const selected = color.toLowerCase() === swatch.toLowerCase();
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        aria-label={`Select color ${swatch}`}
                        style={{ backgroundColor: swatch }}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-[#0B1D3A] ring-offset-2 ring-offset-[#FFFFFF] scale-110'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </div>
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
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs sm:text-sm font-medium text-[#475569] hover:text-[#0B1D3A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : initialCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
