/**
 * Parses labels from assembly-like source code.
 * Example: "LOOP:" on line 4 becomes { LOOP: 4 }
 */

export function parseLabels(content: string): Record<string, number> {
  const labelMap: Record<string, number> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();    // Skip empty and full-line comments (// or ;)
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/')) continue;

      // Remove inline comments (//) and anything after first ';'
      const beforeSlash = raw.split('//')[0];
      const semiIdx = beforeSlash.indexOf(';');
      const codeOnly = (semiIdx >= 0 ? beforeSlash.slice(0, semiIdx) : beforeSlash).trim();
    if (codeOnly === '') continue;

    const labelMatch = /^([a-z_][a-z0-9_]*)\s*:\s*(.+)$/i.exec(codeOnly);
    if (labelMatch) {
      const label = labelMatch[1];
      labelMap[label] = i;
    }
  }

  return labelMap;
}

