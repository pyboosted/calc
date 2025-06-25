import { EventEmitter } from "node:events";
import { existsSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import clipboardy from "clipboardy";
import type { KeyEvent } from "../utils/key-event";
import { CalculatorEngine } from "./calculator-engine";
import { TextEditor } from "./text-editor";

export interface TextSelection {
  from: { line: number; char: number };
  to: { line: number; char: number };
}

export interface CalculatorState {
  lines: ReturnType<CalculatorEngine["getLines"]>;
  currentLineIndex: number;
  cursorPosition: number;
  copyHighlight: "result" | "full" | "selection" | null;
  selection: TextSelection | null;
  filename: string | null;
  isModified: boolean;
  isFilenamePrompt: boolean;
  isRenamingFile: boolean;
  promptInput: string;
  promptCursorPosition: number;
  promptSelection: TextSelection | null;
}

export class CalculatorStateManager extends EventEmitter {
  private engine: CalculatorEngine;
  private editor: TextEditor;
  private copyHighlight: "result" | "full" | "selection" | null = null;
  private highlightTimer: NodeJS.Timeout | null = null;
  private filename: string | null = null;
  private isModified = false;
  private isFilenamePrompt = false;
  private filenameEditor: TextEditor = new TextEditor({ multiline: false });
  private initialContent: string;
  private isNewFile = false;
  private isRenamingFile = false;

  constructor(
    initialContent?: string,
    debugMode = false,
    filename?: string,
    isNewFile = false
  ) {
    super();
    this.filename = filename || null;
    this.initialContent = initialContent || "";

    // If it's a new file that doesn't exist yet, mark it as modified
    this.isNewFile = isNewFile;
    if (isNewFile) {
      this.isModified = true;
    }

    // Initialize editor first
    this.editor = new TextEditor({
      multiline: true,
      initialContent: initialContent || "",
    });
    this.setupEditorSubscriptions(this.editor);

    // Initialize filename editor
    this.setupEditorSubscriptions(this.filenameEditor);

    // Initialize engine without content
    this.engine = new CalculatorEngine(undefined, debugMode);

    // Now sync content from editor to engine
    if (initialContent) {
      this.syncEditorToEngine(true); // silent during construction
    }
  }

  // Setup editor event subscriptions
  private setupEditorSubscriptions(editor: TextEditor): void {
    editor.removeAllListeners(); // Clean up any existing

    editor.on("change", () => {
      if (editor === this.editor) {
        this.syncEditorToEngine();
        this.updateModifiedStatus();
      }
      this.emit("stateChanged");
    });

    // Add custom hotkeys based on editor type
    if (editor === this.filenameEditor) {
      editor.hotkeys.bind("Return", () => {
        this.handleFilenamePromptEnter();
        return true;
      });
      // Escape is now handled at app level in Calculator.tsx
    }
  }

  // Sync TextEditor content with CalculatorEngine
  private syncEditorToEngine(silent = false): void {
    const lines = this.editor.getLines();
    const engineLines = this.engine.getLines();

    // Update existing lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        if (i < engineLines.length) {
          this.engine.updateLine(i, line);
        } else {
          this.engine.insertLine(i);
          this.engine.updateLine(i, line);
        }
      }
    }

    // Remove extra lines from engine
    while (engineLines.length > lines.length) {
      this.engine.deleteLine(engineLines.length - 1);
    }

    // Don't emit during construction
    if (!silent) {
      this.emit("stateChanged");
    }
  }

  getState(): CalculatorState {
    const editorState = this.editor.getState();
    const cursorPos = editorState.cursorPosition;

    return {
      lines: this.engine.getLines(),
      currentLineIndex: cursorPos.line,
      cursorPosition: cursorPos.char,
      copyHighlight: this.copyHighlight,
      selection: editorState.selection,
      filename: this.filename,
      isModified: this.isModified,
      isFilenamePrompt: this.isFilenamePrompt,
      isRenamingFile: this.isRenamingFile,
      promptInput: this.filenameEditor.getContent(),
      promptCursorPosition: this.filenameEditor.getCursorPosition().char,
      promptSelection: this.filenameEditor.getSelection(),
    };
  }

  // Input handling methods
  handleCharacterInput(char: string) {
    // Don't allow input during filename prompt
    if (this.isFilenamePrompt) {
      return;
    }

    this.editor.insertChar(char);
  }

  handleBackspace() {
    this.editor.deleteChar();
  }

  handleDelete() {
    this.editor.deleteCharForward();
  }

  handleNewLine() {
    this.editor.insertNewLine();
  }

  handleArrowLeft() {
    this.editor.moveCursorLeft(false);
    this.emit("stateChanged");
  }

  handleArrowRight() {
    this.editor.moveCursorRight(false);
    this.emit("stateChanged");
  }

  // Move cursor to beginning of line (Cmd+Left)
  handleMoveToLineStart() {
    this.editor.moveCursorToLineStart();
    this.emit("stateChanged");
  }

  // Move cursor to end of line (Cmd+Right)
  handleMoveToLineEnd() {
    this.editor.moveCursorToLineEnd();
    this.emit("stateChanged");
  }

  // Move cursor one word left (Option+Left)
  handleMoveWordLeft() {
    this.editor.moveCursorWordLeft();
    this.emit("stateChanged");
  }

  // Move cursor one word right (Option+Right)
  handleMoveWordRight() {
    this.editor.moveCursorWordRight();
    this.emit("stateChanged");
  }

  // Delete to beginning of line (Cmd+Backspace)
  handleDeleteToLineStart() {
    this.editor.deleteToLineStart();
  }

  // Delete word or whitespace (Option+Backspace)
  handleDeleteWord() {
    this.editor.deleteWord();
  }

  // Delete to end of line (Ctrl+K)
  handleDeleteToLineEnd() {
    this.editor.deleteToLineEnd();
  }

  handleArrowUp() {
    this.editor.moveCursorUp();
    this.emit("stateChanged");
  }

  handleArrowDown() {
    this.editor.moveCursorDown();
    this.emit("stateChanged");
  }

  // Swap current line with line above (Option+Up)
  handleSwapLineUp() {
    this.editor.swapLineUp();
  }

  // Swap current line with line below (Option+Down)
  handleSwapLineDown() {
    this.editor.swapLineDown();
  }

  // Copy current line above (Option+Shift+Up)
  handleCopyLineUp() {
    const cursorPos = this.editor.getCursorPosition();
    const lines = this.editor.getLines();

    if (cursorPos.line >= lines.length) {
      return;
    }

    const currentContent = lines[cursorPos.line];
    if (currentContent === undefined) {
      return;
    }

    // Insert line using the new method
    this.editor.insertLine(cursorPos.line, currentContent);
    this.editor.setCursorPosition(cursorPos.line + 1, cursorPos.char);
  }

  // Copy current line below (Option+Shift+Down)
  handleCopyLineDown() {
    const cursorPos = this.editor.getCursorPosition();
    const lines = this.editor.getLines();

    if (cursorPos.line >= lines.length) {
      return;
    }

    const currentContent = lines[cursorPos.line];
    if (currentContent === undefined) {
      return;
    }

    // Insert line using the new method
    this.editor.insertLine(cursorPos.line + 1, currentContent);
    // Cursor stays on the original line
  }

  clearAll() {
    this.engine = new CalculatorEngine();
    this.editor.reset();
    // No need to emit stateChanged - the editor will emit change event
  }

  getCurrentLine() {
    const lines = this.engine.getLines();
    const cursorPos = this.editor.getCursorPosition();
    return lines[cursorPos.line];
  }

  setCopyHighlight(type: "result" | "full" | "selection") {
    // Clear existing timer
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }

    this.copyHighlight = type;
    this.emit("stateChanged");

    // Set timer to clear highlight after 300ms
    this.highlightTimer = setTimeout(() => {
      this.copyHighlight = null;
      this.highlightTimer = null;
      this.emit("stateChanged");
    }, 300);
  }

  // Selection management methods
  startSelection() {
    this.editor.startSelection();
    this.emit("stateChanged");
  }

  updateSelection() {
    const cursorPos = this.editor.getCursorPosition();
    this.editor.extendSelection(cursorPos);
    this.emit("stateChanged");
  }

  clearSelection() {
    this.editor.clearSelection();
    this.emit("stateChanged");
  }

  hasSelection(): boolean {
    return this.editor.getSelection() !== null;
  }

  getSelectedText(): string {
    return this.editor.getSelectedText();
  }

  deleteSelectedText() {
    this.editor.deleteSelection();
  }

  expandSelectionToFullLines() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return;
    }

    // Create normalized selection
    const { from, to } = selection;
    const normalizedFrom = { ...from };
    const normalizedTo = { ...to };

    if (from.line > to.line || (from.line === to.line && from.char > to.char)) {
      // Swap if needed
      normalizedFrom.line = to.line;
      normalizedFrom.char = to.char;
      normalizedTo.line = from.line;
      normalizedTo.char = from.char;
    }

    // Expand to full lines
    const lines = this.editor.getLines();
    normalizedFrom.char = 0;
    normalizedTo.char = lines[normalizedTo.line]?.length || 0;

    // Update selection
    this.editor.startSelection();
    this.editor.extendSelection(normalizedTo);

    this.emit("stateChanged");
  }

  // Selection navigation methods
  handleArrowLeftWithSelection() {
    this.editor.navigateWithSelection(() => this.editor.moveCursorLeft(true));
    this.emit("stateChanged");
  }

  handleArrowRightWithSelection() {
    this.editor.navigateWithSelection(() => this.editor.moveCursorRight(true));
    this.emit("stateChanged");
  }

  handleArrowUpWithSelection() {
    this.editor.navigateWithSelection(() => this.editor.moveCursorUp(true));
    this.emit("stateChanged");
  }

  handleArrowDownWithSelection() {
    this.editor.navigateWithSelection(() => this.editor.moveCursorDown(true));
    this.emit("stateChanged");
  }

  handleMoveWordLeftWithSelection() {
    this.editor.navigateWithSelection(() =>
      this.editor.moveCursorWordLeft(true)
    );
    this.emit("stateChanged");
  }

  handleMoveWordRightWithSelection() {
    this.editor.navigateWithSelection(() =>
      this.editor.moveCursorWordRight(true)
    );
    this.emit("stateChanged");
  }

  handleMoveToLineStartWithSelection() {
    this.editor.navigateWithSelection(() =>
      this.editor.moveCursorToLineStart(true)
    );
    this.emit("stateChanged");
  }

  handleMoveToLineEndWithSelection() {
    this.editor.navigateWithSelection(() =>
      this.editor.moveCursorToLineEnd(true)
    );
    this.emit("stateChanged");
  }

  // Handle navigation with optional selection extension
  handleNavigationKey(
    action: () => void,
    extending: boolean,
    actionType?: string
  ) {
    if (extending) {
      // This is now handled by the specific selection methods above
      // The action should be one of those methods
      action();
    } else {
      const selection = this.editor.getSelection();
      if (selection) {
        // For left/right arrows, move to selection edge
        if (actionType === "left") {
          // Normalize selection
          const { from, to } = selection;
          if (
            from.line > to.line ||
            (from.line === to.line && from.char > to.char)
          ) {
            // Move to 'to' which is actually the start
            this.editor.setCursorPosition(to.line, to.char);
          } else {
            // Move to 'from'
            this.editor.setCursorPosition(from.line, from.char);
          }
          return;
        }
        if (actionType === "right") {
          // Normalize selection
          const { from, to } = selection;
          if (
            from.line > to.line ||
            (from.line === to.line && from.char > to.char)
          ) {
            // Move to 'from' which is actually the end
            this.editor.setCursorPosition(from.line, from.char);
          } else {
            // Move to 'to'
            this.editor.setCursorPosition(to.line, to.char);
          }
          return;
        }
        // For other navigation, just clear selection
        this.editor.clearSelection();
      }
      // Perform normal navigation
      action();
    }
  }

  // Selection mode actions (when selection exists)
  handleSelectionCopy() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    const selectedText = this.getSelectedText();
    if (selectedText) {
      clipboardy.writeSync(selectedText);
      // Show visual feedback for copy
      this.setCopyHighlight("selection");
      // Keep selection active
      return true;
    }
    return false;
  }

  handleSelectionPaste() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    try {
      const clipboardText = clipboardy.readSync();
      this.editor.replaceSelection(clipboardText);
      return true;
    } catch {
      return false;
    }
  }

  handleSelectionCut() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    const selectedText = this.getSelectedText();
    if (selectedText) {
      clipboardy.writeSync(selectedText);
      this.deleteSelectedText();
      return true;
    }
    return false;
  }

  handleSelectionDelete() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    this.deleteSelectedText();
    return true;
  }

  handleSelectionExpand() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    this.expandSelectionToFullLines();
    return true;
  }

  handleSelectionEscape() {
    const selection = this.editor.getSelection();
    if (!selection) {
      return false;
    }

    // Move cursor to where user was actively selecting (selection.to)
    this.editor.setCursorPosition(selection.to.line, selection.to.char);
    return true;
  }

  // File operations
  private setModified(modified: boolean) {
    if (this.isModified !== modified) {
      this.isModified = modified;
    }
  }

  private updateModifiedStatus() {
    // For new files that don't exist yet, always mark as modified until saved
    if (this.isNewFile) {
      this.setModified(true);
    } else {
      // For existing files, check if content has changed
      this.setModified(this.hasContentChanged());
    }
  }

  getCurrentContent(): string {
    return this.editor.getContent();
  }

  hasContentChanged(): boolean {
    return this.getCurrentContent() !== this.initialContent;
  }

  handleRename() {
    // Don't allow rename for new files that don't exist yet
    if (this.isNewFile || !this.filename) {
      return false;
    }

    this.startFilenamePrompt(true);
    return true;
  }

  saveFile(): boolean {
    if (!this.filename) {
      // Need to prompt for filename
      this.startFilenamePrompt();
      return false;
    }

    try {
      const content = this.getCurrentContent();
      writeFileSync(this.filename, content, "utf-8");
      this.initialContent = content;
      this.isNewFile = false; // File now exists
      this.setModified(false);
      this.emit("stateChanged");
      return true;
    } catch (error) {
      // In production, we might want to show an error message
      console.error("Failed to save file:", error);
      return false;
    }
  }

  saveFileAs(newFilename: string): boolean {
    try {
      const content = this.getCurrentContent();
      writeFileSync(newFilename, content, "utf-8");
      this.filename = newFilename;
      this.initialContent = content;
      this.isNewFile = false; // File now exists
      this.setModified(false);
      this.emit("stateChanged");
      return true;
    } catch (error) {
      console.error("Failed to save file:", error);
      return false;
    }
  }

  renameFile(newFilename: string): boolean {
    if (!this.filename) {
      return false;
    }

    // If keeping the same filename, just save the file
    if (newFilename === this.filename) {
      return this.saveFile();
    }

    try {
      const content = this.getCurrentContent();

      // If file is modified, save with new name
      if (this.isModified) {
        writeFileSync(newFilename, content, "utf-8");
      } else {
        // If not modified, rename the existing file
        renameSync(this.filename, newFilename);
      }

      // If it was a new file that didn't exist, just update the filename
      if (this.isNewFile) {
        this.filename = newFilename;
        this.emit("stateChanged");
        return true;
      }

      // Delete the old file if we saved to a new name
      if (this.isModified && existsSync(this.filename)) {
        unlinkSync(this.filename);
      }

      this.filename = newFilename;
      this.initialContent = content;
      this.isNewFile = false; // File now exists
      this.setModified(false);
      this.emit("stateChanged");
      return true;
    } catch (error) {
      console.error("Failed to rename file:", error);
      return false;
    }
  }

  startFilenamePrompt(isRename = false) {
    this.isFilenamePrompt = true;
    this.isRenamingFile = isRename;
    this.filenameEditor.reset();

    // For rename, pre-fill with current filename
    if (isRename && this.filename) {
      this.filenameEditor.setContent(this.filename, 0, this.filename.length);
    }

    this.filenameEditor.setFocused(true);
    // No need to emit stateChanged - the editor will emit change event
  }

  handleFilenamePromptInput(char: string) {
    if (!this.isFilenamePrompt) {
      return;
    }

    this.filenameEditor.insertChar(char);
    this.emit("stateChanged");
  }

  handleFilenamePromptBackspace() {
    if (!this.isFilenamePrompt) {
      return;
    }

    this.filenameEditor.deleteChar();
    this.emit("stateChanged");
  }

  handleFilenamePromptDelete() {
    if (!this.isFilenamePrompt) {
      return;
    }
    // In our implementation, Delete acts like Backspace to match main editor
    this.filenameEditor.deleteChar();
    this.emit("stateChanged");
  }

  handleFilenamePromptEnter() {
    if (!this.isFilenamePrompt) {
      return;
    }

    const filename = this.filenameEditor.getContent().trim();
    if (filename) {
      if (this.isRenamingFile) {
        this.renameFile(filename);
      } else {
        this.saveFileAs(filename);
      }
    }

    this.cancelFilenamePrompt();
  }

  cancelFilenamePrompt() {
    this.isFilenamePrompt = false;
    this.isRenamingFile = false;
    this.filenameEditor.reset();
    this.emit("stateChanged");
  }

  // Filename prompt navigation methods
  handleFilenamePromptLeft() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorLeft();
    this.emit("stateChanged");
  }

  handleFilenamePromptRight() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorRight();
    this.emit("stateChanged");
  }

  handleFilenamePromptHome() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorToLineStart();
    this.emit("stateChanged");
  }

  handleFilenamePromptEnd() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorToLineEnd();
    this.emit("stateChanged");
  }

  handleFilenamePromptWordLeft() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorWordLeft();
    this.emit("stateChanged");
  }

  handleFilenamePromptWordRight() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.moveCursorWordRight();
    this.emit("stateChanged");
  }

  handleFilenamePromptDeleteWord() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.deleteWord();
    this.emit("stateChanged");
  }

  handleFilenamePromptDeleteToStart() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.deleteToLineStart();
    this.emit("stateChanged");
  }

  handleFilenamePromptDeleteToEnd() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.deleteToLineEnd();
    this.emit("stateChanged");
  }

  getFilename(): string | null {
    return this.filename;
  }

  getIsModified(): boolean {
    return this.isModified;
  }

  getIsFilenamePrompt(): boolean {
    return this.isFilenamePrompt;
  }

  getPromptInput(): string {
    return this.filenameEditor.getContent();
  }

  getPromptCursorPosition(): number {
    return this.filenameEditor.getCursorPosition().char;
  }

  getIsNewFile(): boolean {
    return this.isNewFile;
  }

  // Handle key input for the active editor
  handleKeyInput(key: KeyEvent, input: string): boolean {
    if (this.isFilenamePrompt) {
      return this.filenameEditor.handleKeyInput(key, input);
    }
    return this.editor.handleKeyInput(key, input);
  }

  // Filename prompt selection navigation methods
  handleFilenamePromptLeftWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorLeft(true)
    );
    this.emit("stateChanged");
  }

  handleFilenamePromptRightWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorRight(true)
    );
    this.emit("stateChanged");
  }

  handleFilenamePromptWordLeftWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorWordLeft(true)
    );
    this.emit("stateChanged");
  }

  handleFilenamePromptWordRightWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorWordRight(true)
    );
    this.emit("stateChanged");
  }

  handleFilenamePromptHomeWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorToLineStart(true)
    );
    this.emit("stateChanged");
  }

  handleFilenamePromptEndWithSelection() {
    if (!this.isFilenamePrompt) {
      return;
    }
    this.filenameEditor.navigateWithSelection(() =>
      this.filenameEditor.moveCursorToLineEnd(true)
    );
    this.emit("stateChanged");
  }

  // Handle filename prompt navigation with selection
  handleFilenamePromptNavigationKey(action: () => void, extending: boolean) {
    if (!this.isFilenamePrompt) {
      return;
    }

    if (extending) {
      // This is now handled by the specific selection methods above
      action();
    } else {
      // Clear selection and navigate
      this.filenameEditor.clearSelection();
      action();
    }

    this.emit("stateChanged");
  }
}
