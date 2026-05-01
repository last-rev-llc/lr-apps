// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@repo/test-utils";

const generateMemeCaptionMock = vi.fn();
vi.mock("../actions", () => ({
  generateMemeCaption: (...args: unknown[]) => generateMemeCaptionMock(...args),
}));

import { AiCaptionModal } from "../components/ai-caption-modal";

beforeEach(() => {
  generateMemeCaptionMock.mockReset();
});

describe("AiCaptionModal", () => {
  it("calls generateMemeCaption with topic and templateId on submit", async () => {
    generateMemeCaptionMock.mockResolvedValueOnce({
      ok: true,
      captions: { top: "TOP", bottom: "BOTTOM" },
    });
    const onCaptions = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AiCaptionModal
        open
        onOpenChange={onOpenChange}
        templateId="t-1"
        onCaptions={onCaptions}
      />,
    );

    const topicInput = screen.getByLabelText(/topic/i);
    fireEvent.change(topicInput, { target: { value: "shipping a feature" } });
    fireEvent.click(screen.getByText("Generate"));

    await waitFor(() => {
      expect(generateMemeCaptionMock).toHaveBeenCalledWith({
        topic: "shipping a feature",
        templateId: "t-1",
        style: undefined,
      });
    });
    expect(onCaptions).toHaveBeenCalledWith({ top: "TOP", bottom: "BOTTOM" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("passes a non-default style through to the action", async () => {
    generateMemeCaptionMock.mockResolvedValueOnce({
      ok: true,
      captions: { top: "T" },
    });
    renderWithProviders(
      <AiCaptionModal
        open
        onOpenChange={vi.fn()}
        templateId="t-1"
        onCaptions={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/topic/i), {
      target: { value: "ducks" },
    });
    fireEvent.change(screen.getByTestId("ai-caption-style"), {
      target: { value: "wholesome" },
    });
    fireEvent.click(screen.getByText("Generate"));

    await waitFor(() => {
      expect(generateMemeCaptionMock).toHaveBeenCalledWith({
        topic: "ducks",
        templateId: "t-1",
        style: "wholesome",
      });
    });
  });

  it("shows a retry-after message on RateLimitedError", async () => {
    const future = Date.now() + 90_000; // 90s from now
    const rateErr = Object.assign(new Error("rate limit"), {
      name: "RateLimitedError",
      resetAt: future,
    });
    generateMemeCaptionMock.mockRejectedValueOnce(rateErr);

    renderWithProviders(
      <AiCaptionModal
        open
        onOpenChange={vi.fn()}
        templateId="t-1"
        onCaptions={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/topic/i), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Generate"));

    await waitFor(() => {
      expect(screen.getByTestId("ai-caption-error").textContent).toMatch(
        /Rate limit/i,
      );
    });
    expect(screen.getByTestId("ai-caption-error").textContent).toMatch(
      /try again/i,
    );
  });

  it("shows a feature-locked message on FeatureAccessError", async () => {
    const accessErr = Object.assign(new Error("denied"), {
      name: "FeatureAccessError",
    });
    generateMemeCaptionMock.mockRejectedValueOnce(accessErr);

    renderWithProviders(
      <AiCaptionModal
        open
        onOpenChange={vi.fn()}
        templateId="t-1"
        onCaptions={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/topic/i), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Generate"));

    await waitFor(() => {
      expect(screen.getByTestId("ai-caption-error").textContent).toMatch(
        /upgrade/i,
      );
    });
  });
});
