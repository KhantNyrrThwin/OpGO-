/**
 * JMP Instruction Implementation for 8085 Microprocessor
 * 
 * JMP address - Unconditional jump to specified label or 16-bit address
 * Example: JMP LOOP or JMP 2050H
 * 
 * This instruction does not modify registers or flags.
 * It returns the updated line index (if jump is successful), or undefined if no jump occurs.
 */

import { type Registers, type Flags } from './types';

export function executeJMP(
  instruction: string,
  registers: Registers,
  flags: Flags,
  labelMap: Record<string, number>
): { registers: Registers; flags: Flags; jumpTo?: number } {
  const trimmed = instruction.trim();

  const labelMatch = /^jmp\s+([a-z_][a-z0-9_]*)$/i.exec(trimmed);
  if (labelMatch) {
    const label = labelMatch[1];
    const resolvedLine = labelMap[label];
    if (resolvedLine !== undefined) {
      return { registers, flags, jumpTo: resolvedLine };
    }
  }

  console.warn('JMP failed to match or resolve:', instruction);
  return { registers, flags };
}
