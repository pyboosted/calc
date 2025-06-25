import { describe, expect, test } from "bun:test";
import {
  CSI_ARROW_SEQUENCES,
  isIncompleteCSISequence,
  parseCSIModifier,
} from "../src/utils/csi-sequences";
import { parseKeyEvent } from "../src/utils/key-event";

describe("CSI Sequences", () => {
  describe("parseCSIModifier", () => {
    test.each([
      [2, { shift: true, alt: false, ctrl: false, meta: false }], // Shift
      [3, { shift: false, alt: true, ctrl: false, meta: false }], // Alt
      [5, { shift: false, alt: false, ctrl: true, meta: false }], // Ctrl
      [9, { shift: false, alt: false, ctrl: false, meta: true }], // Meta
      [10, { shift: true, alt: false, ctrl: false, meta: true }], // Shift+Meta
      [7, { shift: false, alt: true, ctrl: true, meta: false }], // Alt+Ctrl
    ])("modifier code %i", (modifierCode, expected) => {
      expect(parseCSIModifier(modifierCode)).toEqual(expected);
    });
  });

  describe("isIncompleteCSISequence", () => {
    test.each([
      ["\x1b[1;10", true], // incomplete modifier sequence
      ["\x1b[1;2", true], // incomplete modifier sequence
      ["\x1b[1;", false], // ends with semicolon
      ["\x1b[1;10D", false], // complete sequence
      ["\x1b[A", false], // simple arrow
      ["abc", false], // not CSI
      ["\x1b", false], // lone ESC
      ["\x1b[", true], // incomplete CSI start
      ["\x1b[1", true], // incomplete CSI
    ])("sequence %p", (sequence, expected) => {
      expect(isIncompleteCSISequence(sequence)).toBe(expected);
    });
  });

  describe("CSI_ARROW_SEQUENCES", () => {
    test.each([
      [
        "\x1b[1;2D",
        "Shift+Left",
        {
          key: "left",
          modifiers: { shift: true, alt: false, ctrl: false, meta: false },
        },
      ],
      [
        "\x1b[1;10D",
        "Cmd+Shift+Left",
        {
          key: "left",
          modifiers: { shift: true, alt: false, ctrl: false, meta: true },
        },
      ],
      [
        "\x1b[1;7C",
        "Ctrl+Alt+Right",
        {
          key: "right",
          modifiers: { shift: false, alt: true, ctrl: true, meta: false },
        },
      ],
    ])("sequence %s (%s)", (sequence, _description, expected) => {
      expect(CSI_ARROW_SEQUENCES[sequence]).toEqual(expected);
    });
  });

  describe("parseKeyEvent with CSI sequences", () => {
    test.each([
      [
        "complete CSI sequence",
        { input: "", sequence: "\x1b[1;10D" },
        {
          isNull: false,
          key: "left",
          shift: true,
          meta: true,
          alt: false,
          ctrl: false,
        },
      ],
      [
        "incomplete CSI sequence",
        { input: "", sequence: "\x1b[1;10" },
        { isNull: true },
      ],
    ])(
      "%s",
      (
        _description,
        params,
        expected: {
          isNull: boolean;
          key?: string;
          shift?: boolean;
          meta?: boolean;
          alt?: boolean;
          ctrl?: boolean;
        }
      ) => {
        const event = parseKeyEvent(params.input, {
          sequence: params.sequence,
        });

        if (expected.isNull) {
          expect(event).toBeNull();
        } else {
          expect(event).not.toBeNull();
          if (event && expected.key !== undefined) {
            expect(event.key).toBe(expected.key);
          }
          if (event && expected.shift !== undefined) {
            expect(event.shift).toBe(expected.shift);
          }
          if (event && expected.meta !== undefined) {
            expect(event.meta).toBe(expected.meta);
          }
          if (event && expected.alt !== undefined) {
            expect(event.alt).toBe(expected.alt);
          }
          if (event && expected.ctrl !== undefined) {
            expect(event.ctrl).toBe(expected.ctrl);
          }
        }
      }
    );

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
