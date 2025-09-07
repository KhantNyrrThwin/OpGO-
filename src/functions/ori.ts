import { type Registers, type Flags, computeFlagsFromByte } from './types';

/**
 * ORI (Logical OR Immediate) - bitwise OR between A and immediate data
 * Syntax: ORI data
 * Example: ORI 0FH ; A = A | 0FH
 */
export function executeORI(instruction: string, registers: Registers, flags: Flags) {
  const match = /^ori\s+([0-9a-f]{2})h$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const immediate = parseInt(match[1], 16);
  const aVal = parseInt(registers.A.join(""), 16);
  const result = (aVal | immediate) & 0xFF;

  const hex = result.toString(16).toUpperCase().padStart(2, "0");
  const nextRegs = { ...registers, A: [hex[0], hex[1]] as [string, string]};
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}