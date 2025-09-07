import { type Registers, type Flags, computeFlagsFromByte } from './types';

/**
 * NOT (Logical NOT) - bitwise complement of A
 * Syntax: NOT
 * Example: NOT ; A = ~A
 */
export function executeNOT(instruction: string, registers: Registers, flags: Flags) {
  const match = /^not$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const aVal = parseInt(registers.A.join(""), 16);
  const result = (~aVal) & 0xFF; // Mask to 8 bits

  const hex = result.toString(16).toUpperCase().padStart(2, "0");
  const nextRegs = { ...registers, A: [hex[0], hex[1]] as [string, string] };
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}