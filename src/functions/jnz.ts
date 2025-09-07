/**
 * JNZ Instruction Implementation for 8085 Microprocessor
 * 
 * JNZ label - Jump to specified label only if Zero flag is 0
 * Example: JNZ LOOP
 * 
 * This instruction does not modify registers or flags.
 * It returns the updated line index (if jump is taken), or undefined if not.
 */

import { type Registers, type Flags } from './types';

export function executeJNZ(
  instruction: string,
  registers: Registers,
  flags: Flags,
  labelMap: Record<string, number>
): { registers: Registers; flags: Flags; jumpTo?: number } {
  const trimmed = instruction.trim();
console.log('Zero flag value:', flags.zero);

  // Only proceed if Zero flag is 0
  if (flags.zero === 1) {
    return { registers, flags }; // No jump
  }

  const labelMatch = /^jnz\s+([a-z_][a-z0-9_]*)$/i.exec(trimmed);
  if (labelMatch) {
    const label = labelMatch[1].toLowerCase();
    const resolvedLine = labelMap[label];
    if (resolvedLine !== undefined) {
      return { registers, flags, jumpTo: resolvedLine };
    }
  }

  console.warn('JNZ failed to match or resolve:', instruction);
  return { registers, flags };
}
