// ============================================================
//  PERSONAL FINANCE MANAGER — Shared Data & Utilities
//  data.js  |  Include this in EVERY page
// ============================================================

// ── Storage helpers ──────────────────────────────────────────
function getData() {
  try { return JSON.parse(localStorage.getItem('pfm_tx') || '[]'); }
  catch (e) { return []; }
}

function getBudgets() {
  try { return JSON.parse(localStorage.getItem('pfm_budgets') || '{}'); }
  catch (e) { return {}; }
}

function saveData(d) { localStorage.setItem('pfm_tx', JSON.stringify(d)); }
function saveBudgetData(b) { localStorage.setItem('pfm_budgets', JSON.stringify(b)); }

// ── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Salary', 'Freelance', 'Other'
];

const EXPENSE_CATS = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Other'
];

const CAT_COLORS = {
  Food:          '#1D9E75',
  Transport:     '#378ADD',
  Housing:       '#7F77DD',
  Entertainment: '#D85A30',
  Health:        '#D4537E',
  Shopping:      '#BA7517',
  Utilities:     '#3B6D11',
  Salary:        '#185FA5',
  Freelance:     '#533AB7',
  Other:         '#888780'
};

// ── Number helpers ───────────────────────────────────────────
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getSummary(txs) {
  const income  = txs.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function getMonthlyData(txs) {
  const months = {};
  txs.forEach(t => {
    const m = t.date.substring(0, 7);
    if (!months[m]) months[m] = { income: 0, expense: 0 };
    months[m][t.type] += t.amount;
  });
  return months;
}

// ── Seed demo data if empty ──────────────────────────────────
function seedDemoData() {
  if (getData().length > 0) return;
  const today = new Date();
  const m = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const pm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

  const sample = [
    { id: 1,  type: 'income',  amount: 45000, date: `${m}-01`,  desc: 'Monthly salary',        cat: 'Salary'        },
    { id: 2,  type: 'expense', amount: 8500,  date: `${m}-02`,  desc: 'Rent payment',           cat: 'Housing'       },
    { id: 3,  type: 'expense', amount: 2200,  date: `${m}-05`,  desc: 'Grocery shopping',       cat: 'Food'          },
    { id: 4,  type: 'expense', amount: 600,   date: `${m}-07`,  desc: 'Uber rides',             cat: 'Transport'     },
    { id: 5,  type: 'income',  amount: 8000,  date: `${m}-10`,  desc: 'Freelance project',      cat: 'Freelance'     },
    { id: 6,  type: 'expense', amount: 1800,  date: `${m}-12`,  desc: 'Zomato orders',          cat: 'Food'          },
    { id: 7,  type: 'expense', amount: 3000,  date: `${m}-15`,  desc: 'Clothes shopping',       cat: 'Shopping'      },
    { id: 8,  type: 'expense', amount: 500,   date: `${m}-18`,  desc: 'Movie tickets',          cat: 'Entertainment' },
    { id: 9,  type: 'income',  amount: 42000, date: `${pm}-01`, desc: 'Monthly salary',         cat: 'Salary'        },
    { id: 10, type: 'expense', amount: 8500,  date: `${pm}-02`, desc: 'Rent payment',           cat: 'Housing'       },
    { id: 11, type: 'expense', amount: 3100,  date: `${pm}-06`, desc: 'Grocery & vegetables',   cat: 'Food'          },
    { id: 12, type: 'expense', amount: 1200,  date: `${pm}-09`, desc: 'Electricity bill',       cat: 'Utilities'     },
    { id: 13, type: 'expense', amount: 800,   date: `${pm}-14`, desc: 'Doctor visit',           cat: 'Health'        },
    { id: 14, type: 'income',  amount: 5000,  date: `${pm}-20`, desc: 'Part-time tutoring',     cat: 'Freelance'     },
  ];
  saveData(sample);

  saveBudgetData({
    Food: 5000, Transport: 1500, Housing: 9000,
    Entertainment: 1000, Health: 2000, Shopping: 3000,
    Utilities: 2000, Other: 1000
  });
}

// ── Navigation helper (highlight active page link) ───────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

// Shared Chart.js default color resolver
function txtColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--text') || '#333';
}
