import { ChevronLeft, AlertTriangle } from "lucide-react";
import type { FinancedVehicle, UiStrings } from "../types";
import { formatCurrencyAmount } from "../utils/currency";
import { useVehicleImage } from "../utils/vehicleImage";

interface VehicleDetailProps {
  vehicle: FinancedVehicle | null;
  onPayCycle: (plate: string) => void;
  onSettle: (plate: string) => void;
  onBack: () => void;
  uiStrings: UiStrings;
  numberLocale: string;
}

const formatTime = (seconds: number, nowLabel: string): string => {
  if (seconds <= 0) return nowLabel;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function VehicleDetail({ vehicle, onPayCycle, onSettle, onBack, uiStrings, numberLocale }: VehicleDetailProps) {
  // Hook must be called unconditionally — use vehicle spawn or empty string
  const { src: imgSrc, onError: imgOnError } = useVehicleImage(vehicle?.rawFinanceData.vehicle);

  if (!vehicle) return null;

  const formatCurrency = (amount: number) =>
    formatCurrencyAmount(amount, numberLocale, vehicle.rawFinanceData.currency);

  const progressPct = Math.min((vehicle.paymentsComplete / vehicle.totalPayments) * 100, 100);

  const metrics = [
    { label: uiStrings.remaining,      value: formatCurrency(vehicle.remaining) },
    { label: uiStrings.totalFinanced,  value: formatCurrency(vehicle.total) },
    { label: uiStrings.perInstallment, value: formatCurrency(vehicle.recurringPayment) },
    { label: uiStrings.paidSoFar,      value: formatCurrency(vehicle.paid) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white overflow-hidden">
      {/* Header bar */}
      <div className="h-[calc(3rem+var(--safe-top))] pt-[var(--safe-top)] shrink-0 flex items-center px-4 border-b border-white/[0.03]">
        <button
          onClick={onBack}
          className="active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-[#C9A96E]" />
        </button>
        <p className="flex-1 text-center text-[11px] font-black text-[#C9A96E] uppercase tracking-[0.18em]">
          {vehicle.plate}
        </p>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-4 pb-[calc(var(--safe-bottom)+1rem)] gap-3">
        {/* Hero card */}
        <div className="relative h-28 rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 shrink-0">
          {/* Gradient background (always present; sits below the image) */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />

          {/* Vehicle image (CDN fallback chain) */}
          {imgSrc ? (
            <img
              src={imgSrc}
              onError={imgOnError}
              alt={vehicle.model}
              className="absolute inset-0 w-full h-full object-contain object-center p-4"
              draggable={false}
            />
          ) : (
            /* Model initial watermark — shown only when no image is available */
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[100px] font-black text-white/[0.04] select-none leading-none">
                {vehicle.model.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Bottom gradient overlay — keeps text readable over any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Model name */}
          <p className="absolute bottom-3 left-4 text-lg font-light text-white tracking-tight">
            {vehicle.model}
          </p>

          {/* Overdue badge */}
          {vehicle.paymentFailed && (
            <div className="absolute top-2 right-2 border border-red-500/40 text-red-400 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full bg-black/60">
              {uiStrings.overdue}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="shrink-0">
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/20 text-[7px] uppercase tracking-widest font-bold">
              {vehicle.paymentsComplete} / {vehicle.totalPayments} {uiStrings.installments}
            </span>
            <span className="text-white/20 text-[7px] uppercase tracking-widest font-bold">
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>

        {/* 2x2 metrics grid */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {metrics.map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-3"
            >
              <p className="text-white/20 text-[7px] uppercase tracking-widest mb-1 font-bold">
                {label}
              </p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Payment module */}
        <div
          className={`bg-[#C9A96E]/5 rounded-2xl p-4 space-y-3 shrink-0 ${
            vehicle.paymentFailed
              ? "border border-red-500/30"
              : "border border-[#C9A96E]/20"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#C9A96E]/60 text-[7px] uppercase tracking-[0.3em] font-bold mb-1">
                {uiStrings.nextPayment}
              </p>
              <p className="text-lg font-light text-white">
                {formatCurrency(vehicle.recurringPayment)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/20 text-[7px] uppercase tracking-widest font-bold mb-1">
                {uiStrings.dueIn}
              </p>
              <p className="text-sm font-medium text-white">
                {formatTime(vehicle.secondsToNextPayment, uiStrings.now)}
              </p>
            </div>
          </div>

          {/* Overdue warning */}
          {vehicle.paymentFailed && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <p className="text-red-400 text-[8px]">
                {uiStrings.overdueWarning}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onPayCycle(vehicle.plate)}
              className="flex-1 py-2.5 bg-[#C9A96E] text-black text-[9px] font-black uppercase tracking-widest rounded-lg active:bg-[#B8985D] transition-colors"
            >
              {uiStrings.payCycle}
            </button>
            <button
              onClick={() => onSettle(vehicle.plate)}
              className="px-4 py-2.5 bg-white/5 text-white/60 text-[8px] font-bold uppercase tracking-widest rounded-lg border border-white/5 active:bg-white/10 transition-colors"
            >
              {uiStrings.settle}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
