// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@repo/test-utils";

const updateMemeTitleMock = vi.fn();
const deleteMemeMock = vi.fn();
const routerPushMock = vi.fn();

vi.mock("../actions", () => ({
  updateMemeTitle: (...args: unknown[]) => updateMemeTitleMock(...args),
  deleteMeme: (...args: unknown[]) => deleteMemeMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

import { LibraryGrid } from "../library/components/library-grid";
import type { MemeWithSignedUrl } from "../actions";

function makeMeme(overrides: Partial<MemeWithSignedUrl>): MemeWithSignedUrl {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    title: "Untitled",
    templateId: "classic",
    textZones: { top: "TOP", bottom: "BOTTOM" },
    fontSize: 48,
    storagePath: "user-1/abc.png",
    widthPx: 600,
    heightPx: 450,
    createdAt: "2026-04-30T00:00:00Z",
    updatedAt: "2026-04-30T00:00:00Z",
    signedUrl: "https://signed/abc.png",
    ...overrides,
  };
}

beforeEach(() => {
  updateMemeTitleMock.mockReset();
  deleteMemeMock.mockReset();
  routerPushMock.mockReset();
});

describe("LibraryGrid", () => {
  it("renders one card per meme", () => {
    const memes = [
      makeMeme({ id: "11111111-1111-4111-8111-111111111111", title: "A" }),
      makeMeme({ id: "22222222-2222-4222-8222-222222222222", title: "B" }),
      makeMeme({ id: "33333333-3333-4333-8333-333333333333", title: "C" }),
    ];
    renderWithProviders(<LibraryGrid memes={memes} />);
    for (const meme of memes) {
      expect(screen.getByTestId(`library-card-${meme.id}`)).toBeTruthy();
    }
  });

  it("inline-edits the title and persists via updateMemeTitle (optimistic)", async () => {
    updateMemeTitleMock.mockResolvedValue({
      ok: true,
      meme: { title: "Renamed" },
    });
    const meme = makeMeme({ title: "Old" });
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-title-${meme.id}`));
    const input = screen.getByTestId(`library-title-input-${meme.id}`) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(updateMemeTitleMock).toHaveBeenCalledWith(meme.id, "Renamed");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId(`library-title-${meme.id}`).textContent,
      ).toBe("Renamed");
    });
  });

  it("reverts the optimistic title update when updateMemeTitle fails", async () => {
    updateMemeTitleMock.mockResolvedValue({ ok: false, error: "boom" });
    const meme = makeMeme({ title: "Original" });
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-title-${meme.id}`));
    const input = screen.getByTestId(`library-title-input-${meme.id}`) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Bad" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(
        screen.getByTestId(`library-title-${meme.id}`).textContent,
      ).toBe("Original");
    });
  });

  it("delete confirmation prevents accidental clicks: Cancel does nothing", async () => {
    const meme = makeMeme({});
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-delete-${meme.id}`));
    expect(
      screen.getByTestId(`library-delete-cancel-${meme.id}`),
    ).toBeTruthy();
    fireEvent.click(screen.getByTestId(`library-delete-cancel-${meme.id}`));

    expect(deleteMemeMock).not.toHaveBeenCalled();
    expect(screen.getByTestId(`library-card-${meme.id}`)).toBeTruthy();
  });

  it("delete optimistically removes the card after confirm", async () => {
    deleteMemeMock.mockResolvedValue({ ok: true });
    const meme = makeMeme({});
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-delete-${meme.id}`));
    fireEvent.click(screen.getByTestId(`library-delete-confirm-${meme.id}`));

    await waitFor(() => {
      expect(deleteMemeMock).toHaveBeenCalledWith(meme.id);
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId(`library-card-${meme.id}`),
      ).toBeNull();
    });
  });

  it("restores the card if delete fails on the server", async () => {
    deleteMemeMock.mockResolvedValue({ ok: false, error: "nope" });
    const meme = makeMeme({});
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-delete-${meme.id}`));
    fireEvent.click(screen.getByTestId(`library-delete-confirm-${meme.id}`));

    await waitFor(() => {
      expect(deleteMemeMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId(`library-card-${meme.id}`)).toBeTruthy();
    });
  });

  it("Load into editor navigates with ?meme=<id>", () => {
    const meme = makeMeme({ id: "abc-123" });
    renderWithProviders(<LibraryGrid memes={[meme]} />);

    fireEvent.click(screen.getByTestId(`library-load-${meme.id}`));
    expect(routerPushMock).toHaveBeenCalledWith(
      `/apps/meme-generator?meme=${encodeURIComponent(meme.id)}`,
    );
  });
});
