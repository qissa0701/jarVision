// Unit tests for useMeetingPrep: the draft -> approve human-in-the-loop state
// machine, against an injected mock Storage.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Meeting } from "@/types";
import { useMeetingPrep, type MeetingPrepStorage } from "./useMeetingPrep";

function createMockStorage(): MeetingPrepStorage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
} {
  return {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };
}

const meeting: Meeting = {
  id: "m1",
  title: "Architecture Review",
  startTime: "10:30",
  endTime: "11:30",
  type: "video",
  attendees: "Eng leads (5)",
};

describe("useMeetingPrep", () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("defaults to 'none' for a meeting with no draft", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));
    expect(result.current.getDraftFor(meeting).status).toBe("none");
  });

  it("draft() produces a 'drafted' state with non-empty generated text", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));

    act(() => {
      result.current.draft(meeting);
    });

    const draft = result.current.getDraftFor(meeting);
    expect(draft.status).toBe("drafted");
    expect(draft.text.length).toBeGreaterThan(0);
    expect(storage.setItem).toHaveBeenCalled();
  });

  it("editDraft() updates the text while staying in 'drafted'", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));

    act(() => {
      result.current.draft(meeting);
    });
    act(() => {
      result.current.editDraft(meeting, "Edited by the user");
    });

    const draft = result.current.getDraftFor(meeting);
    expect(draft.status).toBe("drafted");
    expect(draft.text).toBe("Edited by the user");
  });

  it("approve() never runs without a prior draft/edit action (human-in-the-loop)", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));

    act(() => {
      result.current.draft(meeting);
    });
    act(() => {
      result.current.editDraft(meeting, "Final reviewed text");
    });
    act(() => {
      result.current.approve(meeting);
    });

    const draft = result.current.getDraftFor(meeting);
    expect(draft.status).toBe("approved");
    expect(draft.text).toBe("Final reviewed text");
  });

  it("discard() resets a meeting's draft back to 'none'", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));

    act(() => {
      result.current.draft(meeting);
    });
    act(() => {
      result.current.discard(meeting);
    });

    const draft = result.current.getDraftFor(meeting);
    expect(draft.status).toBe("none");
    expect(draft.text).toBe("");
  });

  it("reopen() moves an approved draft back to 'drafted' without losing the text", () => {
    const { result } = renderHook(() => useMeetingPrep("engineer", storage));

    act(() => {
      result.current.draft(meeting);
    });
    act(() => {
      result.current.approve(meeting);
    });
    act(() => {
      result.current.reopen(meeting);
    });

    const draft = result.current.getDraftFor(meeting);
    expect(draft.status).toBe("drafted");
    expect(draft.text.length).toBeGreaterThan(0);
  });

  it("keeps draft state independent per role", () => {
    const { result: engineerResult } = renderHook(() =>
      useMeetingPrep("engineer", storage),
    );
    const { result: portfolioResult } = renderHook(() =>
      useMeetingPrep("portfolio", storage),
    );

    act(() => {
      engineerResult.current.draft(meeting);
    });

    expect(engineerResult.current.getDraftFor(meeting).status).toBe("drafted");
    expect(portfolioResult.current.getDraftFor(meeting).status).toBe("none");
  });
});
