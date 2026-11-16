import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

type UserRole = 'vendor' | 'admin';
type BanknoteDenomination = 50000 | 20000 | 10000 | 5000 | 2000 | 1000;
type BanknoteOutcome =
  | 'verified_checklist'
  | 'further_verification_needed'
  | 'suspicious_indicators';
type MobileMoneyProvider = 'MTN Mobile Money' | 'Airtel Money';
type MobileMoneyOutcome = 'verified_demo' | 'suspicious' | 'unable_to_verify';
type ReportStatus =
  | 'Pending Review'
  | 'Under Investigation'
  | 'Confirmed Fraud'
  | 'Dismissed';
type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertCategory = 'Security Advisory' | 'Activity Alert' | 'Report Update';

interface StoredUser {
  id: string;
  name: string;
  phone: string;
  marketLocation: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

interface BanknoteChecklist {
  watermarkVisible: boolean;
  securityThreadIntact: boolean;
  raisedPrintFelt: boolean;
  colorShiftFoilObserved: boolean;
  paperQualityCrisp: boolean;
}

interface BanknoteCheckRecord {
  id: string;
  userId: string;
  userName: string;
  denomination: BanknoteDenomination;
  checklist: BanknoteChecklist;
  serialPrefix: string;
  notes: string;
  imageEvidence?: string;
  outcome: BanknoteOutcome;
  summary: string;
  createdAt: string;
}

interface MobileMoneyCheckRecord {
  id: string;
  userId: string;
  userName: string;
  provider: MobileMoneyProvider;
  transactionRef: string;
  amount: number;
  senderPhone: string;
  senderName: string;
  smsText: string;
  outcome: MobileMoneyOutcome;
  findings: string[];
  createdAt: string;
}

interface FraudReport {
  id: string;
  caseNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  fraudType: string;
  description: string;
  transactionRef: string;
  amount: number | null;
  location: string;
  suspectPhone: string;
  evidenceImage?: string;
  status: ReportStatus;
  reviewerNote: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface AlertItem {
  id: string;
  userId: string | 'all';
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  marketScope: string;
  readBy: string[];
  createdAt: string;
}

interface DemoLedgerEntry {
  provider: MobileMoneyProvider;
  transactionRef: string;
  amount: number;
  senderPhone: string;
  senderName: string;
  status: 'valid' | 'flagged';
  flagReason?: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  banknoteChecks: BanknoteCheckRecord[];
  mobileMoneyChecks: MobileMoneyCheckRecord[];
  fraudReports: FraudReport[];
  alerts: AlertItem[];
}

interface AuthRequest extends Request {
  authUser?: StoredUser;
}

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vendorguard-db.json');
const TOKEN_SECRET =
  process.env.SESSION_SECRET || 'vendorguard-uganda-market-shield-2026';

const DEMO_LEDGER: DemoLedgerEntry[] = [
  {
    provider: 'MTN Mobile Money',
    transactionRef: 'MTN-88492014',
    amount: 45000,
    senderPhone: '0774819203',
    senderName: 'Grace Achieng',
    status: 'valid',
  },
  {
    provider: 'MTN Mobile Money',
    transactionRef: 'MTN-91044382',
    amount: 120000,
    senderPhone: '0782334190',
    senderName: 'Moses Kato',
    status: 'valid',
  },
  {
    provider: 'Airtel Money',
    transactionRef: 'AIR-55210944',
    amount: 85000,
    senderPhone: '0752618842',
    senderName: 'Prossy Nakato',
    status: 'valid',
  },
  {
    provider: 'Airtel Money',
    transactionRef: 'AIR-77310429',
    amount: 30000,
    senderPhone: '0701442918',
    senderName: 'Ronald Ssemogerere',
    status: 'valid',
  },
  {
    provider: 'MTN Mobile Money',
    transactionRef: 'MTN-00019283',
    amount: 150000,
    senderPhone: '0779112045',
    senderName: 'Unknown Sender',
    status: 'flagged',
    flagReason:
      'Reference MTN-00019283 matches a known spoofed SMS template reported in Nakasero Market.',
  },
  {
    provider: 'Airtel Money',
    transactionRef: 'AIR-99812004',
    amount: 65000,
    senderPhone: '0750998121',
    senderName: 'Edited SMS',
    status: 'flagged',
    flagReason:
      'Reference AIR-99812004 has been flagged for repeated duplicate submission across multiple stalls.',
  },
];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length === 12) {
    return '0' + digits.slice(3);
  }
  return digits;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { uid?: string };
    return parsed.uid || null;
  } catch {
    return null;
  }
}

