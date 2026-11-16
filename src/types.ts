export type UserRole = 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  marketLocation: string;
  role: UserRole;
  createdAt: string;
}

export type BanknoteDenomination = 50000 | 20000 | 10000 | 5000 | 2000 | 1000;

export type BanknoteOutcome =
  | 'verified_checklist'
  | 'further_verification_needed'
  | 'suspicious_indicators';

export interface BanknoteChecklist {
  watermarkVisible: boolean;
  securityThreadIntact: boolean;
  raisedPrintFelt: boolean;
  colorShiftFoilObserved: boolean;
  paperQualityCrisp: boolean;
}

export interface BanknoteCheckRecord {
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

export type MobileMoneyProvider = 'MTN Mobile Money' | 'Airtel Money';

export type MobileMoneyOutcome =
  | 'verified_demo'
  | 'suspicious'
  | 'unable_to_verify';

export interface MobileMoneyCheckRecord {
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

export type FraudType =
  | 'Counterfeit Banknote'
  | 'Fake Mobile Money SMS'
  | 'Payment Reversal Scam'
  | 'Agent Impersonation'
  | 'Other Financial Fraud';

export type ReportStatus =
  | 'Pending Review'
  | 'Under Investigation'
  | 'Confirmed Fraud'
  | 'Dismissed';

export interface FraudReport {
  id: string;
  caseNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  fraudType: FraudType;
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

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'Security Advisory' | 'Activity Alert' | 'Report Update';

export interface AlertItem {
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

export interface HistoryItem {
  id: string;
  kind: 'banknote' | 'mobile_money' | 'fraud_report';
  title: string;
  subtitle: string;
  amount: number | null;
  statusLabel: string;
  statusTone: 'verified' | 'warning' | 'danger' | 'neutral';
  description: string;
  createdAt: string;
  raw: BanknoteCheckRecord | MobileMoneyCheckRecord | FraudReport;
}

export interface DashboardSummary {
  stats: {
    totalChecks: number;
    suspiciousCount: number;
    reportsCount: number;
    unreadAlerts: number;
  };
  recentHistory: HistoryItem[];
  topAlerts: AlertItem[];
}

export interface MobileMoneySample {
  label: string;
  provider: MobileMoneyProvider;
  transactionRef: string;
  amount: string;
  senderPhone: string;
  senderName: string;
  smsText: string;
}

export interface AdminOverview {
  metrics: {
    totalVendors: number;
    totalVerifications: number;
    suspiciousFlags: number;
    openReports: number;
  };
  reports: FraudReport[];
  recentBanknoteChecks: BanknoteCheckRecord[];
  recentMobileMoneyChecks: MobileMoneyCheckRecord[];
  alerts: AlertItem[];
}

export type ScreenId =
  | 'dashboard'
  | 'banknote'
  | 'mobile_money'
  | 'report_fraud'
  | 'history'
  | 'alerts'
  | 'education'
  | 'profile'
  | 'admin';

export interface ReportPrefill {
  fraudType?: FraudType;
  description?: string;
  transactionRef?: string;
  amount?: string;
  evidenceImage?: string;
}
