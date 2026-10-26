# SmartBank — Community Banking Management Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2%2B-092E20.svg)](https://djangoproject.com)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.15%2B-red.svg)](https://www.django-rest-framework.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Pytest-14_Passed-success.svg)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **⚠️ EDUCATIONAL PORTFOLIO PROTOTYPE DISCLAIMER**  
> SmartBank is a simulated digital banking and management platform designed specifically for demonstration and engineering portfolio evaluation. It operates strictly with **fictional customers and simulated money** in South African Rand (ZAR, R). It is **not** an authorized or licensed bank under the South African Reserve Bank (SARB), does not connect to live clearing rails, and cannot process real fiat transactions.

---

## 1. Project Overview & Objectives

**SmartBank** is a full-stack digital banking and financial operations platform engineered for community banks, cooperative financial institutions (CFIs), savings co-ops, and microfinance organizations.

Community institutions often struggle with fragmented paperwork, opaque group bookkeeping, and high commercial banking fees. SmartBank addresses this by offering:
1. **Auditable Double-Entry Ledger Engine**: Strict financial invariant enforcement preventing balance drift, negative transactions, race conditions, or unauthorized modifications.
2. **Smart Savings Coach**: Signature goal tracker with explainable pacing, progress visualizers, and weekly/monthly targets without double-counting funds.
3. **Community Savings Circles (Digital Stokvels)**: Transparent collective savings with rotational payouts, democratic consensus, and leader/treasurer approval policies.
4. **Transparent Microloan Assistant**: Amortized payment calculator using standard compounding formulas, complete with staff underwriting, automated repayment schedules, and status tracking.
5. **Explainable Fraud Watch & Account Safety**: Deterministic rule triggers (high value thresholds, rapid velocity, unrecognized transaction reporting) with an operations queue.
6. **Multi-Role Administrative & Operations Console**: Complete institutional oversight, KYC verification, real-time volume charts, and formula-injection-safe CSV export.
7. **Low-Data & Multilingual Interface**: Responsive UI with seamless English and isiZulu language switching.

---

## 2. Technology Stack

### Backend
- **Framework**: Python 3.14 / 3.11, Django 5.2, Django REST Framework
- **Database**: PostgreSQL 16 (via Docker / `DATABASE_URL`) with fallback to portable SQLite for instant local zero-dependency development
- **Security & Concurrency**: Row-level database locking (`select_for_update`), atomic transactions, token authentication, rate limiting, and CORS headers
- **Documentation**: OpenAPI 3.0 / Swagger UI powered by `drf-spectacular`
- **Testing**: Pytest with `pytest-django`

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, custom SmartBank design system (deep navy, light slate surfaces, emerald accents)
- **Routing & State**: React Router DOM, TanStack Query, React Context
- **Visualizations**: Recharts (14-day transaction volume trend curves)
- **Icons**: Lucide Icons

---

## 3. System Architecture & Database Design

SmartBank follows a clean domain-driven architecture organized into decoupled Django apps and typed modular React views:

```
Banking_System/
├── backend/
│   ├── config/              # Django core settings, URLs, OpenAPI schema
│   ├── apps/
│   │   ├── accounts/        # Custom User, CustomerProfile, KycStatus, AuditEvent
│   │   ├── banking/         # BankAccount, Transaction, TransactionEntry (Ledger)
│   │   ├── savings/         # SavingsGoal, SavingsCircle, CirclePayout
│   │   ├── loans/           # LoanApplication, LoanRepayment, Calculators
│   │   ├── security/        # SecurityAlert, FraudWatchService, SecurityRuleConfig
│   │   ├── notifications/   # In-app notifications
│   │   ├── support/         # SupportTicket, SupportMessage threads
│   │   └── reporting/       # Aggregated metrics, injection-safe CSV exports
│   └── tests/               # 14 automated tests covering financial invariants
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, Modal, Card, Badge, Banner
│   │   ├── contexts/        # AuthContext, multilingual state (EN/isiZulu)
│   │   ├── pages/           # Landing, Dashboard, Accounts, Transfer, Savings,
│   │   │                    # Circles, Loans, Support, Profile, Staff, Admin
│   │   ├── services/        # Centralized typed API client
│   │   └── types/           # Domain TypeScript definitions
├── docker-compose.yml       # Production-ready multi-container orchestration
├── .env.example             # Safe placeholder environment configuration
└── README.md                # Comprehensive system documentation
```

