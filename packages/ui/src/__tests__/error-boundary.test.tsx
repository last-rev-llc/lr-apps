import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "../components/error-boundary";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Content rendered</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React's error boundary console.error noise in tests
  beforeEach(() => {
    captureException.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Content rendered")).toBeInTheDocument();
  });

  it("renders default fallback on error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("renders custom ReactNode fallback", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders custom render function fallback", () => {
    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div>
            <span>Error: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Error: Test error")).toBeInTheDocument();
  });

  it("calls onError callback", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("Test error");
  });

  it("forwards caught errors to Sentry by default", async () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    await waitFor(() => expect(captureException).toHaveBeenCalledOnce());
    const [err, hint] = captureException.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("Test error");
    expect(hint).toMatchObject({
      contexts: { react: { componentStack: expect.any(String) } },
    });
  });

  it("does not forward to Sentry when reportToSentry={false}", async () => {
    render(
      <ErrorBoundary reportToSentry={false}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    // Allow any pending microtasks to settle
    await Promise.resolve();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("resets error state when Try again is clicked", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Rerender with a non-throwing child first, then click reset.
    // (Clicking reset while shouldThrow=true would just re-throw immediately.)
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    // Still showing error fallback because ErrorBoundary state hasn't been reset
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Now click Try again to clear the error state
    await user.click(screen.getByText("Try again"));
    // After reset, child renders successfully
    expect(screen.getByText("Content rendered")).toBeInTheDocument();
  });
});
