/**
 * Utilities to handle comments in the source text.
 * Supported comment styles:
 * - Line starts with ';' (historical assembler-style comment)
 * - '//' inline or full-line comments
 * - '#' inline or full-line comments
 */

/**
 * Remove inline comments from a single line, preserving code before comment markers.
 */
export function stripInlineComments(line: string): string {
  let out = line;
  // First, if the line itself starts with ';', treat whole line as comment
  const trimmed = out.trimStart();
  if (trimmed.startsWith(';')) return '';

  // Find earliest occurrence among // and # that is not inside quotes
  const markers = ['//', '#'];

  // Simple state machine for quotes
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    const prev = i > 0 ? out[i - 1] : '';
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    if (!inSingle && !inDouble) {
      for (const m of markers) {
        if (out.startsWith(m, i)) {
          return out.slice(0, i).trimEnd();
        }
      }
    }
  }
  return out.trimEnd();
}

/**
 * Returns true if a line is empty or a pure comment line.
 */
export function isIgnorableLine(line: string): boolean {
  const stripped = stripInlineComments(line);
  return stripped.trim() === '';
}

/**
 * Given full text, returns an array of code-only lines with comments removed,
 * preserving original line count and order. Comment-only lines become ''.
 */
export function stripCommentsFromText(text: string): string[] {
  const lines = text.split('\n');
  return lines.map(stripInlineComments);
}

