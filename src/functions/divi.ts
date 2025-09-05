/**
 * DIVI (Divide Immediate) - divide A by an immediate 8-bit value
 * Syntax: DIVI data8
 * Example: DIVI 05H ; A = A / 05H
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

export function executeDIVI(instruction: string, registers: Registers, flags: Flags) {
  const match = /^divi\s+([0-9a-f]{2})h$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const divisor = parseInt(match[1], 16);
  if (divisor === 0) {
    // Division by zero → do nothing, set flags to zero+carry
    return { registers, flags: { ...flags, zero: 1, carry: 1 } };
  }

  const aVal = parseInt(registers.A.join(""), 16);
  const quotient = Math.floor(aVal / divisor) & 0xFF;

  const nextRegs = { ...registers, A: [quotient.toString(16).toUpperCase().padStart(2, "0")[0], quotient.toString(16).toUpperCase().padStart(2, "0")[1]] };
  const nextFlags = computeFlagsFromByte(nextRegs.A[0], nextRegs.A[1]);

  return { registers: nextRegs, flags: nextFlags };
}
