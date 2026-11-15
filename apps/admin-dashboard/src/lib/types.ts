export type {
  Balance,
  BalanceStatus,
  Currency,
  Guardian,
  IsoDate,
  IsoDateTime,
  LedgerEntry,
  LedgerEntryType,
  PaymentConcept,
  PaymentMethod,
  PaymentRequest,
  PaymentRequestStatus,
  PaymentTransaction,
  PaymentTransactionStatus,
  Period,
  Receipt,
  School,
  Student,
  StudentSummary,
} from "@lexium/shared-contracts";

import type {
  Balance,
  Guardian,
  LedgerEntry,
  PaymentRequest,
  PaymentTransaction,
  Receipt,
  School,
  Student,
} from "@lexium/shared-contracts";

export type EducationLevel = Student["level"];
export type StudentStatus = Student["status"];
export type GuardianRelationship = Guardian["relationship"];

export interface WeeklyCollectionPoint {
  label: string;
  expectedCents: number;
  collectedCents: number;
}

export interface DashboardData {
  school: School;
  guardians: Guardian[];
  students: Student[];
  balances: Balance[];
  paymentRequests: PaymentRequest[];
  transactions: PaymentTransaction[];
  receipts: Receipt[];
  ledger: LedgerEntry[];
  ledgerValid: boolean;
  now: string;
  weeklyCollection: WeeklyCollectionPoint[];
}
