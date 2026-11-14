import { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLedgerData, CategoryInput, TransactionInput } from './hooks/useLedgerData';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { Category, getCurrentMonthKey, NavSection, Transaction } from './types/ledger';

function LedgerWorkspace() {
  const { user, profile, authReady } = useAuth();
  const {
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
  } = useLedgerData();

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#059669]/25 border-t-[#059669] animate-spin" />
          <p className="text-xs tracking-widest uppercase text-[#64748B]">
            Preparing Ledger
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  const currency = profile?.currency || 'USD';

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalOpen(true);
  };

  const handleSaveTransaction = async (input: TransactionInput, existingId?: string) => {
    if (existingId) {
      await updateTransaction(existingId, input);
    } else {
      await addTransaction(input);
    }
  };

  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (input: CategoryInput, existingId?: string) => {
    if (existingId) {
      await updateCategory(existingId, input);
    } else {
      await addCategory(input);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1D3A] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          onNewTransaction={handleOpenNewTransaction}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-72 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] animate-pulse" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeSection === 'overview' && (
                    <OverviewView
                      selectedMonth={selectedMonth}
                      currency={currency}
                      transactions={transactions}
                      categoryMap={categoryMap}
                      onNewTransaction={handleOpenNewTransaction}
                      onEditTransaction={handleOpenEditTransaction}
                      onDeleteTransaction={deleteTransaction}
                      onNavigateTransactions={() => setActiveSection('transactions')}
                      onNavigateReports={() => setActiveSection('reports')}
                    />
                  )}

                  {activeSection === 'transactions' && (
                    <TransactionsView
                      selectedMonth={selectedMonth}
                      currency={currency}
                      transactions={transactions}
                      categories={categories}
                      categoryMap={categoryMap}
                      onNewTransaction={handleOpenNewTransaction}
                      onEditTransaction={handleOpenEditTransaction}
                      onDeleteTransaction={deleteTransaction}
                    />
                  )}

                  {activeSection === 'categories' && (
                    <CategoriesView
                      selectedMonth={selectedMonth}
                      currency={currency}
                      categories={categories}
                      transactions={transactions}
                      onNewCategory={handleOpenNewCategory}
                      onEditCategory={handleOpenEditCategory}
                      onDeleteCategory={deleteCategory}
                    />
                  )}

                  {activeSection === 'reports' && (
                    <ReportsView
                      selectedMonth={selectedMonth}
                      currency={currency}
                      transactions={transactions}
                      categories={categories}
                      categoryMap={categoryMap}
                      reports={reports}
                      onSelectMonth={setSelectedMonth}
                      onSaveReport={saveMonthlyReport}
                      onDeleteReport={deleteMonthlyReport}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      <TransactionModal
        open={txModalOpen}
        initialTransaction={editingTransaction}
        categories={categories}
        defaultMonthKey={selectedMonth}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      <CategoryModal
        open={catModalOpen}
        initialCategory={editingCategory}
        onClose={() => setCatModalOpen(false)}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <LedgerWorkspace />
      </AuthProvider>
    </MotionConfig>
  );
}
