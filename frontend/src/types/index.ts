export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface CustomerProfile {
  id: string;
  date_of_birth: string | null;
  residential_address: string;
  city: string;
  province: string;
  postal_code: string;
  employment_status: string;
  monthly_income: string;
  kyc_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verification_notes: string;
  verified_at: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  national_id: string;
  preferred_language: 'en' | 'zu';
  is_verified: boolean;
  created_at: string;
  customer_profile?: CustomerProfile;
}

export type AccountType = 'SAVINGS' | 'CURRENT' | 'GOAL_SAVINGS';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface TransactionEntry {
  id: string;
  account_number: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
  balance_after: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  reference: string;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'CIRCLE_CONTRIBUTION' | 'CIRCLE_PAYOUT' | 'REVERSAL';
  source_account: string | null;
  source_account_number?: string;
  destination_account: string | null;
  destination_account_number?: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  description: string;
  initiator_email: string;
  idempotency_key?: string;
  failure_reason?: string;
  created_at: string;
  completed_at?: string;
  ledger_entries?: TransactionEntry[];
}

export interface BankAccount {
  id: string;
  account_number: string;
  user: string;
  owner_name: string;
  owner_email: string;
  account_type: AccountType;
  status: AccountStatus;
  currency: string;
  available_balance: string;
  ledger_balance: string;
  daily_transfer_limit: string;
  created_at: string;
  recent_transactions?: Transaction[];
}

export interface SavingsContribution {
  id: string;
  goal: string;
  account: string;
  account_number: string;
  amount: string;
  notes: string;
  timestamp: string;
}

export interface SavingsGoal {
  id: string;
  user: string;
  account?: string;
  name: string;
  category: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress_percentage: number;
  remaining_amount: string;
  days_remaining: number;
  suggested_monthly_contribution: string;
  suggested_weekly_contribution: string;
  created_at: string;
  contributions?: SavingsContribution[];
}

export interface CircleMembership {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  role: 'LEADER' | 'TREASURER' | 'MEMBER';
  joined_at: string;
  is_active: boolean;
}

export interface CirclePayout {
  id: string;
  circle: string;
  recipient: string;
  recipient_name: string;
  amount: string;
  round_number: number;
  status: 'PROPOSED' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  notes: string;
  approved_by?: string;
  approved_by_name?: string;
  proposed_at: string;
  approved_at?: string;
  disbursed_at?: string;
}

export interface SavingsCircle {
  id: string;
  name: string;
  description: string;
  creator: string;
  creator_name: string;
  target_amount: string;
  contribution_amount: string;
  frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';
  current_round: number;
  status: string;
  meeting_day: string;
  payout_rule_description: string;
  created_at: string;
  total_saved: string;
  members: CircleMembership[];
  recent_contributions: any[];
  payouts: CirclePayout[];
}

export interface LoanRepayment {
  id: string;
  installment_number: number;
  amount_due: string;
  amount_paid: string;
  due_date: string;
  paid_date?: string;
  status: 'SCHEDULED' | 'PAID' | 'OVERDUE';
}

export interface LoanApplication {
  id: string;
  user: string;
  applicant_name: string;
  applicant_email: string;
  disbursement_account: string;
  account_number: string;
  purpose: string;
  amount_requested: string;
  term_months: number;
  monthly_interest_rate: string;
  origination_fee: string;
  calculated_monthly_payment: string;
  total_repayment_amount: string;
  status: 'SUBMITTED' | 'INFO_REQUESTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
  applicant_notes: string;
  staff_notes: string;
  decision_reason: string;
  reviewed_by_email?: string;
  reviewed_at?: string;
  disbursed_at?: string;
  created_at: string;
  repayments?: LoanRepayment[];
}

export interface SecurityAlert {
  id: string;
  user: string;
  user_email: string;
  account?: string;
  account_number?: string;
  transaction?: string;
  transaction_reference?: string;
  rule_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TRIGGERED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  description: string;
  evidence_details: Record<string, any>;
  staff_resolution_notes: string;
  reviewed_by_email?: string;
  is_customer_reported: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface SecurityRuleConfig {
  id: number;
  rule_key: string;
  name: string;
  description: string;
  threshold_value: string;
  is_enabled: boolean;
  severity: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  sender_email: string;
  sender_name: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user: string;
  user_email: string;
  user_name: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  assigned_to_email?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
}

export interface InstitutionalOverview {
  metrics: {
    total_customers: number;
    verified_customers: number;
    unverified_customers: number;
    total_accounts: number;
    active_accounts: number;
    suspended_accounts: number;
    total_liquidity: string;
    total_transactions_count: number;
    total_transactions_volume: string;
    pending_loans: number;
    open_support_tickets: number;
    unresolved_security_alerts: number;
    active_savings_circles: number;
  };
  transaction_trends: { date: string; count: number; volume: number }[];
  loan_distribution: { status: string; count: number }[];
}
