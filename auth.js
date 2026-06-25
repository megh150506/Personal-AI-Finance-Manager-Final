// ============================================================
//  FinanceIQ — Authentication & Multi-User Database
//  auth.js  |  Include in EVERY page
// ============================================================
//
//  DATABASE STRUCTURE (localStorage)
//  ─────────────────────────────────
//  pfm_users   → [ { id, name, email, password(hashed), avatar,
//                    plan, createdAt, lastLogin } ]
//  pfm_session → { userId, name, email, avatar, loginTime }
//  pfm_tx_{userId}      → user's transactions array
//  pfm_budgets_{userId} → user's budgets object
//
// ============================================================

const AUTH = {

  // ── Simple hash (not cryptographic — for demo only) ────────
  // In production: use bcrypt on a real backend server
  hashPassword(pass) {
    let hash = 0;
    const str = pass + 'financeiq_salt_2024';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + str.length.toString(36);
  },

  // ── Get all users ──────────────────────────────────────────
  getUsers() {
    try { return JSON.parse(localStorage.getItem('pfm_users') || '[]'); }
    catch(e) { return []; }
  },

  // ── Save users ─────────────────────────────────────────────
  saveUsers(users) {
    localStorage.setItem('pfm_users', JSON.stringify(users));
  },

  // ── Get current session ────────────────────────────────────
  getSession() {
    try { return JSON.parse(sessionStorage.getItem('pfm_session') || 'null'); }
    catch(e) { return null; }
  },

  // ── Check if logged in; redirect to login if not ───────────
  requireAuth() {
    const session = this.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  },

  // ── Register new user ──────────────────────────────────────
  register({ name, email, password }) {
    const users = this.getUsers();

    // Validation
    if (!name || name.trim().length < 2)
      return { ok: false, error: 'Name must be at least 2 characters.' };
    if (!email || !email.includes('@') || !email.includes('.'))
      return { ok: false, error: 'Please enter a valid email address.' };
    if (!password || password.length < 6)
      return { ok: false, error: 'Password must be at least 6 characters.' };

    // Check duplicate email
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: 'An account with this email already exists.' };

    // Create user
    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    const avatar = name.trim()[0].toUpperCase();
    const newUser = {
      id:        userId,
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password:  this.hashPassword(password),
      avatar,
      plan:      'free',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    users.push(newUser);
    this.saveUsers(users);

    // Seed demo data for new user
    this._seedDemoData(userId, name.trim());

    // Auto-login
    this._startSession(newUser);
    return { ok: true, user: newUser };
  },

  // ── Login ──────────────────────────────────────────────────
  login({ email, password }) {
    const users = this.getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user)
      return { ok: false, error: 'No account found with this email.' };
    if (user.password !== this.hashPassword(password))
      return { ok: false, error: 'Incorrect password. Please try again.' };

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers(users);
    this._startSession(user);
    return { ok: true, user };
  },

  // ── Logout ─────────────────────────────────────────────────
  logout() {
    sessionStorage.removeItem('pfm_session');
    window.location.href = 'login.html';
  },

  // ── Start session ──────────────────────────────────────────
  _startSession(user) {
    const session = {
      userId:    user.id,
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar,
      plan:      user.plan,
      loginTime: new Date().toISOString(),
    };
    sessionStorage.setItem('pfm_session', JSON.stringify(session));
  },

  // ── Get user-scoped storage keys ───────────────────────────
  txKey()     { const s=this.getSession(); return s ? `pfm_tx_${s.userId}`      : 'pfm_tx'; },
  budgetKey() { const s=this.getSession(); return s ? `pfm_budgets_${s.userId}` : 'pfm_budgets'; },

  // ── User's transactions ────────────────────────────────────
  getUserData() {
    try { return JSON.parse(localStorage.getItem(this.txKey()) || '[]'); }
    catch(e) { return []; }
  },
  saveUserData(d) { localStorage.setItem(this.txKey(), JSON.stringify(d)); },

  // ── User's budgets ─────────────────────────────────────────
  getUserBudgets() {
    try { return JSON.parse(localStorage.getItem(this.budgetKey()) || '{}'); }
    catch(e) { return {}; }
  },
  saveUserBudgets(b) { localStorage.setItem(this.budgetKey(), JSON.stringify(b)); },

  // ── List all registered users (admin view) ─────────────────
  getAllUsers() {
    return this.getUsers().map(u => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      avatar:    u.avatar,
      plan:      u.plan,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));
  },

  // ── Seed demo data for new users ──────────────────────────
  _seedDemoData(userId, name) {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = String(now.getMonth()+1).padStart(2,'0');
    const cur = `${y}-${m}`;
    const d   = (day) => `${cur}-${String(Math.min(day,now.getDate())).padStart(2,'0')}`;
    const prev = new Date(y, now.getMonth()-1, 1);
    const py   = prev.getFullYear(), pm = String(prev.getMonth()+1).padStart(2,'0');
    const pd   = (day) => `${py}-${pm}-${String(day).padStart(2,'0')}`;

    const demo = [
      {id:101,type:'income', amount:45000,date:d(1), desc:'Monthly salary',      cat:'Salary'},
      {id:102,type:'expense',amount:8500, date:d(2), desc:'Rent payment',         cat:'Housing'},
      {id:103,type:'expense',amount:2200, date:d(3), desc:'Grocery shopping',     cat:'Food'},
      {id:104,type:'expense',amount:620,  date:d(5), desc:'Uber rides',           cat:'Transport'},
      {id:105,type:'income', amount:8000, date:d(7), desc:'Freelance project',    cat:'Freelance'},
      {id:106,type:'expense',amount:1900, date:d(9), desc:'Zomato orders',        cat:'Food'},
      {id:107,type:'expense',amount:2800, date:d(11),desc:'Clothes shopping',     cat:'Shopping'},
      {id:108,type:'expense',amount:480,  date:d(13),desc:'Movie & OTT',          cat:'Entertainment'},
      {id:109,type:'expense',amount:1200, date:d(15),desc:'Electricity bill',     cat:'Utilities'},
      {id:110,type:'expense',amount:800,  date:d(17),desc:'Doctor consultation',  cat:'Health'},
      {id:201,type:'income', amount:42000,date:pd(1), desc:'Monthly salary',      cat:'Salary'},
      {id:202,type:'expense',amount:8500, date:pd(2), desc:'Rent payment',         cat:'Housing'},
      {id:203,type:'expense',amount:3100, date:pd(5), desc:'Grocery & vegetables', cat:'Food'},
      {id:204,type:'expense',amount:1200, date:pd(8), desc:'Electricity bill',     cat:'Utilities'},
      {id:205,type:'expense',amount:900,  date:pd(12),desc:'Auto & Ola rides',     cat:'Transport'},
      {id:206,type:'income', amount:5000, date:pd(20),desc:'Part-time work',       cat:'Freelance'},
    ];
    localStorage.setItem(`pfm_tx_${userId}`, JSON.stringify(demo));
    localStorage.setItem(`pfm_budgets_${userId}`, JSON.stringify({
      Food:5000, Transport:1500, Housing:9000, Entertainment:1200,
      Health:2000, Shopping:3000, Utilities:2000, Other:1000
    }));
  },
};

// ── Override data.js functions to be user-scoped ────────────
// These replace getData/getBudgets/saveData/saveBudgetData
// so all existing pages work without changes
function getData()           { return AUTH.getUserData(); }
function getBudgets()        { return AUTH.getUserBudgets(); }
function saveData(d)         { AUTH.saveUserData(d); }
function saveBudgetData(b)   { AUTH.saveUserBudgets(b); }
