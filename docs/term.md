# Terminal Editor UI Specification

This document outlines the architectural and functional requirements for a performant terminal-based editor with modern TUI features, implemented using **Bun** with direct access to terminal I/O. This project aims to provide advanced interactivity, rendering control, and clipboard/image features, while preserving traditional terminal behavior such as scrollback and non-invasive rendering.

---

## 🧱 Core Architecture

- **Execution Environment**: Native Bun runtime (no Node polyfills, minimal dependencies).
- **Rendering Model**: Top-down, line-by-line terminal rendering using ANSI escape sequences.
- **Input Handling**: Custom input parser for raw key events (including escape sequences, modifiers, mouse).
- **Editor Layout**:
  - Visible area (`viewport`) updates only when the cursor moves out of bounds or when scrolling.
  - **Scroll region** is dynamically adjusted to preserve a fixed **status bar** at the bottom.
  - Editor never switches to the alternate screen (`DECSET 1049`) to preserve terminal scrollback.

---

## 🖱 Mouse and Input Features (Kitty Protocol Required)

- Uses Kitty mouse protocol:
  - **SGR extended mouse tracking** for precise click/drag/wheel handling.
  - Mouse clicks are used to:
    - Move the cursor.
    - Trigger actions (e.g. image copy, scrollbar drag).
  - Mouse wheel triggers scroll inside the editor (with scroll region updates) while maintaining scrollback above.

---

## 📟 Scroll Behavior

- **Scroll region** (`ESC[1;{rows-1}r`) locks the bottom row for a **status bar**, allowing viewport scrolling above it.
- When user scrolls up:
  - The editor scrolls up internally until only 4 lines (3 + status bar) are visible.
  - If fewer than 4 lines remain, the scroll region is disabled and the terminal resumes native scrollback behavior.
  - Editor output becomes "dimmed" (`SGR 2`) to visually indicate inactive state.
- Upon scroll down (restoring ≥ 4 visible lines), the scroll region and normal rendering are re-enabled.

---

## 🎯 Cursor Handling

- Cursor position (`cursorY`) is independent of viewport start (`viewportTop`).
- Cursor is only moved or revealed when:
  - A mouse click occurs within the viewport.
  - Navigation keys (`j`, `k`, arrows) are used.
- The viewport auto-scrolls **only** when cursor moves outside the visible area.
  - Uses a `scrolloff` safety margin (default: 5 lines).
  - When completely offscreen, cursor is centered vertically.

---

## 🎨 Selective Rendering

- Only dirty lines (those changed from the previous frame) are redrawn.
- It is possible to selectively render lines **above the cursor** or outside scroll-region (e.g. spinners, scrollbars).
- Multiple rendering layers are supported:
  - Main editor lines.
  - Decorations and background indicators.
  - Status bar (fixed position).
- Rendering is batched into **one stdout.write() per frame** to minimize latency.

---

## 🖼️ Graphics Support (Kitty Graphics Protocol Required)

- KGP is used to display raster charts or images:
  - Transmit images in **PNG format**, with alpha channel preserved (transparent background supported).
  - Image position is defined in cell coordinates (`s`, `v`, `x`, `y`).
  - Chunked transmission (`m=1`) for large images (> 4 KB base64).
- Images may include `Pu=…` payloads to enable clickable behavior.

---

## 📋 Clipboard Integration (Kitty / iTerm2 / WezTerm required)

- On image click, the editor can:
  - Encode the original PNG as base64.
  - Transmit via **OSC 52**:
    - If `OSC 52;1337;File=…` is supported, image is copied **as a file** to the system clipboard (iTerm2-style).
    - Otherwise, fallback to `OSC 52;…` plain text, or invoke native tools (`wl-copy`, `pbcopy`, etc).
- Optional: Kitty Drag-and-Drop (`t=d`, `u=file://…`) allows dragging the image into other GUI apps.

---

## 📊 Plotting and Charts

- Charts can be rendered in two modes:
  - **Raster mode** (PNG via KGP) with full color and transparency.
  - **ASCII fallback mode** using unicode (e.g. `braille`, `block`, or `asciichart`) when KGP is unsupported.
- The editor must detect Kitty graphics support via `ESC_Gi=1,a=qESC\` and timeout fallback (≤ 100ms).

---

## ⚙️ Performance Constraints

- Target latency: ≤ 1ms from input to frame flush.
- `stdout.write()` is always batched and flushed explicitly using Bun’s native `FileSink`.
- HighWaterMark for output buffer is tuned to fit a full-frame diff (~16–64 KB).
- Editor should support large files (≥100k lines), but only keeps a viewport buffer in memory.

---

### Synchronized Rendering
The editor SHOULD wrap any multi-line repaint in the synchronized-update
protocol (`CSI ?2026 h … CSI ?2026 l`) to avoid tearing on high-Hz monitors.

### Drag-and-Drop (Kitty/Ghostty)
If the terminal replies "drag-and-drop" capability in the KGP query,
charts MAY set `a=d,t=d,u=file://$TMP/chart.png` so users can drag the
image into GUI apps.

### Light/Dark Theme Hooks
When the terminal sends `OSC 12 ; ? ST` notifications, the editor
MUST adjust its color theme to match, unless disabled by user config.

## 🚧 Known Limitations

- OSC 52 is blocked inside `tmux`/`screen` unless explicitly allowed.
- PNG copy as file may not work on Windows Terminal or legacy emulators.
- Drag-and-Drop is only effective in Kitty and partially in WezTerm.

---

## 📦 Requirements Summary

| Feature | Requirement |
|--------|-------------|
| Runtime | **Bun** native runtime |
| Terminal | Kitty / WezTerm / iTerm2 (for full feature set) |
| Mouse | Kitty SGR mouse protocol |
| Clipboard | OSC 52 with file support (Kitty / iTerm2) |
| Graphics | Kitty Graphics Protocol (KGP) |
| Image Format | PNG (with alpha) |
| Output | Batched ANSI sequences, no alternate buffer |

---