import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  FileBarChart2,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CURRENCY_OPTIONS, CurrencyCode, NavSection } from '../types/ledger';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'reports', label: 'Monthly Reports', icon: FileBarChart2 },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, profile, signOutUser, setCurrencyPreference } = useAuth();

  const content = (
    <div className="h-full flex flex-col justify-between bg-[#0B1D3A] border-r border-[#1E3A5F] px-4 py-6 select-none text-[#FFFFFF]">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 mb-8">
          <span className="font-display text-2xl font-semibold tracking-tight text-[#FFFFFF] whitespace-nowrap">
            AI Ledger
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#132B52] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary navigation" className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981] whitespace-nowrap ${
                  isActive
                    ? 'text-[#FFFFFF]'
                    : 'text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#132B52]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-sidebar-indicator"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-lg bg-[#059669]"
                  />
                )}
                <Icon className="relative z-10 w-4 h-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Account */}
      <div className="space-y-4 pt-6 border-t border-[#1E3A5F]">
        <div className="px-2">
          <label
            htmlFor="currency-selector"
            className="block text-xs font-medium text-[#94A3B8] mb-1.5"
          >
            Display Currency
          </label>
          <select
            id="currency-selector"
            value={profile?.currency || 'USD'}
            onChange={(e) => void setCurrencyPreference(e.target.value as CurrencyCode)}
            className="w-full px-3 py-2 rounded-lg bg-[#132B52] border border-[#1E3A5F] text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#10B981] transition-colors cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-[#0B1D3A] text-[#FFFFFF]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="px-2 pt-3 border-t border-[#1E3A5F] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile?.displayName || 'Account avatar'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-[#10B981]/50 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#132B52] border border-[#10B981]/50 flex items-center justify-center text-xs font-semibold text-[#34D399] shrink-0">
                  {(profile?.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#FFFFFF] truncate">
                  {profile?.displayName || user.displayName || 'Member'}
                </p>
                <p className="text-[11px] text-[#94A3B8] truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOutUser()}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#FCA5A5] hover:bg-[#132B52] transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 no-print">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-[#0B1D3A]/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-72 max-w-[85vw] h-full"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
