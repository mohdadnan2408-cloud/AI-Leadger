import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpDown, Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  Category,
  CurrencyCode,
  formatCurrency,
  formatMonthLabel,
  Transaction,
} from '../types/ledger';
import { exportMonthTransactionsCsv } from '../utils/exportCsv';

interface TransactionsViewProps {
  selectedMonth: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  categories: Category[];
  categoryMap: Map<string, Category>;
  onNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => Promise<void>;
}

export function TransactionsView({
  selectedMonth,
  currency,
  transactions,
  categories,
  categoryMap,
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeAllMonths, setScopeAllMonths] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const selectedMonthCount = useMemo(
    () => transactions.filter((t) => t.monthKey === selectedMonth).length,
    [transactions, selectedMonth]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions
      .filter((t) => (scopeAllMonths ? true : t.monthKey === selectedMonth))
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === 'all' ? true : t.categoryId === categoryFilter))
      .filter((t) => {
        if (!q) return true;
        return (
          t.description.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'amount') return b.amount - a.amount;
        return b.date.localeCompare(a.date);
      });
  }, [transactions, scopeAllMonths, selectedMonth, typeFilter, categoryFilter, searchQuery, sortBy]);

  const summary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filtered) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { inc, exp, net: inc - exp };
  }, [filtered]);

  const handleExportMonthCsv = () => {
    exportMonthTransactionsCsv(selectedMonth, transactions, categoryMap, currency);
    setExportNotice(
      `Exported ${selectedMonthCount} ${
        selectedMonthCount === 1 ? 'transaction' : 'transactions'
      } for ${formatMonthLabel(selectedMonth)}.`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Filter & Search Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, notes, or category..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0B1D3A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#059669]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Type Filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
              {(['all', 'income', 'expense'] as const).map((option) => {
                const active = typeFilter === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTypeFilter(option)}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active ? 'text-[#FFFFFF]' : 'text-[#475569] hover:text-[#0B1D3A]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tx-filter-pill"
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 rounded-md bg-[#0B1D3A]"
                      />
                    )}
                    <span className="relative z-10 capitalize">
                      {option === 'all' ? 'All' : option === 'income' ? 'Income' : 'Expenses'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown */}
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0B1D3A] focus:outline-none focus:border-[#059669] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Scope Toggle */}
            <button
              type="button"
              onClick={() => setScopeAllMonths((prev) => !prev)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                scopeAllMonths
                  ? 'bg-[#0B1D3A] border-[#0B1D3A] text-[#FFFFFF]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:text-[#0B1D3A]'
              }`}
            >
              {scopeAllMonths ? 'All Months' : formatMonthLabel(selectedMonth)}
            </button>

            {/* Sort Button */}
            <button
              type="button"
              onClick={() => setSortBy((s) => (s === 'date' ? 'amount' : 'date'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:text-[#0B1D3A] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortBy === 'date' ? 'Newest' : 'Highest Amount'}</span>
            </button>

            {/* Monthly CSV Backup Button */}
            <button
              type="button"
              onClick={handleExportMonthCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#047857]/35 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-xs font-semibold text-[#047857] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Month CSV</span>
            </button>
          </div>
        </div>

        {/* Filtered Totals Line */}
        <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#64748B]">
              Showing <strong className="font-mono text-[#0B1D3A]">{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'transaction' : 'transactions'}
            </span>
            {exportNotice && (
              <span className="text-[#047857] font-medium">
                · {exportNotice}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
            <span className="text-[#059669]">Income + {formatCurrency(summary.inc, currency)}</span>
            <span className="text-[#DC2626]">Expenses - {formatCurrency(summary.exp, currency)}</span>
            <span className="text-[#0B1D3A] font-semibold">
              Net {formatCurrency(summary.net, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-[#64748B] mb-4">
              No transactions match your current filters.
            </p>
            <button
              type="button"
              onClick={onNewTransaction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-medium text-[#64748B]">
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 px-4">Description &amp; Memo</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {filtered.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 pr-4 font-mono text-xs tabular-nums text-[#64748B] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="text-sm font-medium text-[#0B1D3A]">{tx.description}</p>
                        {tx.notes && (
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                            {tx.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-xs text-[#334155]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#0B1D3A' }}
                          />
                          <span>{cat?.name || tx.categoryName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#64748B] whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                          isIncome ? 'text-[#059669]' : 'text-[#0B1D3A]'
                        }`}
                      >
                        <span className="text-[11px] font-sans font-normal text-[#64748B] mr-2">
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
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
      </div>
    </motion.div>
  );
}
