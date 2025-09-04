/**
 * JNC Instruction Implementation for 8085 Microprocessor
 * 
 * JNC label - Jump to specified label only if Carry flag is 0
 * Example: JNC LOOP
 * 
 * This instruction does not modify registers or flags.
 * It returns the updated line index (if jump is taken), or undefined if not.
 */

import { type Registers, type Flags } from './types';

export function executeJNC(
  instruction: string,
  registers: Registers,
  flags: Flags,
  labelMap: Record<string, number>
): { registers: Registers; flags: Flags; jumpTo?: number } {
  const trimmed = instruction.trim();
console.log('Carry flag value:', flags.carry);

  // Only proceed if Carry flag is 0
  if (flags.carry === 1) {
    return { registers, flags }; // No jump
  }

  const labelMatch = /^jnc\s+([a-z_][a-z0-9_]*)$/i.exec(trimmed);
  if (labelMatch) {
    const label = labelMatch[1].toLowerCase();
    const resolvedLine = labelMap[label];
    if (resolvedLine !== undefined) {
      return { registers, flags, jumpTo: resolvedLine };
    }
  }

  console.warn('JNC failed to match or resolve:', instruction);
  return { registers, flags };
}
