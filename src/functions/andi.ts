/**
 * ANDI (Logical AND Immediate) - bitwise AND between A and immediate 8-bit value
 * Syntax: ANDI data8
 * Example: ANDI 3FH ; A = A & 3FH
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

export function executeANDI(instruction: string, registers: Registers, flags: Flags) {
  const match = /^andi\s+([0-9a-f]{2})h$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const imm = parseInt(match[1], 16);
  const aVal = parseInt(registers.A.join(""), 16);
  const result = (aVal & imm) & 0xFF;

  const hex = result.toString(16).toUpperCase().padStart(2, "0");
  const nextRegs = { ...registers, A: [hex[0], hex[1]] };
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}
