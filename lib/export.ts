import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyBudget } from '@/types/budget';
import { formatCurrency } from './calculations';

export const exportToExcel = (monthData: MonthlyBudget, month: string, year: number) => {
  const workbook = XLSX.utils.book_new();

  // Income Sheet
  const incomeData = [
    ['Income', 'Planned', 'Actual'],
    ...monthData.income.map(item => [item.name, item.planned, item.actual]),
    ['Total',
      monthData.income.reduce((sum, item) => sum + item.planned, 0),
      monthData.income.reduce((sum, item) => sum + item.actual, 0)
    ]
  ];
  const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income');

  // Expenses Sheet
  const expensesData = [
    ['Expense', 'Planned', 'Actual', 'Progress', 'Completed'],
    ...monthData.expenses.map(item => [item.name, item.planned, item.actual, `${item.progress}%`, item.completed ? 'Yes' : 'No']),
    ['Total',
      monthData.expenses.reduce((sum, item) => sum + item.planned, 0),
      monthData.expenses.reduce((sum, item) => sum + item.actual, 0),
      '', ''
    ]
  ];
  const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

  // Bills Sheet
  const billsData = [
    ['Bill', 'Planned', 'Actual', 'Progress', 'Due Date', 'Completed'],
    ...monthData.bills.map(item => [item.name, item.planned, item.actual, `${item.progress}%`, item.dueDate || '', item.completed ? 'Yes' : 'No']),
    ['Total',
      monthData.bills.reduce((sum, item) => sum + item.planned, 0),
      monthData.bills.reduce((sum, item) => sum + item.actual, 0),
      '', '', ''
    ]
  ];
  const billsSheet = XLSX.utils.aoa_to_sheet(billsData);
  XLSX.utils.book_append_sheet(workbook, billsSheet, 'Bills');

  // Savings Sheet
  const savingsData = [
    ['Savings', 'Planned', 'Actual', 'Progress'],
    ...monthData.savings.map(item => [item.name, item.planned, item.actual, `${item.progress}%`]),
    ['Total',
      monthData.savings.reduce((sum, item) => sum + item.planned, 0),
      monthData.savings.reduce((sum, item) => sum + item.actual, 0),
      ''
    ]
  ];
  const savingsSheet = XLSX.utils.aoa_to_sheet(savingsData);
  XLSX.utils.book_append_sheet(workbook, savingsSheet, 'Savings');

  // Debt Sheet
  const debtData = [
    ['Debt', 'Planned', 'Actual', 'Progress', 'Completed'],
    ...monthData.debt.map(item => [item.name, item.planned, item.actual, `${item.progress}%`, item.completed ? 'Yes' : 'No']),
    ['Total',
      monthData.debt.reduce((sum, item) => sum + item.planned, 0),
      monthData.debt.reduce((sum, item) => sum + item.actual, 0),
      '', ''
    ]
  ];
  const debtSheet = XLSX.utils.aoa_to_sheet(debtData);
  XLSX.utils.book_append_sheet(workbook, debtSheet, 'Debt');

  // Download
  XLSX.writeFile(workbook, `BudgetBear-${month}-${year}.xlsx`);
};