### Double-Entry Ledger Invariant Guarantee

Financial integrity is enforced in `apps.banking.services.TransactionService`:
- Every completed transaction creates balanced `DEBIT` and `CREDIT` entries in `TransactionEntry`.
- Deadlocks during simultaneous mutual transfers are prevented by ordering account row-locks alphabetically by UUID before calling `select_for_update()`.
- Idempotency keys prevent duplicate transaction execution on network retries.
- Completed transactions cannot be directly edited; adjustments must be issued via signed `REVERSAL` ledger entries.

---

## 4. Documented Demonstration Accounts

The database includes realistic seeded accounts for each user role:

| Role | Email | Password | Details & Access |
|---|---|---|---|
| **Primary Customer** | `customer@smartbank.local` | `CustomerPassword123!` | **Sipho Dlamini** — Verified KYC, 2 accounts (R14,500 Savings, R3,250 Current), Active stokvel leader, Active microloan |
| **Secondary Customer**| `lerato@smartbank.local` | `CustomerPassword123!` | **Lerato Mokoena** — Verified KYC (isiZulu default), Savings account (R8,800), Stokvel treasurer |
| **Pending Customer**  | `bongani@smartbank.local` | `CustomerPassword123!` | **Bongani Zulu** — Pending KYC, Submitted loan application, High-value security alert trigger |
| **Bank Staff**        | `staff@smartbank.local` | `StaffPassword123!` | **Thabo Ndlovu** — Operational dashboard, KYC verification, Loan underwriting queue, Security resolution |
| **Administrator**     | `admin@smartbank.local` | `AdminPassword123!` | **Nomvula Khumalo** — Full institutional access, Staff provisioning, Rule thresholds, Immutable audit log |

*(The public Landing and Login pages also feature **1-Click Demo Buttons** for instant access without manual typing).*

---

## 5. Local Setup & Running Instructions

### Prerequisites
- **Python 3.11+** or **3.14+**
- **Node.js v18+** & **npm**

### Quick Start (Native Local Dev)

#### Step 1: Clone and Configure Environment
```bash
git clone <repository-url>
cd Banking_System
cp .env.example .env
```

#### Step 2: Set Up Backend
```bash
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows PowerShell:
.\backend\venv\Scripts\Activate.ps1
# Linux/macOS:
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations and populate demo data
python backend/manage.py migrate
python backend/manage.py seed_demo_data

# Start backend server
python backend/manage.py runserver 127.0.0.1:8000
```
Backend API will be live at: **http://127.0.0.1:8000/**  
Swagger API Docs available at: **http://127.0.0.1:8000/api/docs/**

#### Step 3: Set Up Frontend (in a new terminal)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Frontend Web UI will be live at: **http://127.0.0.1:5173/**

---

## 6. Docker Compose Deployment

To run SmartBank in containerized PostgreSQL + Backend + Nginx Frontend mode:

```bash
docker-compose up --build
```
- Web Application: **http://localhost:5173**
- Backend API: **http://localhost:8000**
- PostgreSQL: **localhost:5432**

---

## 7. Automated Testing Suite

SmartBank includes 14 automated unit and integration tests verifying banking business logic, permissions, and calculations:

```bash
cd backend
.\venv\Scripts\pytest
```

