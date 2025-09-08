/**
 * Parses labels from assembly-like source code.
 * Example: "LOOP:" on line 4 becomes { LOOP: 4 }
 */
import { stripInlineComments } from './comments';

export function parseLabels(content: string): Record<string, number> {
  const labelMap: Record<string, number> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const withoutComments = stripInlineComments(lines[i]);
    const trimmed = withoutComments.trim();
    if (trimmed === '') continue;

    // Capture label even if nothing follows after ':' (instruction validation is separate)
    const labelMatch = /^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i.exec(trimmed);
    if (labelMatch) {
      const label = labelMatch[1];
      labelMap[label] = i;
    }
  }

  return labelMap;
}

