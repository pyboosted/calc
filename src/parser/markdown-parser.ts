import type { MarkdownElement, MarkdownNode } from "../types";

export class MarkdownParser {
  private input: string;
  private position = 0;
  private current = "";

  constructor(input: string) {
    this.input = input;
    this.current = this.input[0] || "";
  }

  private advance(): void {
    this.position++;
    this.current = this.input[this.position] || "";
  }

  private peek(offset = 1): string {
    return this.input[this.position + offset] || "";
  }

  parse(): MarkdownNode {
    const elements = this.parseElements();
    return {
      type: "markdown",
      elements,
    };
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Markdown parsing requires handling multiple element types
  private parseElements(): MarkdownElement[] {
    const elements: MarkdownElement[] = [];
    let textBuffer = "";

    while (this.position < this.input.length) {
      // Check for special characters
      if (this.current === "*" || this.current === "_") {
        // Flush text buffer
        if (textBuffer) {
          elements.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        const element = this.parseEmphasis();
        if (element) {
          elements.push(element);
        } else {
          // Not valid emphasis, treat as text
          textBuffer += this.current;
          this.advance();
        }
      } else if (this.current === "`") {
        // Flush text buffer
        if (textBuffer) {
          elements.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        // Check for triple backticks
        if (this.peek() === "`" && this.peek(2) === "`") {
          const codeblock = this.parseCodeBlock();
          if (codeblock) {
            elements.push(codeblock);
          } else {
            textBuffer += this.current;
            this.advance();
          }
        } else {
          const code = this.parseCode();
          if (code) {
            elements.push(code);
          } else {
            textBuffer += this.current;
            this.advance();
          }
        }
      } else if (this.current === "[") {
        // Flush text buffer
        if (textBuffer) {
          elements.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        const link = this.parseLink();
        if (link) {
          elements.push(link);
        } else {
          textBuffer += this.current;
          this.advance();
        }
      } else if (this.current === "~" && this.peek() === "~") {
        // Flush text buffer
        if (textBuffer) {
          elements.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        const strikethrough = this.parseStrikethrough();
        if (strikethrough) {
          elements.push(strikethrough);
        } else {
          textBuffer += this.current;
          this.advance();
        }
      } else {
        // Regular text
        textBuffer += this.current;
        this.advance();
      }
    }

    // Flush remaining text
    if (textBuffer) {
      elements.push({ type: "text", value: textBuffer });
    }

    return elements;
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Emphasis parsing handles bold/italic with different markers and nesting
  private parseEmphasis(): MarkdownElement | null {
    const startPos = this.position;
    const marker = this.current;

    // Check for bold (** or __)
    if (this.peek() === marker) {
      this.advance(); // First marker
      this.advance(); // Second marker

      const content: MarkdownElement[] = [];
      let textBuffer = "";

      while (
        this.position < this.input.length &&
        !(this.current === marker && this.peek() === marker)
      ) {
        if (this.current === "*" || this.current === "_") {
          // Nested emphasis
          if (textBuffer) {
            content.push({ type: "text", value: textBuffer });
            textBuffer = "";
          }

          const nested = this.parseEmphasis();
          if (nested) {
            content.push(nested);
          } else {
            textBuffer += this.current;
            this.advance();
          }
        } else if (this.current === "`") {
          // Code inside bold
          if (textBuffer) {
            content.push({ type: "text", value: textBuffer });
            textBuffer = "";
          }

          const code = this.parseCode();
          if (code) {
            content.push(code);
          } else {
            textBuffer += this.current;
            this.advance();
          }
        } else {
          textBuffer += this.current;
          this.advance();
        }
      }

      if (this.current === marker && this.peek() === marker) {
        // Found closing markers
        if (textBuffer) {
          content.push({ type: "text", value: textBuffer });
        }
        this.advance(); // First closing marker
        this.advance(); // Second closing marker
        return { type: "bold", content, marker: marker === "*" ? "**" : "__" };
      }

      // No closing markers found, restore position
      this.position = startPos;
      this.current = this.input[this.position] || "";
      return null;
    }

    // Check for italic (* or _)
    this.advance(); // Skip marker

    const content: MarkdownElement[] = [];
    let textBuffer = "";

    while (this.position < this.input.length && this.current !== marker) {
      if (this.current === "`") {
        // Code inside italic
        if (textBuffer) {
          content.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        const code = this.parseCode();
        if (code) {
          content.push(code);
        } else {
          textBuffer += this.current;
          this.advance();
        }
      } else {
        textBuffer += this.current;
        this.advance();
      }
    }

    if (this.current === marker) {
      // Found closing marker
      if (textBuffer) {
        content.push({ type: "text", value: textBuffer });
      }
      this.advance(); // Skip closing marker
      return { type: "italic", content, marker: marker as "*" | "_" };
    }

    // No closing marker found, restore position
    this.position = startPos;
    this.current = this.input[this.position] || "";
    return null;
  }

  private parseCode(): MarkdownElement | null {
    const startPos = this.position;
    this.advance(); // Skip opening backtick

    let code = "";
    while (this.position < this.input.length && this.current !== "`") {
      code += this.current;
      this.advance();
    }

    if (this.current === "`") {
      this.advance(); // Skip closing backtick
      return { type: "code", value: code };
    }

    // No closing backtick found, restore position
    this.position = startPos;
    this.current = this.input[this.position] || "";
    return null;
  }

  private parseCodeBlock(): MarkdownElement | null {
    const _startPos = this.position;
    this.advance(); // First backtick
    this.advance(); // Second backtick
    this.advance(); // Third backtick

    // For inline code blocks, check if we immediately have closing backticks
    if (this.current === "`" && this.peek() === "`" && this.peek(2) === "`") {
      // Empty code block
      this.advance(); // First closing backtick
      this.advance(); // Second closing backtick
      this.advance(); // Third closing backtick
      return {
        type: "codeblock",
        value: "",
      };
    }

    // Check for language identifier (only valid if followed by space or content)
    let language = "";
    let isReadingLanguage = true;
    let hasSpace = false;

    // Read potential language identifier
    while (this.position < this.input.length && isReadingLanguage) {
      if (this.current === " " || this.current === "\n") {
        hasSpace = true;
        isReadingLanguage = false;
        this.advance();
      } else if (
        this.current === "`" &&
        this.peek() === "`" &&
        this.peek(2) === "`"
      ) {
        // Closing backticks found - everything before this is the content (not language)
        isReadingLanguage = false;
      } else {
        language += this.current;
        this.advance();
      }
    }

    let code = "";
    // If we didn't find a space after the language, it's actually code content
    if (!hasSpace && language) {
      code = language;
      language = "";
    }

    // Capture everything until we find closing triple backticks
    while (this.position < this.input.length) {
      if (this.current === "`" && this.peek() === "`" && this.peek(2) === "`") {
        // Found closing triple backticks
        this.advance(); // First closing backtick
        this.advance(); // Second closing backtick
        this.advance(); // Third closing backtick
        return {
          type: "codeblock",
          value: code.trim(),
          language: language.trim() || undefined,
        };
      }
      code += this.current;
      this.advance();
    }

    // If we reach the end without closing backticks, still treat it as a code block
    // This handles the case where someone just types ``` at the end of a line
    // Mark it as incomplete so the renderer knows not to add closing backticks
    return {
      type: "codeblock",
      value: code.trim(),
      language: language.trim() || undefined,
      incomplete: true,
    } as MarkdownElement;
  }

  private parseLink(): MarkdownElement | null {
    const startPos = this.position;
    this.advance(); // Skip [

    let text = "";
    while (this.position < this.input.length && this.current !== "]") {
      text += this.current;
      this.advance();
    }

    if (this.current === "]" && this.peek() === "(") {
      this.advance(); // Skip ]
      this.advance(); // Skip (

      let url = "";
      // TypeScript false positive - this.current changes after advance()
      while (
        this.position < this.input.length &&
        (this.current as string) !== ")"
      ) {
        url += this.current;
        this.advance();
      }

      // TypeScript false positive - this.current can be ")" here
      if ((this.current as string) === ")") {
        this.advance(); // Skip )
        return { type: "link", text, url };
      }
    }

    // Invalid link format, restore position
    this.position = startPos;
    this.current = this.input[this.position] || "";
    return null;
  }

  private parseStrikethrough(): MarkdownElement | null {
    const startPos = this.position;
    this.advance(); // First ~
    this.advance(); // Second ~

    const content: MarkdownElement[] = [];
    let textBuffer = "";

    while (
      this.position < this.input.length &&
      !(this.current === "~" && this.peek() === "~")
    ) {
      if (this.current === "`") {
        // Code inside strikethrough
        if (textBuffer) {
          content.push({ type: "text", value: textBuffer });
          textBuffer = "";
        }

        const code = this.parseCode();
        if (code) {
          content.push(code);
        } else {
          textBuffer += this.current;
          this.advance();
        }
      } else {
        textBuffer += this.current;
        this.advance();
      }
    }

    if (this.current === "~" && this.peek() === "~") {
      // Found closing markers
      if (textBuffer) {
        content.push({ type: "text", value: textBuffer });
      }
      this.advance(); // First closing ~
      this.advance(); // Second closing ~
      return { type: "strikethrough", content };
    }

    // No closing markers found, restore position
    this.position = startPos;
    this.current = this.input[this.position] || "";
    return null;
  }
}