### Verified Test Cases:
1. `test_successful_transfer`: Verifies balance updates and double-entry debit/credit ledger equality.
2. `test_insufficient_funds_transfer`: Verifies transaction rejection when amount exceeds balance.
3. `test_negative_and_zero_amounts`: Ensures zero and negative amounts are rejected.
4. `test_same_account_transfer`: Rejects self-transfers.
5. `test_suspended_account_transfer`: Blocks transfers against suspended/closed accounts.
6. `test_deposit_and_withdrawal`: Tests atomic cash deposit and withdrawal operations.
7. `test_transaction_reversal`: Validates correct reciprocal ledger balancing after an administrative reversal.
8. `test_valid_and_invalid_login`: Tests authentication, token generation, and invalid attempt limits.
9. `test_customer_access_restrictions`: Ensures customers cannot access staff reports or admin endpoints.
10. `test_staff_access_permissions`: Verifies staff access to operations while blocking admin actions.
11. `test_admin_access_permissions`: Verifies full superuser access to staff management.
12. `test_loan_payment_calculation`: Tests compounding loan installment formula.
13. `test_loan_zero_interest`: Validates edge-case zero-interest flat division.
14. `test_savings_goal_progress`: Verifies progress percentages and remaining pacing calculations.

---

## 8. API Endpoints Reference

Interactive documentation is served via OpenAPI 3.0 at `/api/docs/`.

### Core Routes:
- `POST /api/v1/auth/register/` - Register new customer with welcome grant
- `POST /api/v1/auth/login/` - Authenticate and retrieve token
- `GET  /api/v1/auth/me/` - Retrieve or update current user profile
- `GET  /api/v1/banking/accounts/` - List user accounts
- `POST /api/v1/banking/accounts/` - Open Savings / Current / Goal account
- `GET  /api/v1/banking/transactions/` - List filterable transactions
- `POST /api/v1/banking/transactions/transfer/` - Execute atomic transfer
- `POST /api/v1/banking/transactions/deposit/` - Simulated deposit
- `POST /api/v1/banking/transactions/withdraw/` - Simulated withdrawal
- `POST /api/v1/banking/transactions/<id>/report/` - Customer security alert report
- `POST /api/v1/banking/transactions/<id>/reverse/` - Staff transaction reversal
- `GET  /api/v1/savings/goals/` - Smart Savings Coach goals
- `POST /api/v1/savings/goals/<id>/fund/` - Allocate funds to goal
- `GET  /api/v1/savings/circles/` - Community Stokvel circles
- `POST /api/v1/savings/circles/<id>/contribute/` - Pay member dues
- `POST /api/v1/savings/circles/<id>/propose-payout/` - Propose rotational payout
- `POST /api/v1/savings/circles/<id>/payouts/<id>/approve/` - Approve & disburse payout
- `POST /api/v1/loans/calculate/` - Transparent loan calculator
- `POST /api/v1/loans/applications/` - Submit microloan application
- `POST /api/v1/loans/applications/<id>/decision/` - Staff underwriting decision
- `POST /api/v1/loans/applications/<id>/repay/` - Pay monthly installment
- `GET  /api/v1/security/alerts/` - Fraud Watch review queue
- `GET  /api/v1/reporting/overview/` - Institutional operational metrics
- `GET  /api/v1/reporting/export/transactions/` - Injection-safe CSV export

---

## 9. Security & Hardening Measures

- **Formula Injection Defense (CWE-1236)**: All user-generated strings in CSV exports are sanitized against `=`, `+`, `-`, and `@` prefixes.
- **Atomic Concurrency Protection**: High-frequency financial transfers use database row-level locking (`select_for_update`) to prevent double-spending.
- **Fail-Safe Idempotency**: Prevents repeated charges from network drops or multiple button clicks.
- **Rate Throttling**: Restricts rapid automated brute-force attempts on sensitive endpoints.
- **Role-Based Server-Side Authorization**: Every endpoint verifies `IsCustomerUser`, `IsStaffUser`, or `IsAdminUser`.

---

## 10. License

Developed for educational and portfolio demonstration purposes under the MIT License.
