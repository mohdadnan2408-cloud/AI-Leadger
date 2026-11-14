import { Category, CurrencyCode, formatMonthLabel, Transaction } from '../types/ledger';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function exportMonthTransactionsCsv(
  monthKey: string,
  transactions: Transaction[],
  categoryMap: Map<string, Category>,
  currency: CurrencyCode
) {
  const monthTxs = transactions
    .filter((t) => t.monthKey === monthKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of monthTxs) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const headers = [
    'Date',
    'Type',
    'Category',
    'Description',
    'Payment Method',
    `Amount (${currency})`,
    'Notes',
  ];

  const rows = monthTxs.map((t) => [
    escapeCsvCell(t.date),
    escapeCsvCell(t.type),
    escapeCsvCell(categoryMap.get(t.categoryId)?.name || t.categoryName),
    escapeCsvCell(t.description),
    escapeCsvCell(t.paymentMethod),
    escapeCsvCell(t.amount.toFixed(2)),
    escapeCsvCell(t.notes || ''),
  ]);

  const summaryRows = [
    '',
    `Backup Period,${escapeCsvCell(formatMonthLabel(monthKey))}`,
    `Currency,${escapeCsvCell(currency)}`,
    `Transaction Count,${escapeCsvCell(monthTxs.length)}`,
    `Total Income,${escapeCsvCell(totalIncome.toFixed(2))}`,
    `Total Expenses,${escapeCsvCell(totalExpenses.toFixed(2))}`,
    `Net Savings,${escapeCsvCell(netSavings.toFixed(2))}`,
    `Savings Rate,${escapeCsvCell(savingsRate.toFixed(1) + '%')}`,
  ];

  const csvBody = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.join(',')),
    ...summaryRows,
  ].join('\n');

  // Prepend UTF-8 BOM for clean spreadsheet encoding of ₹ and € symbols
  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-ledger-backup-${monthKey}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