function createSeedDatabase(): DatabaseSchema {
  const now = Date.now();
  const isoAgo = (minutes: number) =>
    new Date(now - minutes * 60_000).toISOString();

  const vendorId = 'usr_vendor_demo';
  const adminId = 'usr_admin_demo';

  return {
    users: [
      {
        id: vendorId,
        name: 'Sarah Namukasa',
        phone: '0772104582',
        marketLocation: 'Owino Market — Stall B14',
        role: 'vendor',
        passwordHash: hashPassword('vendor123'),
        createdAt: isoAgo(60 * 24 * 12),
      },
      {
        id: adminId,
        name: 'David Kigozi',
        phone: '0700990100',
        marketLocation: 'Kampala Market Security Desk',
        role: 'admin',
        passwordHash: hashPassword('admin123'),
        createdAt: isoAgo(60 * 24 * 30),
      },
    ],
    banknoteChecks: [
      {
        id: 'bn_seed_1',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        denomination: 50000,
        checklist: {
          watermarkVisible: true,
          securityThreadIntact: true,
          raisedPrintFelt: true,
          colorShiftFoilObserved: true,
          paperQualityCrisp: true,
        },
        serialPrefix: 'BF49',
        notes: 'Checked at produce stall before packing matooke.',
        outcome: 'verified_checklist',
        summary:
          'All 5 Bank of Uganda security features confirmed during physical inspection.',
        createdAt: isoAgo(140),
      },
      {
        id: 'bn_seed_2',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        denomination: 20000,
        checklist: {
          watermarkVisible: false,
          securityThreadIntact: false,
          raisedPrintFelt: false,
          colorShiftFoilObserved: true,
          paperQualityCrisp: false,
        },
        serialPrefix: 'AC11',
        notes: 'Smooth glossy feel, missing Crested Crane watermark.',
        outcome: 'suspicious_indicators',
        summary:
          'Multiple counterfeit indicators detected: missing Crested Crane watermark, missing tactile intaglio print, and smooth paper texture.',
        createdAt: isoAgo(420),
      },
    ],
    mobileMoneyChecks: [
      {
        id: 'mm_seed_1',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        provider: 'MTN Mobile Money',
        transactionRef: 'MTN-88492014',
        amount: 45000,
        senderPhone: '0774819203',
        senderName: 'Grace Achieng',
        smsText:
          'You have received UGX 45,000 from Grace Achieng (256774819203). Txn ID: MTN-88492014.',
        outcome: 'verified_demo',
        findings: [
          'Transaction reference MTN-88492014 and amount UGX 45,000 match the demonstration ledger.',
          'Remember to verify actual balance receipt on your own phone via *165# before handing over goods.',
        ],
        createdAt: isoAgo(95),
      },
      {
        id: 'mm_seed_2',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        provider: 'Airtel Money',
        transactionRef: 'AIR-99812004',
        amount: 65000,
        senderPhone: '0750998121',
        senderName: 'Edited SMS',
        smsText:
          'AIRTEL: You received 65000 from 0750998121. Click link or call back to reverse extra.',
        outcome: 'suspicious',
        findings: [
          'Reference AIR-99812004 has been flagged for repeated duplicate submission across multiple stalls.',
          'SMS text contains social-engineering reversal language and non-standard Airtel Money formatting.',
        ],
        createdAt: isoAgo(310),
      },
    ],
    fraudReports: [
      {
        id: 'rep_seed_1',
        caseNumber: 'VG-2026-4108',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        userPhone: '0772104582',
        fraudType: 'Counterfeit Banknote',
        description:
          'Customer attempted to pay with a faded UGX 20,000 note (serial prefix AC11) that lacked the Crested Crane watermark and felt overly smooth.',
        transactionRef: 'AC11-20000',
        amount: 20000,
        location: 'Owino Market — Produce Wing',
        suspectPhone: '',
        status: 'Under Investigation',
        reviewerNote:
          'Logged with Owino market committee. Similar AC11 notes spotted near gate 3.',
        reviewedBy: 'David Kigozi',
        createdAt: isoAgo(400),
        updatedAt: isoAgo(180),
      },
      {
        id: 'rep_seed_2',
        caseNumber: 'VG-2026-4119',
        userId: vendorId,
        userName: 'Sarah Namukasa',
        userPhone: '0772104582',
        fraudType: 'Fake Mobile Money SMS',
        description:
          'Buyer showed a forwarded Airtel Money confirmation SMS from an ordinary 0750 number claiming UGX 65,000 was sent, but *185# balance showed zero.',
        transactionRef: 'AIR-99812004',
        amount: 65000,
        location: 'Owino Market — Stall B14',
        suspectPhone: '0750998121',
        status: 'Pending Review',
        reviewerNote: '',
        createdAt: isoAgo(290),
        updatedAt: isoAgo(290),
      },
    ],
    alerts: [
      {
        id: 'alt_seed_1',
        userId: 'all',
        title: 'Counterfeit UGX 50,000 & UGX 20,000 Circulation Warning',
        message:
          'Multiple Kampala markets reported smooth-paper UGX 50,000 and UGX 20,000 notes lacking the color-shifting security thread. Always tilt notes and hold against daylight to confirm the Crested Crane watermark.',
        severity: 'critical',
        category: 'Security Advisory',
        marketScope: 'Kampala Central Markets',
        readBy: [],
        createdAt: isoAgo(75),
      },
      {
        id: 'alt_seed_2',
        userId: 'all',
        title: 'Fake Mobile Money Reversal Scam Alert',
        message:
          'Fraudsters send fake SMS alerts claiming an accidental overpayment (e.g. UGX 500,000 instead of UGX 50,000) and pressure vendors to send change immediately. Always dial *165# (MTN) or *185# (Airtel) to verify actual balance first.',
        severity: 'warning',
        category: 'Security Advisory',
        marketScope: 'All Ugandan Markets',
        readBy: [],
        createdAt: isoAgo(220),
      },
      {
        id: 'alt_seed_3',
        userId: vendorId,
        title: 'Report VG-2026-4108 Updated to Under Investigation',
        message:
          'Security Desk note: Logged with Owino market committee. Similar AC11 notes spotted near gate 3.',
        severity: 'info',
        category: 'Report Update',
        marketScope: 'Personal Update',
        readBy: [],
        createdAt: isoAgo(180),
      },
    ],
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

let db: DatabaseSchema = loadDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_FILE);
}

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    marketLocation: u.marketLocation,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required.' });
    return;
  }
  next();
}

