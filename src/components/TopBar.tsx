import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { formatMonthLabel, NavSection, shiftMonthKey } from '../types/ledger';

interface TopBarProps {
  activeSection: NavSection;
  selectedMonth: string;
  onChangeMonth: (nextMonthKey: string) => void;
  onNewTransaction: () => void;
  onOpenMobileMenu: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  categories: 'Categories',
  reports: 'Monthly Reports',
};

export function TopBar({
  activeSection,
  selectedMonth,
  onChangeMonth,
  onNewTransaction,
  onOpenMobileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 no-print">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Trigger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0B1D3A] hover:bg-[#E2E8F0] transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-[#64748B] hidden sm:inline whitespace-nowrap">Ledger</span>
            <span className="text-[#94A3B8] hidden sm:inline" aria-hidden="true">
              /
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#0B1D3A] truncate">
              {SECTION_LABELS[activeSection]}
            </h1>
          </div>
        </div>

        {/* Center/Right: Month Selector + Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, -1))}
              aria-label="Previous month"
              className="p-1.5 rounded-md text-[#475569] hover:text-[#0B1D3A] hover:bg-[#E2E8F0]/70 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-[#0B1D3A] tabular-nums whitespace-nowrap min-w-[116px] sm:min-w-[138px] text-center">
              {formatMonthLabel(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, 1))}
              aria-label="Next month"
              className="p-1.5 rounded-md text-[#475569] hover:text-[#0B1D3A] hover:bg-[#E2E8F0]/70 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewTransaction}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] active:scale-[0.98] text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
}
