import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookmarkCheck, Download, Printer, Trash2 } from 'lucide-react';
import {
  Category,
  CurrencyCode,
  formatCurrency,
  formatMonthLabel,
  MonthlyReport,
  Transaction,
} from '../types/ledger';
import { ReportSnapshotInput } from '../hooks/useLedgerData';
import { exportMonthTransactionsCsv } from '../utils/exportCsv';

interface ReportsViewProps {
  selectedMonth: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  categories: Category[];
  categoryMap: Map<string, Category>;
  reports: MonthlyReport[];
  onSelectMonth: (monthKey: string) => void;
  onSaveReport: (input: ReportSnapshotInput) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
}

export function ReportsView({
  selectedMonth,
  currency,
  transactions,
  categories,
  categoryMap,
  reports,
  onSelectMonth,
  onSaveReport,
  onDeleteReport,
}: ReportsViewProps) {
  const existingSnapshot = useMemo(
    () => reports.find((r) => r.monthKey === selectedMonth) || null,
    [reports, selectedMonth]
  );

  const [summaryNote, setSummaryNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setSummaryNote(existingSnapshot?.summaryNote || '');
    setSavedNotice(null);
  }, [selectedMonth, existingSnapshot]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey === selectedMonth),
    [transactions, selectedMonth]
  );

  const reportStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    const expenseByCat = new Map<string, { name: string; color: string; budget: number; actual: number; count: number }>();
    for (const c of categories) {
      if (c.type === 'expense') {
        expenseByCat.set(c.id, {
          name: c.name,
          color: c.color,
          budget: c.monthlyBudget || 0,
          actual: 0,
          count: 0,
        });
      }
    }

    const incomeByCat = new Map<string, { name: string; color: string; actual: number; count: number }>();
    const byPaymentMethod = new Map<string, { count: number; total: number }>();

    for (const t of monthTransactions) {
      const cat = categoryMap.get(t.categoryId);
      if (t.type === 'income') {
        totalIncome += t.amount;
        const cur = incomeByCat.get(t.categoryId) || {
          name: cat?.name || t.categoryName,
          color: cat?.color || '#059669',
          actual: 0,
          count: 0,
        };
        cur.actual += t.amount;
        cur.count += 1;
        incomeByCat.set(t.categoryId, cur);
      } else {
        totalExpenses += t.amount;
        const cur = expenseByCat.get(t.categoryId) || {
          name: cat?.name || t.categoryName,
          color: cat?.color || '#0B1D3A',
          budget: cat?.monthlyBudget || 0,
          actual: 0,
          count: 0,
        };
        cur.actual += t.amount;
        cur.count += 1;
        expenseByCat.set(t.categoryId, cur);
      }

      const pm = byPaymentMethod.get(t.paymentMethod) || { count: 0, total: 0 };
      pm.count += 1;
      pm.total += t.amount;
      byPaymentMethod.set(t.paymentMethod, pm);
    }

    const expenseRows = Array.from(expenseByCat.values())
      .filter((r) => r.actual > 0 || r.budget > 0)
      .sort((a, b) => b.actual - a.actual);

    const incomeRows = Array.from(incomeByCat.values()).sort((a, b) => b.actual - a.actual);
    const paymentRows = Array.from(byPaymentMethod.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.total - a.total);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const [y, m] = selectedMonth.split('-').map(Number);
    const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 30;
    const avgDailyExpense = totalExpenses / daysInMonth;
    const topCategory = expenseRows[0]?.actual ? expenseRows[0].name : 'None';

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      avgDailyExpense,
      topCategory,
      expenseRows,
      incomeRows,
      paymentRows,
    };
  }, [monthTransactions, categories, categoryMap, selectedMonth]);

  const handleSaveSnapshot = async () => {
    setSaving(true);
    setSavedNotice(null);
    try {
      await onSaveReport({
        monthKey: selectedMonth,
        title: `${formatMonthLabel(selectedMonth)} Financial Report`,
        totalIncome: Math.round(reportStats.totalIncome * 100) / 100,
        totalExpenses: Math.round(reportStats.totalExpenses * 100) / 100,
        netSavings: Math.round(reportStats.netSavings * 100) / 100,
        transactionCount: monthTransactions.length,
        topCategory: reportStats.topCategory,
        summaryNote,
      });
      setSavedNotice(`Saved ${formatMonthLabel(selectedMonth)} snapshot to your archive.`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    exportMonthTransactionsCsv(selectedMonth, transactions, categoryMap, currency);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Report Header & Export Actions */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 print-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#047857]">
              Monthly Statement
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#0B1D3A] print-text-dark mt-1">
              {formatMonthLabel(selectedMonth)} Report
            </h2>
            <p className="text-xs text-[#64748B] print-text-muted mt-1">
              {monthTransactions.length} verified{' '}
              {monthTransactions.length === 1 ? 'transaction' : 'transactions'} · Currency {currency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#0B1D3A] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#047857]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#0B1D3A] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#0B1D3A]" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSaveSnapshot()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] disabled:opacity-50 text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : existingSnapshot ? 'Update Snapshot' : 'Save Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Executive Figures Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-6">
          <div>
            <span className="text-xs text-[#64748B] print-text-muted">Total Income</span>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#059669]">
              + {formatCurrency(reportStats.totalIncome, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#64748B] print-text-muted">Total Expenses</span>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#DC2626]">
              - {formatCurrency(reportStats.totalExpenses, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#64748B] print-text-muted">Net Savings</span>
            <p
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                reportStats.netSavings >= 0 ? 'text-[#0B1D3A]' : 'text-[#DC2626]'
              }`}
            >
              {formatCurrency(reportStats.netSavings, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#64748B] print-text-muted">Avg. Daily Spend</span>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#0B1D3A] print-text-dark">
              {formatCurrency(reportStats.avgDailyExpense, currency)}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#64748B] print-text-muted">Top Expense Driver</span>
            <p className="mt-1 text-sm font-semibold text-[#0B1D3A] print-text-dark truncate">
              {reportStats.topCategory}
            </p>
          </div>
        </div>
      </div>

      {/* Category Variance Table + Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 print-surface">
          <h3 className="font-display text-2xl font-semibold text-[#0B1D3A] print-text-dark mb-1">
            Expense Budget &amp; Variance
          </h3>
          <p className="text-xs text-[#64748B] print-text-muted mb-5">
            Category performance compared against monthly budget targets
          </p>

          {reportStats.expenseRows.length === 0 ? (
            <p className="text-sm text-[#64748B] py-6">
              No expense activity or category budgets recorded for this month.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[11px] font-medium text-[#64748B]">
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Budget</th>
                    <th className="py-2.5 px-4 text-right">Actual</th>
                    <th className="py-2.5 px-4 text-right">Variance</th>
                    <th className="py-2.5 pl-4 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {reportStats.expenseRows.map((row) => {
                    const hasBudget = row.budget > 0;
                    const variance = hasBudget ? row.budget - row.actual : 0;
                    const share =
                      reportStats.totalExpenses > 0
                        ? (row.actual / reportStats.totalExpenses) * 100
                        : 0;
                    return (
                      <tr key={row.name}>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-[#0B1D3A] print-text-dark">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: row.color }}
                            />
                            <span>{row.name}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#64748B]">
                          {hasBudget ? formatCurrency(row.budget, currency) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-[#0B1D3A] print-text-dark">
                          {formatCurrency(row.actual, currency)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono text-xs tabular-nums ${
                            !hasBudget
                              ? 'text-[#64748B]'
                              : variance >= 0
                              ? 'text-[#059669]'
                              : 'text-[#DC2626]'
                          }`}
                        >
                          {hasBudget
                            ? `${variance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(variance), currency)}`
                            : '—'}
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-xs tabular-nums text-[#64748B]">
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Income Sources & Payment Methods */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 print-surface">
            <h3 className="font-display text-xl font-semibold text-[#0B1D3A] print-text-dark mb-4">
              Income Breakdown
            </h3>
            {reportStats.incomeRows.length === 0 ? (
              <p className="text-xs text-[#64748B]">No income recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {reportStats.incomeRows.map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155] truncate">{row.name}</span>
                    <span className="font-mono font-semibold tabular-nums text-[#059669] shrink-0">
                      + {formatCurrency(row.actual, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 print-surface">
            <h3 className="font-display text-xl font-semibold text-[#0B1D3A] print-text-dark mb-4">
              Payment Channels
            </h3>
            {reportStats.paymentRows.length === 0 ? (
              <p className="text-xs text-[#64748B]">No activity recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {reportStats.paymentRows.map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#334155]">
                      {pm.method}{' '}
                      <span className="text-[#64748B]">({pm.count})</span>
                    </span>
                    <span className="font-mono tabular-nums text-[#0B1D3A] font-medium print-text-dark">
                      {formatCurrency(pm.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commentary & Snapshot Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#0B1D3A]">
              Monthly Review Note
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Attach observations or budget adjustments before saving your monthly snapshot
            </p>
          </div>
          <textarea
            rows={4}
            maxLength={500}
            value={summaryNote}
            onChange={(e) => setSummaryNote(e.target.value)}
            placeholder="Summarize notable expenses, savings milestones, or next month's targets..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669] resize-none"
          />
          {savedNotice && (
            <p className="text-xs font-medium text-[#047857]">{savedNotice}</p>
          )}
        </div>

        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#0B1D3A]">
              Archived Monthly Snapshots
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Saved reports persisted to your ledger
            </p>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-[#64748B] py-6">
              No snapshots archived yet. Click &ldquo;Save Snapshot&rdquo; above to preserve a
              monthly record.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F5F9] max-h-56 overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMonth(rep.monthKey)}
                    className="text-left min-w-0 hover:text-[#047857] transition-colors cursor-pointer"
                  >
                    <p className="font-semibold text-[#0B1D3A] truncate">{rep.title}</p>
                    <p className="text-[#64748B] font-mono tabular-nums mt-0.5">
                      Net {formatCurrency(rep.netSavings, currency)} · {rep.transactionCount} entries
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteReport(rep.id)}
                    aria-label={`Delete ${rep.title}`}
                    className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
