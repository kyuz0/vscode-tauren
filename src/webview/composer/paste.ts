const pasteMarkerRegex = /\[paste #(\d+)( (\+\d+ lines|\d+ chars))?\]/g;
const csiuControlRegex = /\x1b\[(\d+);5u/g;

export type ComposerPasteResult = {
  text: string;
  cursor: number;
};

export class ComposerPasteBuffer {
  private readonly pastes = new Map<number, string>();
  private pasteCounter = 0;

  public paste(text: string, pastedText: string, selectionStart: number, selectionEnd: number): ComposerPasteResult {
    const start = clampIndex(selectionStart, text.length);
    const end = clampIndex(selectionEnd, text.length);
    const left = Math.min(start, end);
    const right = Math.max(start, end);
    const insertText = this.preparePasteText(text, pastedText, left);
    const nextText = text.slice(0, left) + insertText + text.slice(right);

    return {
      text: nextText,
      cursor: left + insertText.length
    };
  }

  public expand(text: string): string {
    if (this.pastes.size === 0 || !text.includes('[paste #')) {
      return text;
    }

    return text.replace(pasteMarkerRegex, (marker, idText: string) => {
      const paste = this.pastes.get(Number(idText));
      return paste ?? marker;
    });
  }

  public clear(): void {
    this.pastes.clear();
    this.pasteCounter = 0;
  }

  private preparePasteText(currentText: string, pastedText: string, cursor: number): string {
    const decodedText = pastedText.replace(csiuControlRegex, (match, code: string) => {
      const cp = Number(code);

      if (cp >= 97 && cp <= 122) {
        return String.fromCharCode(cp - 96);
      }

      if (cp >= 65 && cp <= 90) {
        return String.fromCharCode(cp - 64);
      }

      return match;
    });
    const cleanText = normalizePasteText(decodedText);
    let filteredText = cleanText
      .split('')
      .filter((char) => char === '\n' || char.charCodeAt(0) >= 32)
      .join('');

    if (/^[/~.]/.test(filteredText)) {
      const charBeforeCursor = cursor > 0 ? currentText[cursor - 1] : '';

      if (charBeforeCursor && /\w/.test(charBeforeCursor)) {
        filteredText = ` ${filteredText}`;
      }
    }

    const pastedLines = filteredText.split('\n');
    const totalChars = filteredText.length;

    if (pastedLines.length > 10 || totalChars > 1000) {
      this.pasteCounter += 1;
      const pasteId = this.pasteCounter;
      this.pastes.set(pasteId, filteredText);

      return pastedLines.length > 10
        ? `[paste #${pasteId} +${pastedLines.length} lines]`
        : `[paste #${pasteId} ${totalChars} chars]`;
    }

    return filteredText;
  }
}

function normalizePasteText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ');
}

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(Number.isFinite(index) ? Math.trunc(index) : length, 0), length);
}
