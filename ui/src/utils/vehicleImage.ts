import { useEffect, useMemo, useState } from "react";

/** Static CDN sources tried after jg-vehiclestudio URLs from Lua. */
const STATIC_IMAGE_SOURCES = [
  (spawn: string) => `https://cfx-nui-jg-advancedgarages/vehicle_images/${spawn}.png`,
  (spawn: string) => `https://cfx-nui-jg-dealerships/vehicle_images/${spawn}.png`,
  (spawn: string) => `https://docs.fivem.net/vehicles/${spawn}.webp`,
] as const;

export interface VehicleImageSources {
  image?: string | null;
  fallbacks?: string[] | null;
}

/**
 * Normalize a raw vehicle spawn/model string into a URL-safe lowercase slug.
 * Falls back to an empty string so callers can detect "no spawn available".
 */
export function normalizeSpawn(raw: string | undefined): string {
  if (!raw) return "";
  return encodeURIComponent(raw.trim().toLowerCase());
}

function buildImageChain(spawn: string, studio?: VehicleImageSources | null): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();

  const push = (url: string | null | undefined) => {
    if (typeof url === "string" && url !== "" && !seen.has(url)) {
      seen.add(url);
      chain.push(url);
    }
  };

  if (studio) {
    push(studio.image);
    for (const url of studio.fallbacks ?? []) {
      push(url);
    }
  }

  for (const source of STATIC_IMAGE_SOURCES) {
    push(source(spawn));
  }

  return chain;
}

/**
 * Returns a React img `src` + `onError` handler that walks through:
 * 1. jg-vehiclestudio (URLs resolved in Lua)
 * 2. jg-advancedgarages local PNGs
 * 3. jg-dealerships local PNGs
 * 4. docs.fivem.net
 *
 * When all sources are exhausted `src` becomes `null`.
 */
export function useVehicleImage(
  rawSpawn: string | undefined,
  studioSources?: VehicleImageSources | null,
): {
  src: string | null;
  onError: () => void;
} {
  const spawn = normalizeSpawn(rawSpawn);
  const fallbackKey = (studioSources?.fallbacks ?? []).join("|");

  const chain = useMemo(
    () => (spawn ? buildImageChain(spawn, studioSources) : []),
    [spawn, studioSources?.image, fallbackKey],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [spawn, chain.length, studioSources?.image, fallbackKey]);

  const src = index < chain.length ? chain[index] : null;
  const onError = () => setIndex((i) => i + 1);

  return { src, onError };
}
