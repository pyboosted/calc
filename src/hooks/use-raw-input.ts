import { createInterface, emitKeypressEvents } from "node:readline";
import { useStdin } from "ink";
import { useEffect, useRef } from "react";
import type { KeyEvent, RawKeypressData } from "../utils/key-event";
import { parseKeyEvent } from "../utils/key-event";

type InputHandler = (input: string, key: KeyEvent) => void;

interface UseRawInputOptions {
  /**
   * Whether this input handler is active
   * @default true
   */
  isActive?: boolean;
}

/**
 * Custom hook that provides raw keyboard input with full control
 * This replaces Ink's useInput to give us access to all escape sequences
 */
export function useRawInput(
  handler: InputHandler,
  options: UseRawInputOptions = {}
) {
  const { isActive = true } = options;
  const { stdin, setRawMode, isRawModeSupported } = useStdin();
  const handlerRef = useRef(handler);
  const incompleteSequenceRef = useRef<{
    str?: string;
    key?: RawKeypressData;
  } | null>(null);

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!(isActive && isRawModeSupported)) {
      return;
    }

    // Set raw mode to get character-by-character input
    setRawMode(true);

    // Enable keypress events on stdin
    // Create a readline interface to control escape timeout
    const rl = createInterface({
      input: stdin,
      escapeCodeTimeout: 50,
      // biome-ignore lint/suspicious/noExplicitAny: Node.js types don't include escapeCodeTimeout
    } as any);

    // Enable keypress events with our interface
    // biome-ignore lint/suspicious/noExplicitAny: Type mismatch between readline interfaces
    emitKeypressEvents(stdin, rl as any);

    // Handler for raw keypress events
    const handleKeypress = (str: string | undefined, key: RawKeypressData) => {
      let actualStr = str;
      let actualKey = key;

      // If we have a buffered incomplete sequence, try to combine it
      if (incompleteSequenceRef.current) {
        const buffered = incompleteSequenceRef.current;
        // Combine sequences
        actualStr = (buffered.str || "") + (str || "");
        actualKey = {
          ...key,
          sequence: (buffered.key?.sequence || "") + (key?.sequence || ""),
        };
        if (process.env.DEBUG) {
          console.log(
            "[RAWINPUT] Combining buffered sequence:",
            buffered.key?.sequence,
            "+",
            key?.sequence,
            "=",
            actualKey.sequence
          );
        }
        incompleteSequenceRef.current = null;
      }

      const keyEvent = parseKeyEvent(actualStr, actualKey);

      if (keyEvent === null) {
        // This is an incomplete sequence, buffer it
        incompleteSequenceRef.current = { str: actualStr, key: actualKey };
        return;
      }

      handlerRef.current(keyEvent.input, keyEvent);
    };

    // Attach the keypress listener
    stdin.on("keypress", handleKeypress);

    return () => {
      // Clean up
      stdin.removeListener("keypress", handleKeypress);
      setRawMode(false);
      rl.close();
    };
  }, [stdin, setRawMode, isRawModeSupported, isActive]);
}
