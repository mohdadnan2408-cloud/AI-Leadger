import { motion } from 'motion/react';
import { ArrowRight, BookOpen, PieChart, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthGate() {
  const { signInWithGoogle, signingIn, authError } = useAuth();

  const capabilities = [
    {
      icon: BookOpen,
      title: 'Income & Expense Ledger',
      desc: 'Record deposits, disbursements, and payment channels with precision.',
    },
    {
      icon: PieChart,
      title: 'Structured Categorization',
      desc: 'Organize spending with custom categories and monthly budget thresholds.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Monthly Reports & CSV Backups',
      desc: 'Generate variance summaries, save monthly archives, and export CSV backups.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1D3A] flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
        {/* Editorial Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col justify-between py-4"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#047857] mb-4">
              Personal Wealth &amp; Cash Flow
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0B1D3A] leading-[1.06] [text-wrap:balance] mb-6">
              AI Ledger
            </h1>
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl">
              An understated, private financial ledger crafted for disciplined cash-flow tracking,
              deliberate categorization, and clear monthly reporting.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[#E2E8F0] space-y-6">
            {capabilities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.1 + idx * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0B1D3A] flex items-center justify-center shrink-0 text-[#34D399]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-sans text-sm font-semibold text-[#0B1D3A]">
                      {item.title}
                    </h2>
                    <p className="text-sm text-[#475569] mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Sign-In Surface */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm rounded-xl p-8 sm:p-10 flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-lg bg-[#ECFDF5] border border-[#059669]/25 flex items-center justify-center text-[#047857] mb-6">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-display text-3xl font-semibold text-[#0B1D3A] mb-2">
              Open Your Ledger
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Sign in with your Google account to access your private transactions, category
              budgets, and archived monthly reports.
            </p>
          </div>

          <div className="my-8">
            {authError && (
              <div
                role="alert"
                className="mb-4 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] leading-relaxed"
              >
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-lg bg-[#047857] hover:bg-[#065F46] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-[#FFFFFF] font-semibold text-sm transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857] whitespace-nowrap"
            >
              <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Private account scope</span>
            <span aria-hidden="true">·</span>
            <span>Real-time sync</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