function buildUserHistory(userId: string) {
  const banknoteItems = db.banknoteChecks
    .filter((b) => b.userId === userId)
    .map((b) => ({
      id: b.id,
      kind: 'banknote' as const,
      title: `UGX ${b.denomination.toLocaleString()} Banknote Inspection`,
      subtitle: b.serialPrefix ? `Serial ${b.serialPrefix} · Bank of Uganda Note` : 'Bank of Uganda Note',
      amount: b.denomination,
      statusLabel:
        b.outcome === 'verified_checklist'
          ? 'Verified in Checklist'
          : b.outcome === 'further_verification_needed'
            ? 'Needs Further Check'
            : 'Suspicious Indicators',
      statusTone:
        b.outcome === 'verified_checklist'
          ? ('verified' as const)
          : b.outcome === 'further_verification_needed'
            ? ('warning' as const)
            : ('danger' as const),
      description: b.summary,
      createdAt: b.createdAt,
      raw: b,
    }));

  const momoItems = db.mobileMoneyChecks
    .filter((m) => m.userId === userId)
    .map((m) => ({
      id: m.id,
      kind: 'mobile_money' as const,
      title: `${m.provider} Verification`,
      subtitle: `Ref ${m.transactionRef}${m.senderName ? ` · ${m.senderName}` : ''}`,
      amount: m.amount,
      statusLabel:
        m.outcome === 'verified_demo'
          ? 'Verified in Demo'
          : m.outcome === 'suspicious'
            ? 'Suspicious Transaction'
            : 'Unable to Verify',
      statusTone:
        m.outcome === 'verified_demo'
          ? ('verified' as const)
          : m.outcome === 'suspicious'
            ? ('danger' as const)
            : ('warning' as const),
      description: m.findings[0] || 'Mobile money transaction checked.',
      createdAt: m.createdAt,
      raw: m,
    }));

  const reportItems = db.fraudReports
    .filter((r) => r.userId === userId)
    .map((r) => ({
      id: r.id,
      kind: 'fraud_report' as const,
      title: `${r.fraudType} Report`,
      subtitle: `${r.caseNumber}${r.location ? ` · ${r.location}` : ''}`,
      amount: r.amount,
      statusLabel: r.status,
      statusTone:
        r.status === 'Confirmed Fraud'
          ? ('danger' as const)
          : r.status === 'Under Investigation' || r.status === 'Pending Review'
            ? ('warning' as const)
            : ('neutral' as const),
      description: r.description,
      createdAt: r.createdAt,
      raw: r,
    }));

  return [...banknoteItems, ...momoItems, ...reportItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function getUserAlerts(userId: string) {
  return db.alerts
    .filter((a) => a.userId === 'all' || a.userId === userId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/downloads', (_req, res) => {
    const apkPath = path.resolve(process.cwd(), 'VendorGuard.apk');
    const zipPath = path.resolve(process.cwd(), 'VendorGuard-package.zip');
    res.json({
      apkAvailable: fs.existsSync(apkPath),
      zipAvailable: fs.existsSync(zipPath),
      apkSizeBytes: fs.existsSync(apkPath) ? fs.statSync(apkPath).size : 0,
      zipSizeBytes: fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0,
    });
  });

  app.get('/downloads/VendorGuard.apk', (_req, res) => {
    const apkPath = path.resolve(process.cwd(), 'VendorGuard.apk');
    if (!fs.existsSync(apkPath)) {
      res.status(404).json({ error: 'APK file not built yet.' });
      return;
    }
    res.download(apkPath, 'VendorGuard.apk');
  });

  app.get('/downloads/VendorGuard-package.zip', (_req, res) => {
    const zipPath = path.resolve(process.cwd(), 'VendorGuard-package.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'ZIP package not built yet.' });
      return;
    }
    res.download(zipPath, 'VendorGuard-package.zip');
  });

  // Authentication
  app.post('/api/auth/register', (req, res) => {
    const { name, phone, password, marketLocation } = req.body as {
      name?: string;
      phone?: string;
      password?: string;
      marketLocation?: string;
    };

    const cleanName = (name || '').trim();
    const cleanPhone = normalizePhone(phone || '');
    const cleanPassword = password || '';
    const cleanMarket = (marketLocation || '').trim() || 'Kampala Market Stall';

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      res.status(400).json({
        error: 'Please enter a valid Ugandan phone number (e.g. 0772104582).',
      });
      return;
    }
    if (cleanPassword.length < 6) {
      res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (db.users.some((u) => normalizePhone(u.phone) === cleanPhone)) {
      res
        .status(409)
        .json({ error: 'An account with this phone number already exists.' });
      return;
    }

    const newUser: StoredUser = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      phone: cleanPhone,
      marketLocation: cleanMarket,
      role: 'vendor',
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.alerts.unshift({
      id: `alt_${crypto.randomUUID().slice(0, 8)}`,
      userId: newUser.id,
      title: 'Welcome to VendorGuard',
      message:
        'Your vendor protection account is ready. Always verify large banknotes in natural daylight and confirm Mobile Money balances via *165# or *185# before releasing stock.',
      severity: 'info',
      category: 'Security Advisory',
      marketScope: cleanMarket,
      readBy: [],
      createdAt: new Date().toISOString(),
    });
    saveDb();

    const token = signToken(newUser.id);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body as {
      phone?: string;
      password?: string;
    };
    const cleanPhone = normalizePhone(phone || '');
    if (!cleanPhone || !password) {
      res
        .status(400)
        .json({ error: 'Phone number and password are required.' });
      return;
    }

    const user = db.users.find((u) => normalizePhone(u.phone) === cleanPhone);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid phone number or password.' });
      return;
    }

    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const { name, phone, marketLocation, currentPassword, newPassword } =
      req.body as {
        name?: string;
        phone?: string;
        marketLocation?: string;
        currentPassword?: string;
        newPassword?: string;
      };

    if (name !== undefined) {
      const cleanName = name.trim();
      if (cleanName.length < 2) {
        res.status(400).json({ error: 'Name must be at least 2 characters.' });
        return;
      }
      user.name = cleanName;
    }

    if (phone !== undefined) {
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone.length < 9 || cleanPhone.length > 12) {
        res.status(400).json({ error: 'Enter a valid Ugandan phone number.' });
        return;
      }
      const duplicate = db.users.find(
        (u) => u.id !== user.id && normalizePhone(u.phone) === cleanPhone
      );
      if (duplicate) {
        res
          .status(409)
          .json({ error: 'Another account already uses that phone number.' });
        return;
      }
      user.phone = cleanPhone;
    }

    if (marketLocation !== undefined) {
      user.marketLocation = marketLocation.trim() || user.marketLocation;
    }

    if (newPassword) {
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
        res
          .status(400)
          .json({ error: 'Current password is incorrect.' });
        return;
      }
      if (newPassword.length < 6) {
        res
          .status(400)
          .json({ error: 'New password must be at least 6 characters.' });
        return;
      }
      user.passwordHash = hashPassword(newPassword);
    }

    saveDb();
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  // Dashboard Summary
  app.get('/api/dashboard', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const history = buildUserHistory(user.id);
    const alerts = getUserAlerts(user.id);
    const unreadAlerts = alerts.filter((a) => !a.readBy.includes(user.id)).length;

    const banknoteChecks = db.banknoteChecks.filter((b) => b.userId === user.id);
    const momoChecks = db.mobileMoneyChecks.filter((m) => m.userId === user.id);
    const reports = db.fraudReports.filter((r) => r.userId === user.id);

    const suspiciousCount =
      banknoteChecks.filter((b) => b.outcome === 'suspicious_indicators').length +
      momoChecks.filter((m) => m.outcome === 'suspicious').length;

    res.json({
      stats: {
        totalChecks: banknoteChecks.length + momoChecks.length,
        suspiciousCount,
        reportsCount: reports.length,
        unreadAlerts,
      },
      recentHistory: history.slice(0, 5),
      topAlerts: alerts.slice(0, 3),
    });
  });

  // Banknote Verification
  app.post('/api/verifications/banknote', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const { denomination, checklist, serialPrefix, notes, imageEvidence } =
      req.body as {
        denomination?: BanknoteDenomination;
        checklist?: BanknoteChecklist;
        serialPrefix?: string;
        notes?: string;
        imageEvidence?: string;
      };

    const validDenoms = [50000, 20000, 10000, 5000, 2000, 1000];
    if (!denomination || !validDenoms.includes(Number(denomination))) {
      res.status(400).json({ error: 'Please select a valid UGX denomination.' });
      return;
    }

    const checks: BanknoteChecklist = {
      watermarkVisible: Boolean(checklist?.watermarkVisible),
      securityThreadIntact: Boolean(checklist?.securityThreadIntact),
      raisedPrintFelt: Boolean(checklist?.raisedPrintFelt),
      colorShiftFoilObserved: Boolean(checklist?.colorShiftFoilObserved),
      paperQualityCrisp: Boolean(checklist?.paperQualityCrisp),
    };

    const passedCount = Object.values(checks).filter(Boolean).length;
    const missingItems: string[] = [];
    if (!checks.watermarkVisible) missingItems.push('Crested Crane watermark');
    if (!checks.securityThreadIntact) missingItems.push('security thread');
    if (!checks.raisedPrintFelt) missingItems.push('raised intaglio print');
    if (!checks.colorShiftFoilObserved) missingItems.push('color-shifting foil');
    if (!checks.paperQualityCrisp) missingItems.push('crisp cotton-paper texture');

    let outcome: BanknoteOutcome;
    let summary: string;

    if (passedCount === 5) {
      outcome = 'verified_checklist';
      summary = `All 5 Bank of Uganda security features confirmed for this UGX ${Number(denomination).toLocaleString()} note.`;
    } else if (passedCount >= 3 && checks.watermarkVisible && checks.securityThreadIntact) {
      outcome = 'further_verification_needed';
      summary = `Further physical verification recommended. Unconfirmed feature(s): ${missingItems.join(', ')}. Inspect under bright daylight or compare with a known genuine note.`;
    } else {
      outcome = 'suspicious_indicators';
      summary = `Suspicious counterfeit indicators observed. Missing or unconfirmed: ${missingItems.join(', ')}. Do not accept without bank or market-desk verification.`;
    }

    const record: BanknoteCheckRecord = {
      id: `bn_${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      userName: user.name,
      denomination: Number(denomination) as BanknoteDenomination,
      checklist: checks,
      serialPrefix: (serialPrefix || '').trim().toUpperCase().slice(0, 16),
      notes: (notes || '').trim().slice(0, 400),
      imageEvidence:
        imageEvidence && imageEvidence.startsWith('data:image/')
          ? imageEvidence
          : undefined,
      outcome,
      summary,
      createdAt: new Date().toISOString(),
    };

    db.banknoteChecks.unshift(record);

    if (outcome === 'suspicious_indicators') {
      db.alerts.unshift({
        id: `alt_${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        title: `Suspicious UGX ${record.denomination.toLocaleString()} Note Flagged`,
        message: `${summary} Consider submitting a formal fraud report to warn nearby vendors.`,
        severity: 'critical',
        category: 'Activity Alert',
        marketScope: user.marketLocation,
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    saveDb();
    res.status(201).json({ record });
  });

  // Mobile Money Verification Samples
  app.get('/api/demo/mobile-money-samples', requireAuth, (_req, res) => {
    res.json({
      samples: [
        {
          label: 'Valid MTN Demo Payment',
          provider: 'MTN Mobile Money',
          transactionRef: 'MTN-88492014',
          amount: '45000',
          senderPhone: '0774819203',
          senderName: 'Grace Achieng',
          smsText:
            'You have received UGX 45,000 from Grace Achieng (256774819203) on your MTN MoMo account. New Balance: UGX 215,000. Txn ID: MTN-88492014.',
        },
        {
          label: 'Suspicious Spoofed SMS',
          provider: 'Airtel Money',
          transactionRef: 'AIR-99812004',
          amount: '65000',
          senderPhone: '0750998121',
          senderName: 'Edited Sender',
          smsText:
            'URGENT: You received 650000 from 0750998121 by mistake! Keep 65000 and send back 585000 immediately to avoid reversal.',
        },
        {
          label: 'Unknown / Unlisted TX',
          provider: 'MTN Mobile Money',
          transactionRef: 'MTN-40291855',
          amount: '75000',
          senderPhone: '0781223344',
          senderName: 'Samuel Okello',
          smsText: '',
        },
      ],
    });
  });

  // Mobile Money Verification
  app.post('/api/verifications/mobile-money', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const {
      provider,
      transactionRef,
      amount,
      senderPhone,
      senderName,
      smsText,
    } = req.body as {
      provider?: MobileMoneyProvider;
      transactionRef?: string;
      amount?: number | string;
      senderPhone?: string;
      senderName?: string;
      smsText?: string;
    };

    const validProviders: MobileMoneyProvider[] = [
      'MTN Mobile Money',
      'Airtel Money',
    ];
    if (!provider || !validProviders.includes(provider)) {
      res
        .status(400)
        .json({ error: 'Select MTN Mobile Money or Airtel Money.' });
      return;
    }

    const cleanRef = (transactionRef || '').trim().toUpperCase();
    const numericAmount = Number(String(amount || '').replace(/[^\d.]/g, ''));
    const cleanPhone = normalizePhone(senderPhone || '');
    const cleanSender = (senderName || '').trim();
    const cleanSms = (smsText || '').trim();

    if (!cleanRef || cleanRef.length < 4) {
      res
        .status(400)
        .json({ error: 'Enter a valid transaction reference or ID.' });
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      res
        .status(400)
        .json({ error: 'Enter a valid transaction amount in UGX.' });
      return;
    }

    const findings: string[] = [];
    let suspiciousScore = 0;

    // 1. Check SMS text heuristics if provided
    if (cleanSms) {
      const lower = cleanSms.toLowerCase();
      if (
        lower.includes('by mistake') ||
        lower.includes('send back') ||
        lower.includes('reverse') ||
        lower.includes('urgent') ||
        lower.includes('pin') ||
        lower.includes('click') ||
        lower.includes('http')
      ) {
        suspiciousScore += 2;
        findings.push(
          'SMS text contains high-risk social-engineering or overpayment-reversal scam phrasing.'
        );
      }
      if (provider === 'MTN Mobile Money' && lower.includes('airtel')) {
        suspiciousScore += 2;
        findings.push(
          'Provider mismatch: Airtel text detected inside an MTN Mobile Money check.'
        );
      }
      if (provider === 'Airtel Money' && lower.includes('mtn')) {
        suspiciousScore += 2;
        findings.push(
          'Provider mismatch: MTN text detected inside an Airtel Money check.'
        );
      }
      if (!lower.includes('ugx') && !lower.includes('shs')) {
        suspiciousScore += 1;
        findings.push(
          'SMS message lacks standard official UGX currency formatting.'
        );
      }
    }

    // 2. Check demonstration ledger
    const ledgerMatch = DEMO_LEDGER.find(
      (entry) => entry.transactionRef.toUpperCase() === cleanRef
    );

    let outcome: MobileMoneyOutcome;

    if (ledgerMatch) {
      if (ledgerMatch.status === 'flagged') {
        suspiciousScore += 3;
        findings.unshift(
          ledgerMatch.flagReason ||
            'Transaction reference matches a flagged fraud record.'
        );
      } else {
        if (ledgerMatch.provider !== provider) {
          suspiciousScore += 2;
          findings.push(
            `Provider mismatch: ${cleanRef} belongs to ${ledgerMatch.provider}, not ${provider}.`
          );
        }
        if (ledgerMatch.amount !== numericAmount) {
          suspiciousScore += 2;
          findings.push(
            `Amount discrepancy: Entered UGX ${numericAmount.toLocaleString()}, but demonstration ledger recorded UGX ${ledgerMatch.amount.toLocaleString()}.`
          );
        }
        if (
          cleanPhone &&
          normalizePhone(ledgerMatch.senderPhone) !== cleanPhone
        ) {
          suspiciousScore += 1;
          findings.push(
            `Sender phone differs from demonstration record (${ledgerMatch.senderPhone}).`
          );
        }
      }
    }

    // Also check if user already flagged/reported this exact reference before
    const reportedBefore = db.fraudReports.some(
      (r) =>
        r.transactionRef &&
        r.transactionRef.toUpperCase() === cleanRef
    );
    if (reportedBefore) {
      suspiciousScore += 2;
      findings.push(
        `Reference ${cleanRef} has previously been submitted in a VendorGuard fraud report.`
      );
    }

    if (suspiciousScore >= 2) {
      outcome = 'suspicious';
      if (findings.length === 0) {
        findings.push('Suspicious anomalies detected in transaction details.');
      }
    } else if (ledgerMatch && ledgerMatch.status === 'valid' && suspiciousScore === 0) {
      outcome = 'verified_demo';
      findings.push(
        `Transaction reference ${cleanRef} for UGX ${numericAmount.toLocaleString()} (${provider}) is verified in the demonstration environment.`
      );
      findings.push(
        `Confirm actual funds in your own ${provider} wallet (${provider === 'MTN Mobile Money' ? '*165#' : '*185#'}) before releasing goods.`
      );
    } else {
      outcome = 'unable_to_verify';
      findings.push(
        `Reference ${cleanRef} was not found in the demonstration ledger and cannot be automatically confirmed.`
      );
      findings.push(
        `Do not rely on screenshots or forwarded SMS messages. Dial ${provider === 'MTN Mobile Money' ? '*165#' : '*185#'} on your own handset to confirm receipt.`
      );
    }

    const record: MobileMoneyCheckRecord = {
      id: `mm_${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      userName: user.name,
      provider,
      transactionRef: cleanRef,
      amount: numericAmount,
      senderPhone: cleanPhone,
      senderName: cleanSender,
      smsText: cleanSms,
      outcome,
      findings,
      createdAt: new Date().toISOString(),
    };

    db.mobileMoneyChecks.unshift(record);

    if (outcome === 'suspicious') {
      db.alerts.unshift({
        id: `alt_${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        title: `Suspicious ${provider} Reference ${cleanRef}`,
        message: findings[0],
        severity: 'critical',
        category: 'Activity Alert',
        marketScope: user.marketLocation,
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    saveDb();
    res.status(201).json({ record });
  });

  // Fraud Reports
  app.get('/api/reports', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const list =
      user.role === 'admin'
        ? db.fraudReports
        : db.fraudReports.filter((r) => r.userId === user.id);
    res.json({ reports: list });
  });

  app.post('/api/reports', requireAuth, (req: AuthRequest, res) => {
    const user = req.authUser!;
    const {
      fraudType,
      description,
      transactionRef,
      amount,
      location,
      suspectPhone,
      evidenceImage,
    } = req.body as {
      fraudType?: string;
      description?: string;
      transactionRef?: string;
      amount?: number | string | null;
      location?: string;
      suspectPhone?: string;
      evidenceImage?: string;
    };

    const cleanDesc = (description || '').trim();
    if (!fraudType || cleanDesc.length < 10) {
      res.status(400).json({
        error:
          'Please select a fraud type and provide at least 10 characters describing the incident.',
      });
      return;
    }

    const parsedAmount =
      amount !== undefined && amount !== null && String(amount).trim() !== ''
        ? Number(String(amount).replace(/[^\d.]/g, ''))
        : null;

    const now = new Date().toISOString();
    const caseNum = `VG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const report: FraudReport = {
      id: `rep_${crypto.randomUUID().slice(0, 8)}`,
      caseNumber: caseNum,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      fraudType,
      description: cleanDesc,
      transactionRef: (transactionRef || '').trim().toUpperCase(),
      amount: parsedAmount && Number.isFinite(parsedAmount) ? parsedAmount : null,
      location: (location || '').trim() || user.marketLocation,
      suspectPhone: normalizePhone(suspectPhone || ''),
      evidenceImage:
        evidenceImage && evidenceImage.startsWith('data:image/')
          ? evidenceImage
          : undefined,
      status: 'Pending Review',
      reviewerNote: '',
      createdAt: now,
      updatedAt: now,
    };

    db.fraudReports.unshift(report);
    db.alerts.unshift({
      id: `alt_${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      title: `Fraud Report ${caseNum} Submitted`,
      message: `Your ${fraudType} report has been recorded and queued for security review.`,
      severity: 'info',
      category: 'Report Update',
      marketScope: report.location,
      readBy: [],
      createdAt: now,
    });

    saveDb();
    res.status(201).json({ report });
  });

  // History
  app.get('/api/history', requireAuth, (req: AuthRequest, res) => {
    const history = buildUserHistory(req.authUser!.id);
    res.json({ history });
  });

  // Alerts & Notifications
  app.get('/api/alerts', requireAuth, (req: AuthRequest, res) => {
    const alerts = getUserAlerts(req.authUser!.id);
    res.json({ alerts });
  });

  app.post('/api/alerts/:id/read', requireAuth, (req: AuthRequest, res) => {
    const userId = req.authUser!.id;
    const alert = db.alerts.find((a) => a.id === req.params.id);
    if (alert && !alert.readBy.includes(userId)) {
      alert.readBy.push(userId);
      saveDb();
    }
    res.json({ ok: true });
  });

  app.post('/api/alerts/read-all', requireAuth, (req: AuthRequest, res) => {
    const userId = req.authUser!.id;
    for (const alert of db.alerts) {
      if (
        (alert.userId === 'all' || alert.userId === userId) &&
        !alert.readBy.includes(userId)
      ) {
        alert.readBy.push(userId);
      }
    }
    saveDb();
    res.json({ ok: true });
  });

  // Administrator Routes
  app.get(
    '/api/admin/overview',
    requireAuth,
    requireAdmin,
    (_req: AuthRequest, res) => {
      const totalVendors = db.users.filter((u) => u.role === 'vendor').length;
      const totalVerifications =
        db.banknoteChecks.length + db.mobileMoneyChecks.length;
      const suspiciousFlags =
        db.banknoteChecks.filter((b) => b.outcome === 'suspicious_indicators')
          .length +
        db.mobileMoneyChecks.filter((m) => m.outcome === 'suspicious').length;
      const openReports = db.fraudReports.filter(
        (r) =>
          r.status === 'Pending Review' || r.status === 'Under Investigation'
      ).length;

      res.json({
        metrics: {
          totalVendors,
          totalVerifications,
          suspiciousFlags,
          openReports,
        },
        reports: db.fraudReports,
        recentBanknoteChecks: db.banknoteChecks.slice(0, 15),
        recentMobileMoneyChecks: db.mobileMoneyChecks.slice(0, 15),
        alerts: db.alerts.filter((a) => a.userId === 'all').slice(0, 15),
      });
    }
  );

  app.patch(
    '/api/admin/reports/:id',
    requireAuth,
    requireAdmin,
    (req: AuthRequest, res) => {
      const admin = req.authUser!;
      const report = db.fraudReports.find((r) => r.id === req.params.id);
      if (!report) {
        res.status(404).json({ error: 'Report not found.' });
        return;
      }

      const { status, reviewerNote } = req.body as {
        status?: ReportStatus;
        reviewerNote?: string;
      };

      const validStatuses: ReportStatus[] = [
        'Pending Review',
        'Under Investigation',
        'Confirmed Fraud',
        'Dismissed',
      ];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status selected.' });
        return;
      }

      report.status = status;
      report.reviewerNote = (reviewerNote || '').trim();
      report.reviewedBy = admin.name;
      report.updatedAt = new Date().toISOString();

      db.alerts.unshift({
        id: `alt_${crypto.randomUUID().slice(0, 8)}`,
        userId: report.userId,
        title: `Report ${report.caseNumber} Updated: ${status}`,
        message: report.reviewerNote
          ? `Reviewer (${admin.name}): ${report.reviewerNote}`
          : `Your fraud report status has been updated to ${status}.`,
        severity: status === 'Confirmed Fraud' ? 'warning' : 'info',
        category: 'Report Update',
        marketScope: report.location,
        readBy: [],
        createdAt: new Date().toISOString(),
      });

      saveDb();
      res.json({ report });
    }
  );

  app.post(
    '/api/admin/alerts',
    requireAuth,
    requireAdmin,
    (req: AuthRequest, res) => {
      const { title, message, severity, marketScope } = req.body as {
        title?: string;
        message?: string;
        severity?: AlertSeverity;
        marketScope?: string;
      };

      if (!title?.trim() || !message?.trim()) {
        res
          .status(400)
          .json({ error: 'Alert title and message are required.' });
        return;
      }

      const alert: AlertItem = {
        id: `alt_${crypto.randomUUID().slice(0, 8)}`,
        userId: 'all',
        title: title.trim(),
        message: message.trim(),
        severity: severity || 'warning',
        category: 'Security Advisory',
        marketScope: (marketScope || '').trim() || 'All Ugandan Markets',
        readBy: [],
        createdAt: new Date().toISOString(),
      };

      db.alerts.unshift(alert);
      saveDb();
      res.status(201).json({ alert });
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript');
      res.send(`
const sheetsMap = new Map();
function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return \`\${pathname}?\${queryToInject}\${search ? '&' + search.slice(1) : ''}\${hash || ''}\`;
}
class ErrorOverlay extends HTMLElement {}
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
`);
    });

    process.env.DISABLE_HMR = 'true';
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as { status?: number }).status === 'number'
        ? (err as { status: number }).status
        : 500;
    const message =
      err instanceof Error ? err.message : 'Unexpected server error.';
    res.status(status).json({ error: message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VendorGuard server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VendorGuard server:', err);
  process.exit(1);
});
