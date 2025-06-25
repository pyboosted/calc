import { describe, expect, test } from "bun:test";
import {
  CSI_ARROW_SEQUENCES,
  isIncompleteCSISequence,
  parseCSIModifier,
} from "../src/utils/csi-sequences";
import { parseKeyEvent } from "../src/utils/key-event";

describe("CSI Sequences", () => {
  describe("parseCSIModifier", () => {
    test("parses modifier codes correctly", () => {
      // 2 = Shift
      expect(parseCSIModifier(2)).toEqual({
        shift: true,
        alt: false,
        ctrl: false,
        meta: false,
      });

      // 3 = Alt
      expect(parseCSIModifier(3)).toEqual({
        shift: false,
        alt: true,
        ctrl: false,
        meta: false,
      });

      // 5 = Ctrl
      expect(parseCSIModifier(5)).toEqual({
        shift: false,
        alt: false,
        ctrl: true,
        meta: false,
      });

      // 9 = Meta
      expect(parseCSIModifier(9)).toEqual({
        shift: false,
        alt: false,
        ctrl: false,
        meta: true,
      });

      // 10 = Shift+Meta
      expect(parseCSIModifier(10)).toEqual({
        shift: true,
        alt: false,
        ctrl: false,
        meta: true,
      });

      // 7 = Alt+Ctrl
      expect(parseCSIModifier(7)).toEqual({
        shift: false,
        alt: true,
        ctrl: true,
        meta: false,
      });
    });
  });

  describe("isIncompleteCSISequence", () => {
    test("detects incomplete CSI sequences", () => {
      expect(isIncompleteCSISequence("\x1b[1;10")).toBe(true);
      expect(isIncompleteCSISequence("\x1b[1;2")).toBe(true);
      expect(isIncompleteCSISequence("\x1b[1;")).toBe(false); // ends with semicolon
      expect(isIncompleteCSISequence("\x1b[1;10D")).toBe(false); // complete
      expect(isIncompleteCSISequence("\x1b[A")).toBe(false); // simple arrow
      expect(isIncompleteCSISequence("abc")).toBe(false); // not CSI
      expect(isIncompleteCSISequence("\x1b")).toBe(false); // lone ESC
      expect(isIncompleteCSISequence("\x1b[")).toBe(true); // incomplete CSI start
      expect(isIncompleteCSISequence("\x1b[1")).toBe(true); // incomplete CSI
    });
  });

  describe("CSI_ARROW_SEQUENCES", () => {
    test("has correct sequences for modified arrows", () => {
      // Shift+Left
      expect(CSI_ARROW_SEQUENCES["\x1b[1;2D"]).toEqual({
        key: "left",
        modifiers: { shift: true, alt: false, ctrl: false, meta: false },
      });

      // Cmd+Shift+Left
      expect(CSI_ARROW_SEQUENCES["\x1b[1;10D"]).toEqual({
        key: "left",
        modifiers: { shift: true, alt: false, ctrl: false, meta: true },
      });

      // Ctrl+Alt+Right
      expect(CSI_ARROW_SEQUENCES["\x1b[1;7C"]).toEqual({
        key: "right",
        modifiers: { shift: false, alt: true, ctrl: true, meta: false },
      });
    });
  });

  describe("parseKeyEvent with CSI sequences", () => {
    test("parses complete CSI sequences", () => {
      const event = parseKeyEvent("", { sequence: "\x1b[1;10D" });
      expect(event).not.toBeNull();
      expect(event?.key).toBe("left");
      expect(event?.shift).toBe(true);
      expect(event?.meta).toBe(true);
      expect(event?.alt).toBe(false);
      expect(event?.ctrl).toBe(false);
    });

    test("returns null for incomplete CSI sequences", () => {
      const event = parseKeyEvent("", { sequence: "\x1b[1;10" });
      expect(event).toBeNull();
    });

    test("handles split CSI sequences when combined", () => {
      // First part - incomplete
      const event1 = parseKeyEvent("", { sequence: "\x1b[1;10" });
      expect(event1).toBeNull();

      // When combined with second part
      const event2 = parseKeyEvent("D", { sequence: "\x1b[1;10D" });
      expect(event2).not.toBeNull();
      expect(event2?.key).toBe("left");
      expect(event2?.shift).toBe(true);
      expect(event2?.meta).toBe(true);
    });
  });
});
