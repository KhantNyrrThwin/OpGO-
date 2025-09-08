/**
 * Parses labels from assembly-like source code.
 * Example: "LOOP:" on line 4 becomes { LOOP: 4 }
 */

export function parseLabels(content: string): Record<string, number> {
  const labelMap: Record<string, number> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip empty and full-line comments (// or ;)
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith(';')) continue;

    // Remove inline // comments before matching labels
    const codeOnly = trimmed.split('//')[0].trim();
    if (codeOnly === '') continue;

    const labelMatch = /^([a-z_][a-z0-9_]*)\s*:\s*(.+)$/i.exec(codeOnly);
    if (labelMatch) {
      const label = labelMatch[1];
      labelMap[label] = i;
    }
  }

  return labelMap;
}

