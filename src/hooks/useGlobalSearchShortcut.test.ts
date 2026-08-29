// Unit tests for useGlobalSearchShortcut: the Cmd/Ctrl+K global shortcut that
// opens the Global_Search overlay from anywhere in the app.

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useGlobalSearchShortcut } from "./useGlobalSearchShortcut";

describe("useGlobalSearchShortcut", () => {
  it("calls onTrigger when Ctrl+K is pressed", () => {
    const onTrigger = vi.fn();
    renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("calls onTrigger when Cmd+K (metaKey) is pressed", () => {
    const onTrigger = vi.fn();
    renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    fireEvent.keyDown(document, { key: "k", metaKey: true });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("is case-insensitive to the key value", () => {
    const onTrigger = vi.fn();
    renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    fireEvent.keyDown(document, { key: "K", ctrlKey: true });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("does not call onTrigger for K without a modifier", () => {
    const onTrigger = vi.fn();
    renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    fireEvent.keyDown(document, { key: "k" });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does not call onTrigger for a different key with the modifier held", () => {
    const onTrigger = vi.fn();
    renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    fireEvent.keyDown(document, { key: "j", ctrlKey: true });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", () => {
    const onTrigger = vi.fn();
    const { unmount } = renderHook(() => useGlobalSearchShortcut({ onTrigger }));

    unmount();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
