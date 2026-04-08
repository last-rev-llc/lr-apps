import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

/**
 * Wraps components in shared providers for testing.
 * Currently a passthrough — add providers here as the app grows.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Renders a component wrapped in all shared providers.
 * Drop-in replacement for `@testing-library/react` render().
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library for convenience
export { screen, waitFor, within, act } from "@testing-library/react";
