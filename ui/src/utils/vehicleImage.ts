import { useEffect, useState } from "react";

/** CDN sources tried in order before falling back to the gradient background. */
const IMAGE_SOURCES = [
  (spawn: string) => `https://cfx-nui-jg-advancedgarages/vehicle_images/${spawn}.png`,
  (spawn: string) => `https://cfx-nui-jg-dealerships/vehicle_images/${spawn}.png`,
  (spawn: string) => `https://docs.fivem.net/vehicles/${spawn}.webp`,
] as const;

/**
 * Normalize a raw vehicle spawn/model string into a URL-safe lowercase slug.
 * Falls back to an empty string so callers can detect "no spawn available".
 */
export function normalizeSpawn(raw: string | undefined): string {
  if (!raw) return "";
  return encodeURIComponent(raw.trim().toLowerCase());
}

/**
 * Returns a React img `src` + `onError` handler that walks through the CDN
 * fallback chain.  When all sources are exhausted `src` becomes `null`,
 * signalling the caller to show the gradient background instead.
 *
 * Usage:
 * ```tsx
 * const { src, onError } = useVehicleImage(vehicle.rawFinanceData.vehicle);
 * {src ? <img src={src} onError={onError} … /> : <GradientFallback />}
 * ```
 */
export function useVehicleImage(rawSpawn: string | undefined): {
  src: string | null;
  onError: () => void;
} {
  const spawn = normalizeSpawn(rawSpawn);

  // Start at index 0 if we have a spawn string, otherwise skip straight to
  // the "no image" state so we immediately show the gradient background.
  const [index, setIndex] = useState<number>(spawn ? 0 : IMAGE_SOURCES.length);

  useEffect(() => {
    setIndex(spawn ? 0 : IMAGE_SOURCES.length);
  }, [spawn]);

  const src = index < IMAGE_SOURCES.length && spawn ? IMAGE_SOURCES[index](spawn) : null;

  const onError = () => setIndex((i) => i + 1);

  return { src, onError };
}
