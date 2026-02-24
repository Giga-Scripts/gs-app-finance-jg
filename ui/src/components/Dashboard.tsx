import { Car } from "lucide-react";
import type { FinancedVehicle, UiStrings } from "../types";
import { formatCurrencyAmount } from "../utils/currency";
import { useVehicleImage } from "../utils/vehicleImage";

interface DashboardProps {
  vehicles: FinancedVehicle[];
  onSelect: (plate: string) => void;
  uiStrings: UiStrings;
  numberLocale: string;
}

// ---------------------------------------------------------------------------
// VehicleCard — isolated so each card manages its own image-fallback state
// ---------------------------------------------------------------------------
interface VehicleCardProps {
  vehicle: FinancedVehicle;
  onSelect: (plate: string) => void;
  formatCurrency: (amount: number) => string;
  uiStrings: UiStrings;
}

function VehicleCard({ vehicle, onSelect, formatCurrency, uiStrings }: VehicleCardProps) {
  const { src: imgSrc, onError: imgOnError } = useVehicleImage(vehicle.rawFinanceData.vehicle);

  return (
    <button
      key={vehicle.plate}
      onClick={() => onSelect(vehicle.plate)}
      className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/5 active:scale-[0.97] transition-all"
    >
      {/* Gradient background (always present; sits below the image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />

      {/* Vehicle image (CDN fallback chain) */}
      {imgSrc ? (
        <img
          src={imgSrc}
          onError={imgOnError}
          alt={vehicle.model}
          className="absolute inset-0 w-full h-full object-contain object-center p-3"
          draggable={false}
        />
      ) : (
        /* Model initial watermark — shown only when no image is available */
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[80px] font-black text-white/[0.03] select-none leading-none">
            {vehicle.model.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Bottom gradient overlay — keeps text readable over any image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Overdue badge */}
      {vehicle.paymentFailed && (
        <div className="absolute top-2 right-2 border border-red-500/40 text-red-400 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full bg-black/60">
          {uiStrings.overdue}
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute inset-x-3 bottom-3 text-left">
        <p className="text-white text-[9px] font-medium truncate group-hover:text-[#C9A96E] transition-colors">
          {vehicle.model}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/30 text-[7px] italic">
            {vehicle.totalPayments - vehicle.paymentsComplete} {uiStrings.left}
          </span>
          <span className="text-white/80 text-[8px]">
            {formatCurrency(vehicle.recurringPayment)}
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard({ vehicles, onSelect, uiStrings, numberLocale }: DashboardProps) {
  const rawCurrency = vehicles[0]?.rawFinanceData?.currency;
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, numberLocale, rawCurrency);
  const nextCycleTotal = vehicles.reduce((sum, v) => sum + v.recurringPayment, 0);
  const totalDebt = vehicles.reduce((sum, v) => sum + v.remaining, 0);
  const equityPaid = vehicles.reduce((sum, v) => sum + v.paid, 0);

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-[calc(var(--safe-top)+0.75rem)] pb-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[#C9A96E] text-[8px] uppercase tracking-[0.4em] font-black mb-0.5">
              {uiStrings.portfolioLabel}
            </p>
            <h1 className="text-3xl font-light text-white tracking-tighter">{uiStrings.overview}</h1>
          </div>
          <div className="text-right">
            <p className="text-white/20 text-[7px] uppercase tracking-widest mb-0.5">{uiStrings.fleetSize}</p>
            <p className="text-lg font-light text-white">{vehicles.length}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Next Cycle Total — col-span-2 */}
          <div className="col-span-2 relative overflow-hidden bg-[#C9A96E]/5 border border-[#C9A96E]/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E]/10 blur-[40px] -mr-16 -mt-16" />
            <div className="relative">
              <p className="text-[#C9A96E]/60 text-[7px] uppercase tracking-[0.3em] font-bold mb-1">
                {uiStrings.nextCycleTotal}
              </p>
              <p className="text-3xl font-extralight text-white">{formatCurrency(nextCycleTotal)}</p>
            </div>
            <span className="relative px-3 py-1 bg-[#C9A96E] text-black text-[7px] font-black uppercase rounded-full shrink-0">
              {uiStrings.upcoming}
            </span>
          </div>

          {/* Total Debt */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <p className="text-white/20 text-[7px] uppercase tracking-widest font-bold mb-1">{uiStrings.totalDebt}</p>
            <p className="text-lg font-light text-white">{formatCurrency(totalDebt)}</p>
          </div>

          {/* Equity Paid */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-right">
            <p className="text-white/20 text-[7px] uppercase tracking-widest font-bold mb-1">{uiStrings.equityPaid}</p>
            <p className="text-lg font-light text-white">{formatCurrency(equityPaid)}</p>
          </div>
        </div>
      </div>

      {/* Collection */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-[calc(var(--safe-bottom)+2.5rem)]">
        {/* Section divider */}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-white/20 text-[8px] uppercase tracking-[0.4em] shrink-0">{uiStrings.collection}</p>
          <div className="flex-1 h-[1px] bg-white/[0.03]" />
        </div>

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Car className="w-12 h-12 text-white/10" />
            <p className="text-white/20 text-[10px] uppercase tracking-widest">{uiStrings.noActiveFinances}</p>
            <p className="text-white/10 text-[9px]">{uiStrings.noFinancesHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.plate}
                vehicle={vehicle}
                onSelect={onSelect}
                formatCurrency={formatCurrency}
                uiStrings={uiStrings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
