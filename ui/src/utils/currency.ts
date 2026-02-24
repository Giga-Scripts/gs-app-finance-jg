/**
 * Account-like currency values that come from FiveM economy accounts.
 * These are NOT ISO codes or symbols — we must not pass them to Intl.
 */
const ACCOUNT_CURRENCY_VALUES = new Set(["bank", "cash", "money", ""]);

/**
 * Given a BCP-47 locale, return the ISO-4217 currency code that best
 * represents the locale's primary currency.
 */
function localeToCurrencyCode(locale: string): string {
  const tag = locale.toLowerCase();
  if (tag.startsWith("pt-br")) return "BRL";
  // Add more as needed; default to USD
  return "USD";
}

/**
 * Determine how to format the currency amount.
 *
 * Returns one of:
 *   { mode: "intl"; currencyCode: string }   — use Intl currency style
 *   { mode: "symbol"; symbol: string }        — prefix a literal symbol + localized number
 */
type CurrencyResolution =
  | { mode: "intl"; currencyCode: string }
  | { mode: "symbol"; symbol: string };

function resolveCurrency(rawCurrency: string | undefined, locale: string): CurrencyResolution {
  const value = (rawCurrency ?? "").trim();

  // Account-like or empty → derive ISO code from locale
  if (ACCOUNT_CURRENCY_VALUES.has(value.toLowerCase())) {
    return { mode: "intl", currencyCode: localeToCurrencyCode(locale) };
  }

  // Looks like an ISO-4217 code (3 ASCII letters)
  if (/^[A-Za-z]{3}$/.test(value)) {
    return { mode: "intl", currencyCode: value.toUpperCase() };
  }

  // Literal symbol (e.g. "$", "€", "R$") — keep it, use localized number
  if (/^[^\d\s]+$/.test(value)) {
    return { mode: "symbol", symbol: value };
  }

  // Final fallback
  return { mode: "intl", currencyCode: localeToCurrencyCode(locale) };
}

/**
 * Format a numeric amount as a currency string.
 *
 * - For ISO codes / locale-derived codes: uses `Intl.NumberFormat` with
 *   `style: "currency"` so the symbol, spacing and separator all follow the locale.
 *   e.g. pt-BR + BRL → "R$ 4.537" / en-US + USD → "$4,537"
 *
 * - For literal symbols (e.g. "$"): prefixes the symbol to a locale-formatted number.
 */
export function formatCurrencyAmount(
  amount: number,
  locale: string,
  rawCurrency: string | undefined,
): string {
  const resolution = resolveCurrency(rawCurrency, locale);

  if (resolution.mode === "intl") {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: resolution.currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      // Invalid currency code — fall through to symbol mode with a plain "$"
      return "$" + new Intl.NumberFormat(locale).format(amount);
    }
  }

  // mode === "symbol"
  return resolution.symbol + new Intl.NumberFormat(locale).format(amount);
}

/**
 * Kept for backwards-compat (used nowhere internally now, but exported in case
 * other callers rely on it).
 */
export function resolveCurrencySymbol(rawCurrency: string | undefined, locale: string): string {
  const resolution = resolveCurrency(rawCurrency, locale);
  if (resolution.mode === "symbol") return resolution.symbol;

  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: resolution.currencyCode,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    return "$";
  }
}
