// ---------------------------------------------------------------------------
// 17mov_Phone (new app template) compatibility bridge.
//
// The updated 17mov_Phone template reaches into each external app's iframe and
// calls `window.__dispatchAction(action, payload)` to read/drive the app's
// current route. Apps built for the previous template don't expose it, so the
// phone throws "__dispatchAction is not a function" and its OWN render breaks
// (the reported corrupted home screen + repeated uncaught TypeError).
//
// We expose the function synchronously at module load — before the phone ever
// calls it — so the contract is satisfied regardless of when 17mov probes the
// iframe. On lb-phone / yseries / yphone / gksphone this is inert: they never
// call __dispatchAction or setExternalRouting.
//
// Reference (new template): web/src/ExternalRpcBridge.tsx in
// 17movement-net/17mov_Phone_app_boilerplate.
// ---------------------------------------------------------------------------

export type Phone17movRouteHandlers = {
  /** Return the app's current route as a string (e.g. "/" or "/vehicle/ABC123"). */
  getCurrentRoute: () => string;
  /** Drive the app to the given route path. */
  navigate: (path: string) => void;
};

// Default no-op handlers, swapped for live ones once React state exists.
const handlers: Phone17movRouteHandlers = {
  getCurrentRoute: () => "/",
  navigate: () => {},
};

/** Wire the live route handlers once React state is available (see App.tsx). */
export function setPhone17movRouteHandlers(next: Phone17movRouteHandlers): void {
  handlers.getCurrentRoute = next.getCurrentRoute;
  handlers.navigate = next.navigate;
}

/** Install the window-level bridge. Safe to call multiple times. */
export function installPhone17movBridge(): void {
  const w = window as unknown as Record<string, unknown>;
  if (w.__gsFinance17movBridgeInstalled) return;
  w.__gsFinance17movBridgeInstalled = true;

  w.__dispatchAction = (action: string, payload?: { path?: string }) => {
    switch (action) {
      case "GetCurrentRoute":
        return handlers.getCurrentRoute();
      case "Navigate":
        handlers.navigate(String(payload?.path ?? "/"));
        return;
      default:
        // Unknown action: stay silent instead of throwing, so we never break
        // the phone's render over an action we simply don't implement.
        return;
    }
  };

  w.__externalAppReady = true;

  // Register our routes with the phone if the new template exposes the helper.
  if (typeof w.setExternalRouting === "function") {
    try {
      (w.setExternalRouting as (name: string, routes: unknown[]) => void)(
        String(w.name ?? ""),
        [
          { path: "/", index: true },
          { path: "/vehicle/:plate", index: false },
        ],
      );
    } catch {
      // Phone not on the new template / helper shape changed — ignore.
    }
  }
}
