import React, { useState, useEffect, useRef, useCallback } from "react";
import type { RawFinanceRow, FinanceData, FinancedVehicle, DialogState, Notification, UiStrings, NuiPayload } from "./types";
import Dashboard from "./components/Dashboard";
import VehicleDetail from "./components/VehicleDetail";
import ConfirmationDialog from "./components/ConfirmationDialog";
import { formatCurrencyAmount } from "./utils/currency";

// Keep this in sync with the resource folder name for NUI callback routing.
const RESOURCE_NAME = "gs-app-finance-jg";
const devMode = !(window as any)?.invokeNative;

function fetchNui<T = any>(event: string, data?: unknown): Promise<T> {
  return fetch(`https://${RESOURCE_NAME}/${event}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  }).then((r) => r.json());
}

/** Replace `{key}` placeholders in a template string */
function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

// ---------------------------------------------------------------------------
// English fallback — used in dev mode and as a safety net before Lua responds
// ---------------------------------------------------------------------------
const FALLBACK_UI_STRINGS: UiStrings = {
  loadFailed: "Failed to load vehicle finances.",
  paymentFailed: "Payment failed. Check your balance.",
  paymentProcessFailed: "Failed to process payment.",
  installmentPaid: "Installment paid successfully!",
  vehiclePaidOff: "Vehicle fully paid off!",

  confirmPayment: "Confirm Payment",
  payInstallment: "Pay Installment",
  settleFullBalance: "Settle Full Balance",
  confirmPayInstallment: "Pay next installment of {amount} for your {vehicle}?",
  confirmSettle: "Fully pay off {amount} for your {vehicle}?",
  cancel: "Cancel",

  portfolioLabel: "FINANCIAL PORTFOLIO",
  overview: "Overview",
  fleetSize: "FLEET SIZE",
  nextCycleTotal: "NEXT CYCLE TOTAL",
  upcoming: "UPCOMING",
  totalDebt: "Total Debt",
  equityPaid: "Equity Paid",
  collection: "COLLECTION",
  noActiveFinances: "No Active Finances",
  noFinancesHint: "Your financed vehicles will appear here",
  overdue: "Overdue",
  left: "Left",

  remaining: "Remaining",
  totalFinanced: "Total Financed",
  perInstallment: "Per Installment",
  paidSoFar: "Paid So Far",
  installments: "Installments",
  nextPayment: "NEXT PAYMENT",
  dueIn: "DUE IN",
  overdueWarning: "Payment overdue! Pay now to avoid repossession.",
  payCycle: "Pay Cycle",
  settle: "Settle",
  now: "Now",
  numberLocale: "en-US",
};

const MOCK_RAW: RawFinanceRow[] = [
  {
    finance_data: JSON.stringify({ total: 250000, paid: 75000, recurring_payment: 14583, payments_complete: 5, total_payments: 12, payment_interval: 3, payment_failed: false, seconds_to_next_payment: 7200, seconds_to_repo: 0, dealership_id: 1, vehicle: "sultan2", currency: "$", plate: "VIP 001" }),
    plate: "VIP 001",
    vehicle_label: "Karin Sultan RS"
  },
  {
    finance_data: JSON.stringify({ total: 450000, paid: 112500, recurring_payment: 28125, payments_complete: 3, total_payments: 12, payment_interval: 3, payment_failed: true, seconds_to_next_payment: 0, seconds_to_repo: 3600, dealership_id: 2, vehicle: "zentorno", currency: "$", plate: "LS 77654" }),
    plate: "LS 77654",
    vehicle_label: "Pegassi Zentorno"
  },
  {
    finance_data: JSON.stringify({ total: 85000, paid: 63750, recurring_payment: 7083, payments_complete: 9, total_payments: 12, payment_interval: 3, payment_failed: false, seconds_to_next_payment: 10800, seconds_to_repo: 0, dealership_id: 1, vehicle: "oracle2", currency: "$", plate: "BKR 990" }),
    plate: "BKR 990",
    vehicle_label: "Ubermacht Oracle XS"
  },
  {
    finance_data: JSON.stringify({ total: 1200000, paid: 120000, recurring_payment: 90000, payments_complete: 1, total_payments: 12, payment_interval: 3, payment_failed: false, seconds_to_next_payment: 5400, seconds_to_repo: 0, dealership_id: 3, vehicle: "t20", currency: "$", plate: "FAST 01" }),
    plate: "FAST 01",
    vehicle_label: "Progen T20"
  },
];

function parseVehicles(raw: RawFinanceRow[]): FinancedVehicle[] {
  return raw.map((row, index) => {
    const fd: FinanceData = JSON.parse(row.finance_data);
    return {
      index,
      model: row.vehicle_label || fd.vehicle,
      plate: row.plate || fd.plate,
      total: Number(fd.total),
      paid: Number(fd.paid),
      remaining: Number(fd.total) - Number(fd.paid),
      recurringPayment: Number(fd.recurring_payment),
      paymentsComplete: fd.payments_complete,
      totalPayments: fd.total_payments,
      paymentFailed: fd.payment_failed,
      secondsToNextPayment: fd.seconds_to_next_payment,
      rawFinanceData: fd,
      rawRow: row,
    };
  });
}

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (devMode) return <div className="dev-wrapper">{children}</div>;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<FinancedVehicle[]>([]);
  const [uiStrings, setUiStrings] = useState<UiStrings>(FALLBACK_UI_STRINGS);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    onConfirm: () => {},
  });

  const refreshInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const applyPayload = useCallback((data: NuiPayload) => {
    setUiStrings(data.uiStrings ?? FALLBACK_UI_STRINGS);
    setVehicles(parseVehicles(data.vehicles));
  }, []);

  const loadVehicles = useCallback((silent = false, force = false) => {
    if (devMode) {
      setVehicles(parseVehicles(MOCK_RAW));
      return Promise.resolve();
    }

    const now = Date.now();
    if (!force && (refreshInFlightRef.current || now - lastRefreshAtRef.current < 750)) {
      return Promise.resolve();
    }

    refreshInFlightRef.current = true;
    lastRefreshAtRef.current = now;

    return fetchNui<NuiPayload | false>("Fetching", { action: "fetching" })
      .then((data) => {
        if (data && typeof data === "object" && Array.isArray(data.vehicles)) {
          applyPayload(data);
        }
      })
      .catch(() => {
        if (!silent) {
          showNotification(FALLBACK_UI_STRINGS.loadFailed, "error");
        }
      })
      .finally(() => {
        refreshInFlightRef.current = false;
      });
  }, [applyPayload]);

  useEffect(() => {
    if (devMode) {
      setVehicles(parseVehicles(MOCK_RAW));
      // fallback strings already set as initial state
      return;
    }

    loadVehicles(false, true);
  }, [loadVehicles]);

  useEffect(() => {
    if (devMode) return;

    // Refresh financed vehicles each time the iframe is shown/opened again.
    const refreshOnOpen = () => {
      loadVehicles(true);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as any;

      if (data === "parentReady" || data === "componentsLoaded") {
        refreshOnOpen();
        return;
      }

      if (!data || typeof data !== "object") return;

      const action = data.action;
      const type = data.type;
      const visible = data.visible;

      if (
        action === "appOpen" ||
        action === "openApp" ||
        action === "showApp" ||
        action === "setVisible" ||
        type === "appOpen"
      ) {
        if (visible === false) return;
        refreshOnOpen();
      }
    };

    const onFocus = () => {
      refreshOnOpen();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOnOpen();
      }
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadVehicles]);

  const handlePayment = (plate: string, type: "payment" | "full") => {
    const vehicle = vehicles.find((v) => v.plate === plate);
    if (!vehicle) return;

    const amount = type === "payment" ? vehicle.recurringPayment : vehicle.remaining;
    const label = type === "payment" ? uiStrings.payInstallment : uiStrings.settleFullBalance;
    const template = type === "payment" ? uiStrings.confirmPayInstallment : uiStrings.confirmSettle;

    // Locale-aware number formatting for the {amount} placeholder in confirmation text
    const formattedAmount = formatCurrencyAmount(amount, uiStrings.numberLocale, vehicle.rawFinanceData.currency);
    const desc = fmt(template, { amount: formattedAmount, vehicle: vehicle.model });

    setDialog({
      isOpen: true,
      title: uiStrings.confirmPayment,
      message: desc,
      confirmLabel: label,
      onConfirm: () => {
        setDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);

        const nuiFetch = devMode
          ? Promise.resolve({ vehicles: MOCK_RAW, uiStrings: FALLBACK_UI_STRINGS } as NuiPayload)
          : fetchNui<NuiPayload | false>("Payment", {
              action: "payment",
              index: vehicle.index,
              type,
              amount,
              data: { vehicle: vehicle.rawFinanceData.vehicle },
            });

        nuiFetch
          .then((data) => {
            if (!data) {
              showNotification(uiStrings.paymentFailed, "error");
              return;
            }
            const payload = data as NuiPayload;
            // Refresh uiStrings in case locale changed between open/close
            setUiStrings(payload.uiStrings ?? uiStrings);
            showNotification(
              type === "payment" ? payload.uiStrings.installmentPaid : payload.uiStrings.vehiclePaidOff,
              "success"
            );
            setVehicles(parseVehicles(payload.vehicles));
            if (type === "full") setSelectedPlate(null);
          })
          .catch(() => {
            showNotification(uiStrings.paymentProcessFailed, "error");
          })
          .finally(() => {
            setLoading(false);
          });
      },
    });
  };

  return (
    <AppProvider>
      <div className="flex flex-col h-full bg-[#080808] relative overflow-hidden">
        {selectedPlate === null ? (
        <Dashboard
            vehicles={vehicles}
            onSelect={(plate) => setSelectedPlate(plate)}
            uiStrings={uiStrings}
            numberLocale={uiStrings.numberLocale}
          />
        ) : (
          <VehicleDetail
            vehicle={vehicles.find((v) => v.plate === selectedPlate) || null}
            onPayCycle={(plate) => handlePayment(plate, "payment")}
            onSettle={(plate) => handlePayment(plate, "full")}
            onBack={() => setSelectedPlate(null)}
            uiStrings={uiStrings}
            numberLocale={uiStrings.numberLocale}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[110]">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={uiStrings.cancel}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Notification Toast */}
        {notification && (
          <div
            className={`absolute top-[calc(var(--safe-top)+0.5rem)] left-4 right-4 p-3 rounded-xl shadow-lg border animate-slideInFromTop z-[120] ${
              notification.type === "success"
                ? "bg-neutral-900 border-[#C9A96E]/30 text-[#C9A96E]"
                : "bg-neutral-900 border-red-500/30 text-red-400"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-center">
              {notification.message}
            </p>
          </div>
        )}
      </div>
    </AppProvider>
  );
};

export default App;
