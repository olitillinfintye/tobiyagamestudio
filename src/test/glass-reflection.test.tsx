import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGlassReflection } from "@/hooks/useGlassReflection";

function GlassSurfaces() {
  const root = useGlassReflection();
  return <div ref={root} data-testid="root"><div className="glass-card" data-testid="card"><span>Card content</span></div><div className="studio-glass" data-testid="control" /></div>;
}

describe("glass reflections", () => {
  let frames: FrameRequestCallback[];
  let preferenceChanged: () => void;
  let motionAllowed: boolean;

  beforeEach(() => {
    frames = [];
    motionAllowed = true;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      get matches() { return motionAllowed; },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_, listener) => { preferenceChanged = listener as () => void; }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const movePointer = (target: HTMLElement, clientX = 50, pointerType = "mouse") => {
    fireEvent(target, Object.assign(new MouseEvent("pointermove", { bubbles: true, clientX, clientY: 50 }), { pointerType }));
  };

  const measure = (target: HTMLElement) => {
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ width: 200, height: 100, left: 0, top: 0, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
  };

  it("coalesces pointer movement into one frame and illuminates the containing card", () => {
    render(<GlassSurfaces />);
    const card = screen.getByTestId("card");
    measure(card);
    movePointer(screen.getByText("Card content"), 50);
    movePointer(screen.getByText("Card content"), 150);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    act(() => frames[0](0));
    expect(card.style.getPropertyValue("--glass-x")).toBe("75%");
    expect(card.style.getPropertyValue("--glass-y")).toBe("50%");
    expect(card).toHaveAttribute("data-glass-active", "true");
  });

  it("clears the old surface when moving between cards and leaving the page", () => {
    render(<GlassSurfaces />);
    const card = screen.getByTestId("card");
    const control = screen.getByTestId("control");
    measure(card);
    measure(control);
    movePointer(card);
    act(() => frames[0](0));
    movePointer(control);
    act(() => frames[1](0));
    expect(card).not.toHaveAttribute("data-glass-active");
    expect(control).toHaveAttribute("data-glass-active", "true");
    fireEvent.pointerLeave(screen.getByTestId("root"));
    expect(control.style.getPropertyValue("--glass-x")).toBe("");
    expect(control).not.toHaveAttribute("data-glass-active");
  });

  it("ignores touch and reduced-motion input and clears a live reflection on preference changes", () => {
    render(<GlassSurfaces />);
    const card = screen.getByTestId("card");
    measure(card);
    movePointer(card, 50, "touch");
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    movePointer(card);
    act(() => frames[0](0));
    motionAllowed = false;
    act(() => preferenceChanged());
    movePointer(card);
    expect(card).not.toHaveAttribute("data-glass-active");
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("cancels queued work on unmount", () => {
    const view = render(<GlassSurfaces />);
    movePointer(screen.getByTestId("card"));
    view.unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});