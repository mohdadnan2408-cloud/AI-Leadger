import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Category,
  CurrencyCode,
  formatCurrency,
  formatMonthLabel,
  Transaction,
} from '../types/ledger';

interface CategoriesViewProps {
  selectedMonth: string;
  currency: CurrencyCode;
  categories: Category[];
  transactions: Transaction[];
  onNewCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (catId: string) => Promise<void>;
}

export function CategoriesView({
  selectedMonth,
  currency,
  categories,
  transactions,
  onNewCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoriesViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [blockedDeleteMsg, setBlockedDeleteMsg] = useState<string | null>(null);

  const monthTotalsByCategory = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const t of transactions) {
      if (t.monthKey !== selectedMonth) continue;
      const cur = map.get(t.categoryId) || { amount: 0, count: 0 };
      cur.amount += t.amount;
      cur.count += 1;
      map.set(t.categoryId, cur);
    }
    return map;
  }, [transactions, selectedMonth]);

  const totalTxCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + 1);
    }
    return map;
  }, [transactions]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const handleAttemptDelete = async (cat: Category) => {
    setBlockedDeleteMsg(null);
    const linkedCount = totalTxCountByCategory.get(cat.id) || 0;
    if (linkedCount > 0) {
      setBlockedDeleteMsg(
        `"${cat.name}" is used by ${linkedCount} ${
          linkedCount === 1 ? 'transaction' : 'transactions'
        }. Reassign or remove those transactions before deleting this category.`
      );
      setConfirmDeleteId(null);
      return;
    }
    await onDeleteCategory(cat.id);
    setConfirmDeleteId(null);
  };

  const renderCategorySection = (title: string, subtitle: string, list: Category[]) => (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B1D3A]">{title}</h2>
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-[#64748B] py-6 border-t border-[#E2E8F0]">
          No categories in this group yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((cat) => {
            const monthStats = monthTotalsByCategory.get(cat.id) || { amount: 0, count: 0 };
            const hasBudget = cat.type === 'expense' && cat.monthlyBudget > 0;
            const utilization = hasBudget ? (monthStats.amount / cat.monthlyBudget) * 100 : 0;
            const overBudget = hasBudget && monthStats.amount > cat.monthlyBudget;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#0B1D3A] truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {monthStats.count} {monthStats.count === 1 ? 'entry' : 'entries'} in{' '}
                        {formatMonthLabel(selectedMonth)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDeleteId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAttemptDelete(cat)}
                          className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-[#64748B] hover:text-[#0B1D3A] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditCategory(cat)}
                          aria-label={`Edit ${cat.name}`}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#047857] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(cat.id)}
                          aria-label={`Delete ${cat.name}`}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
                    <span className={overBudget ? 'text-[#DC2626] font-semibold' : 'text-[#0B1D3A] font-medium'}>
                      {formatCurrency(monthStats.amount, currency)}
                    </span>
                    {hasBudget ? (
                      <span className="text-[#64748B]">
                        of {formatCurrency(cat.monthlyBudget, currency)} budget ({utilization.toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="font-sans text-[#64748B]">
                        {cat.type === 'income' ? 'Income stream' : 'No budget cap'}
                      </span>
                    )}
                  </div>

                  {hasBudget && (
                    <div className="h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          width: `${Math.min(100, utilization)}%`,
                          transformOrigin: 'left',
                          backgroundColor: overBudget ? '#DC2626' : '#059669',
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#475569]">
          Organize income streams and expense budgets for {formatMonthLabel(selectedMonth)}.
        </p>
        <button
          type="button"
          onClick={onNewCategory}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {blockedDeleteMsg && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs sm:text-sm text-[#92400E] flex items-center justify-between gap-4"
        >
          <span>{blockedDeleteMsg}</span>
          <button
            type="button"
            onClick={() => setBlockedDeleteMsg(null)}
            className="text-xs font-semibold text-[#0B1D3A] hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {renderCategorySection(
        'Expense Categories',
        'Track monthly spending against optional budget targets',
        expenseCategories
      )}

      {renderCategorySection(
        'Income Categories',
        'Classify salary, freelance retainers, and investment returns',
        incomeCategories
      )}
    </motion.div>
  );
}
