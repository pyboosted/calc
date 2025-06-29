/**
 * Output buffer for efficient terminal writes
 * Uses Bun's optimized stdout writer
 */
export class OutputBuffer {
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = "";
  private readonly highWaterMark: number;

  constructor(highWaterMark = 64 * 1024) {
    this.highWaterMark = highWaterMark;
    // @ts-expect-error - Bun-specific API
    this.writer = globalThis.Bun.stdout.writer({ highWaterMark });
  }

  /**
   * Write data to the buffer
   */
  write(data: string): void {
    // Auto-flush if adding this data would exceed high water mark
    if (this.buffer.length + data.length > this.highWaterMark) {
      this.flush();
    }

    this.buffer += data;
  }

  /**
   * Flush all buffered data to stdout
   */
  flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    // Convert string to Uint8Array for Bun writer
    const encoder = new TextEncoder();
    const bytes = encoder.encode(this.buffer);

    // Write and flush
    this.writer.write(bytes);
    this.buffer = "";
  }

  /**
   * Reset the buffer without writing
   */
  reset(): void {
    this.buffer = "";
  }

  /**
   * Get current buffer size
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Check if buffer has content
   */
  get hasContent(): boolean {
    return this.buffer.length > 0;
  }
}