export const exportToPDF = (monthData: MonthlyBudget, month: string, year: number) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text(`BudgetBear - ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`, 14, 20);

  let yPos = 35;

  // Income Table
  doc.setFontSize(14);
  doc.text('Income', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Planned', 'Actual']],
    body: [
      ...monthData.income.map(item => [item.name, formatCurrency(item.planned), formatCurrency(item.actual)]),
      ['Total',
        formatCurrency(monthData.income.reduce((sum, item) => sum + item.planned, 0)),
        formatCurrency(monthData.income.reduce((sum, item) => sum + item.actual, 0))
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Expenses Table
  doc.text('Expenses', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Planned', 'Actual', 'Progress']],
    body: [
      ...monthData.expenses.map(item => [item.name, formatCurrency(item.planned), formatCurrency(item.actual), `${item.progress}%`]),
      ['Total',
        formatCurrency(monthData.expenses.reduce((sum, item) => sum + item.planned, 0)),
        formatCurrency(monthData.expenses.reduce((sum, item) => sum + item.actual, 0)),
        ''
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [236, 72, 153] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Bills Table
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.text('Bills', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Planned', 'Actual', 'Progress']],
    body: [
      ...monthData.bills.map(item => [item.name, formatCurrency(item.planned), formatCurrency(item.actual), `${item.progress}%`]),
      ['Total',
        formatCurrency(monthData.bills.reduce((sum, item) => sum + item.planned, 0)),
        formatCurrency(monthData.bills.reduce((sum, item) => sum + item.actual, 0)),
        ''
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Savings Table
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.text('Savings', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Planned', 'Actual', 'Progress']],
    body: [
      ...monthData.savings.map(item => [item.name, formatCurrency(item.planned), formatCurrency(item.actual), `${item.progress}%`]),
      ['Total',
        formatCurrency(monthData.savings.reduce((sum, item) => sum + item.planned, 0)),
        formatCurrency(monthData.savings.reduce((sum, item) => sum + item.actual, 0)),
        ''
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Debt Table
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.text('Debt', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Planned', 'Actual', 'Progress']],
    body: [
      ...monthData.debt.map(item => [item.name, formatCurrency(item.planned), formatCurrency(item.actual), `${item.progress}%`]),
      ['Total',
        formatCurrency(monthData.debt.reduce((sum, item) => sum + item.planned, 0)),
        formatCurrency(monthData.debt.reduce((sum, item) => sum + item.actual, 0)),
        ''
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68] },
  });

  // Download
  doc.save(`BudgetBear-${month}-${year}.pdf`);
};

export const exportToDoc = (monthData: MonthlyBudget, month: string, year: number) => {
  // Create HTML content that can be opened as a Word document
  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
    <head><meta charset='utf-8'><title>BudgetBear - ${month} ${year}</title></head>
    <body>
      <h1>BudgetBear - ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}</h1>

      <h2>Income</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Name</th><th>Planned</th><th>Actual</th></tr>
        </thead>
        <tbody>
          ${monthData.income.map(item => `
            <tr><td>${item.name}</td><td>${formatCurrency(item.planned)}</td><td>${formatCurrency(item.actual)}</td></tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(monthData.income.reduce((sum, item) => sum + item.planned, 0))}</strong></td>
            <td><strong>${formatCurrency(monthData.income.reduce((sum, item) => sum + item.actual, 0))}</strong></td>
          </tr>
        </tbody>
      </table>

      <h2>Expenses</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Name</th><th>Planned</th><th>Actual</th><th>Progress</th></tr>
        </thead>
        <tbody>
          ${monthData.expenses.map(item => `
            <tr><td>${item.name}</td><td>${formatCurrency(item.planned)}</td><td>${formatCurrency(item.actual)}</td><td>${item.progress}%</td></tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(monthData.expenses.reduce((sum, item) => sum + item.planned, 0))}</strong></td>
            <td><strong>${formatCurrency(monthData.expenses.reduce((sum, item) => sum + item.actual, 0))}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <h2>Bills</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Name</th><th>Planned</th><th>Actual</th><th>Progress</th><th>Due Date</th></tr>
        </thead>
        <tbody>
          ${monthData.bills.map(item => `
            <tr><td>${item.name}</td><td>${formatCurrency(item.planned)}</td><td>${formatCurrency(item.actual)}</td><td>${item.progress}%</td><td>${item.dueDate || ''}</td></tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(monthData.bills.reduce((sum, item) => sum + item.planned, 0))}</strong></td>
            <td><strong>${formatCurrency(monthData.bills.reduce((sum, item) => sum + item.actual, 0))}</strong></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <h2>Savings</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Name</th><th>Planned</th><th>Actual</th><th>Progress</th></tr>
        </thead>
        <tbody>
          ${monthData.savings.map(item => `
            <tr><td>${item.name}</td><td>${formatCurrency(item.planned)}</td><td>${formatCurrency(item.actual)}</td><td>${item.progress}%</td></tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(monthData.savings.reduce((sum, item) => sum + item.planned, 0))}</strong></td>
            <td><strong>${formatCurrency(monthData.savings.reduce((sum, item) => sum + item.actual, 0))}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <h2>Debt</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Name</th><th>Planned</th><th>Actual</th><th>Progress</th></tr>
        </thead>
        <tbody>
          ${monthData.debt.map(item => `
            <tr><td>${item.name}</td><td>${formatCurrency(item.planned)}</td><td>${formatCurrency(item.actual)}</td><td>${item.progress}%</td></tr>
          `).join('')}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(monthData.debt.reduce((sum, item) => sum + item.planned, 0))}</strong></td>
            <td><strong>${formatCurrency(monthData.debt.reduce((sum, item) => sum + item.actual, 0))}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BudgetBear-${month}-${year}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};
