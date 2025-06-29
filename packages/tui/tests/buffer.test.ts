import { describe, expect, test } from "bun:test";
import { OutputBuffer } from "../src/buffer";

describe("OutputBuffer", () => {
  test("basic write and flush", () => {
    const buffer = new OutputBuffer(1024);

    // Check initial state
    expect(buffer.size).toBe(0);
    expect(buffer.hasContent).toBe(false);

    // Write some content
    buffer.write("Hello");
    expect(buffer.size).toBe(5);
    expect(buffer.hasContent).toBe(true);

    // Write more
    buffer.write(" World");
    expect(buffer.size).toBe(11);

    // Note: We can't easily test the actual flush to stdout
    // but we can verify the buffer is cleared
    buffer.flush();
    expect(buffer.size).toBe(0);
    expect(buffer.hasContent).toBe(false);
  });

  test("auto-flush on high water mark", () => {
    const buffer = new OutputBuffer(10); // Small buffer for testing

    // Write up to limit
    buffer.write("12345");
    expect(buffer.size).toBe(5);

    // This should trigger auto-flush
    buffer.write("678901");
    // After auto-flush, only the new content remains
    expect(buffer.size).toBe(6);
  });

  test("reset clears without flushing", () => {
    const buffer = new OutputBuffer();

    buffer.write("Test content");
    expect(buffer.hasContent).toBe(true);

    buffer.reset();
    expect(buffer.size).toBe(0);
    expect(buffer.hasContent).toBe(false);
  });

  test("handles empty flush", () => {
    const buffer = new OutputBuffer();

    // Flushing empty buffer should not throw
    expect(() => buffer.flush()).not.toThrow();
    expect(buffer.size).toBe(0);
  });

  test("handles Unicode content", () => {
    const buffer = new OutputBuffer();

    const unicode = "🎨 Hello 世界 🌍";
    buffer.write(unicode);

    // Size is character count, not byte count
    expect(buffer.size).toBe(unicode.length);

    buffer.flush();
    expect(buffer.size).toBe(0);
  });
});
