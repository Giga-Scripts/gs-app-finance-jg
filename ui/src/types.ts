/** Raw row returned by the Lua NUI callback "Fetching" */
export interface RawFinanceRow {
  finance_data: string;
  plate: string;
  vehicle_label: string;
}

/** Parsed finance_data JSON from jg-dealerships */
export interface FinanceData {
  total: number;
  paid: number;
  recurring_payment: number;
  payments_complete: number;
  total_payments: number;
  payment_interval: number;
  payment_failed: boolean;
  seconds_to_next_payment: number;
  seconds_to_repo: number;
  dealership_id: number;
  vehicle: string;
  currency: string;
  plate: string;
}

/** UI-ready vehicle finance object */
export interface FinancedVehicle {
  index: number;           // 0-based position in the raw array (needed for Payment callback)
  model: string;           // vehicle_label or finance_data.vehicle
  plate: string;
  total: number;           // total financed amount
  paid: number;            // amount already paid
  remaining: number;       // total - paid
  recurringPayment: number;// per-installment amount
  paymentsComplete: number;
  totalPayments: number;
  paymentFailed: boolean;
  secondsToNextPayment: number;
  rawFinanceData: FinanceData; // keep raw for Payment callback
  rawRow: RawFinanceRow;       // keep full row for Payment callback
}

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

/** Localised UI strings sent from Lua via the NUI payload */
export interface UiStrings {
  loadFailed: string;
  paymentFailed: string;
  paymentProcessFailed: string;
  installmentPaid: string;
  vehiclePaidOff: string;

  confirmPayment: string;
  payInstallment: string;
  settleFullBalance: string;
  /** Template: use `{amount}` and `{vehicle}` as placeholders */
  confirmPayInstallment: string;
  /** Template: use `{amount}` and `{vehicle}` as placeholders */
  confirmSettle: string;
  cancel: string;

  portfolioLabel: string;
  overview: string;
  fleetSize: string;
  nextCycleTotal: string;
  upcoming: string;
  totalDebt: string;
  equityPaid: string;
  collection: string;
  noActiveFinances: string;
  noFinancesHint: string;
  overdue: string;
  left: string;

  remaining: string;
  totalFinanced: string;
  perInstallment: string;
  paidSoFar: string;
  installments: string;
  nextPayment: string;
  dueIn: string;
  overdueWarning: string;
  payCycle: string;
  settle: string;
  now: string;
  /** BCP-47 locale tag used for Intl.NumberFormat, e.g. "en-US" or "pt-BR" */
  numberLocale: string;
}

/** Shape returned by both "Fetching" and "Payment" NUI callbacks */
export interface NuiPayload {
  vehicles: RawFinanceRow[];
  uiStrings: UiStrings;
}
