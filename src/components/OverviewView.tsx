import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Category,
  CurrencyCode,
  formatCurrency,
  formatMonthLabel,
  formatShortMonthLabel,
  getTrailingMonthKeys,
  shiftMonthKey,
  Transaction,
} from '../types/ledger';

interface OverviewViewProps {
  selectedMonth: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  categoryMap: Map<string, Category>;
  onNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => Promise<void>;
  onNavigateTransactions: () => void;
  onNavigateReports: () => void;
}

export function OverviewView({
  selectedMonth,
  currency,
  transactions,
  categoryMap,
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateTransactions,
  onNavigateReports,
}: OverviewViewProps) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey === selectedMonth),
    [transactions, selectedMonth]
  );

  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);

  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of monthTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }

    let prevIncome = 0;
    let prevExpense = 0;
    for (const t of transactions) {
      if (t.monthKey === prevMonthKey) {
        if (t.type === 'income') prevIncome += t.amount;
        else prevExpense += t.amount;
      }
    }

    const net = income - expense;
    const prevNet = prevIncome - prevExpense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return {
      income,
      expense,
      net,
      savingsRate,
      prevIncome,
      prevExpense,
      prevNet,
    };
  }, [monthTransactions, transactions, prevMonthKey]);

  const trailingMonths = useMemo(() => {
    const keys = getTrailingMonthKeys(selectedMonth, 6);
    return keys.map((key) => {
      let inc = 0;
      let exp = 0;
      for (const t of transactions) {
        if (t.monthKey === key) {
          if (t.type === 'income') inc += t.amount;
          else exp += t.amount;
        }
      }
      return {
        monthKey: key,
        label: formatShortMonthLabel(key),
        income: inc,
        expense: exp,
        net: inc - exp,
      };
    });
  }, [selectedMonth, transactions]);

  const maxChartValue = useMemo(() => {
    let maxVal = 0;
    for (const m of trailingMonths) {
      if (m.income > maxVal) maxVal = m.income;
      if (m.expense > maxVal) maxVal = m.expense;
    }
    return maxVal > 0 ? maxVal : 1;
  }, [trailingMonths]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; color: string }>();
    for (const t of monthTransactions) {
      if (t.type !== 'expense') continue;
      const cat = categoryMap.get(t.categoryId);
      const name = cat?.name || t.categoryName;
      const color = cat?.color || '#0B1D3A';
      const current = totals.get(t.categoryId) || { name, amount: 0, color };
      current.amount += t.amount;
      totals.set(t.categoryId, current);
    }
    const list = Array.from(totals.entries())
      .map(([id, val]) => ({
        id,
        ...val,
        share: metrics.expense > 0 ? (val.amount / metrics.expense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return list;
  }, [monthTransactions, categoryMap, metrics.expense]);

  const donutSegments = useMemo(() => {
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return categoryBreakdown.slice(0, 6).map((item) => {
      const fraction = metrics.expense > 0 ? item.amount / metrics.expense : 0;
      const dashLength = fraction * circumference;
      const offset = -accumulated;
      accumulated += dashLength;
      return {
        ...item,
        radius,
        circumference,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: offset,
      };
    });
  }, [categoryBreakdown, metrics.expense]);

  const activeHoverData = useMemo(
    () => trailingMonths.find((m) => m.monthKey === hoveredMonth) || null,
    [trailingMonths, hoveredMonth]
  );

  const recentTransactions = monthTransactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Net Balance',
            value: formatCurrency(metrics.net, currency),
            sub: `${formatMonthLabel(selectedMonth)} surplus / deficit`,
            accent: metrics.net >= 0 ? 'text-[#0B1D3A]' : 'text-[#DC2626]',
          },
          {
            label: 'Monthly Income',
            value: `+ ${formatCurrency(metrics.income, currency)}`,
            sub:
              metrics.prevIncome > 0
                ? `Prior month ${formatCurrency(metrics.prevIncome, currency)}`
                : 'Total inflows recorded',
            accent: 'text-[#059669]',
          },
          {
            label: 'Monthly Expenses',
            value: `- ${formatCurrency(metrics.expense, currency)}`,
            sub:
              metrics.prevExpense > 0
                ? `Prior month ${formatCurrency(metrics.prevExpense, currency)}`
                : 'Total outflows recorded',
            accent: 'text-[#DC2626]',
          },
          {
            label: 'Savings Rate',
            value: `${metrics.savingsRate.toFixed(1)}%`,
            sub: `${monthTransactions.length} ledger ${monthTransactions.length === 1 ? 'entry' : 'entries'}`,
            accent: 'text-[#0B1D3A]',
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: idx * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-[#64748B]">{kpi.label}</span>
            <p className={`mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight ${kpi.accent}`}>
              {kpi.value}
            </p>
            <span className="mt-2 text-xs text-[#64748B]">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Split: 6-Month Cash Flow + Category Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 6-Month Cash Flow Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#0B1D3A]">
                Cash Flow Trend
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Six-month comparison of income and expenses
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0B1D3A]" />
                Expenses
              </span>
            </div>
          </div>

          {/* Interactive Readout Strip */}
          <div className="min-h-[28px] mb-4 flex items-center justify-between text-xs border-b border-[#E2E8F0] pb-2">
            {activeHoverData ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
                <span className="font-sans font-semibold text-[#0B1D3A]">
                  {formatMonthLabel(activeHoverData.monthKey)}
                </span>
                <span className="text-[#059669]">
                  + {formatCurrency(activeHoverData.income, currency)}
                </span>
                <span className="text-[#DC2626]">
                  - {formatCurrency(activeHoverData.expense, currency)}
                </span>
                <span className="text-[#0B1D3A] font-semibold">
                  Net {formatCurrency(activeHoverData.net, currency)}
                </span>
              </div>
            ) : (
              <span className="text-[#64748B]">
                Hover over any month column to inspect monthly totals
              </span>
            )}
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-52 flex items-end justify-between gap-3 sm:gap-5 pt-4">
            {trailingMonths.map((item) => {
              const incHeightPct = Math.max(
                item.income > 0 ? 4 : 0,
                (item.income / maxChartValue) * 100
              );
              const expHeightPct = Math.max(
                item.expense > 0 ? 4 : 0,
                (item.expense / maxChartValue) * 100
              );
              const isSelected = item.monthKey === selectedMonth;

              return (
                <div
                  key={item.monthKey}
                  onMouseEnter={() => setHoveredMonth(item.monthKey)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className={`flex-1 h-full flex flex-col items-center justify-end group cursor-pointer rounded-lg px-1 py-1 transition-colors ${
                    isSelected ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="w-full flex-1 flex items-end justify-center gap-1.5 pb-2">
                    <div className="w-3.5 sm:w-4 h-full flex items-end">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: `${incHeightPct}%`, transformOrigin: 'bottom' }}
                        className="w-full rounded-t-sm bg-[#059669]/90 group-hover:bg-[#059669] transition-colors"
                      />
                    </div>
                    <div className="w-3.5 sm:w-4 h-full flex items-end">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: `${expHeightPct}%`, transformOrigin: 'bottom' }}
                        className="w-full rounded-t-sm bg-[#0B1D3A]/85 group-hover:bg-[#0B1D3A] transition-colors"
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono tabular-nums whitespace-nowrap ${
                      isSelected ? 'text-[#047857] font-semibold' : 'text-[#64748B]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Expense Category Breakdown Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#0B1D3A]">
                Expense Allocation
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Category distribution for {formatMonthLabel(selectedMonth)}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateReports}
              className="text-xs font-semibold text-[#047857] hover:text-[#065F46] transition-colors cursor-pointer whitespace-nowrap"
            >
              Full Report
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-[#64748B] mb-4">
                No expenses recorded for {formatMonthLabel(selectedMonth)}.
              </p>
              <button
                type="button"
                onClick={onNewTransaction}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#047857]/35 text-xs font-semibold text-[#047857] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 my-auto">
              {/* Donut SVG */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r="56"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {donutSegments.map((seg) => (
                    <motion.circle
                      key={seg.id}
                      cx="70"
                      cy="70"
                      r={seg.radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
                    Spent
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#0B1D3A] truncate max-w-full">
                    {formatCurrency(metrics.expense, currency)}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-2.5 min-w-0">
                {categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[#334155] truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono tabular-nums shrink-0">
                      <span className="text-[#64748B]">{cat.share.toFixed(0)}%</span>
                      <span className="text-[#0B1D3A] font-medium">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6"
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#0B1D3A]">
              Recent Entries
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Latest activity in {formatMonthLabel(selectedMonth)}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateTransactions}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#047857] hover:text-[#065F46] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-10 text-center border-t border-[#E2E8F0]">
            <p className="text-sm text-[#64748B] mb-4">
              Your ledger for {formatMonthLabel(selectedMonth)} is empty.
            </p>
            <button
              type="button"
              onClick={onNewTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Entry</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-medium text-[#64748B]">
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {recentTransactions.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs tabular-nums text-[#64748B] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-[#0B1D3A]">{tx.description}</p>
                        <p className="text-xs text-[#64748B]">
                          <span>{isIncome ? 'Income' : 'Expense'}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{tx.paymentMethod}</span>
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-xs text-[#334155]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#0B1D3A' }}
                          />
                          <span>{cat?.name || tx.categoryName}</span>
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                          isIncome ? 'text-[#059669]' : 'text-[#0B1D3A]'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3 pl-4 text-right whitespace-nowrap">
                        {confirmDeleteId === tx.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteTransaction(tx.id);
                                setConfirmDeleteId(null);
                              }}
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
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              aria-label={`Edit ${tx.description}`}
                              className="p-1.5 rounded-md text-[#64748B] hover:text-[#047857] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tx.id)}
                              aria-label={`Delete ${tx.description}`}
                              className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
