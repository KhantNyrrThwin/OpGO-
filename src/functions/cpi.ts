/**
 * CPI (Compare Immediate) - Compare accumulator with immediate 8-bit value
 * Syntax: CPI data8
 * Example: CPI 3FH ; Compare accumulator with 3FH
 */

import { type Registers, type Flags, getRegisterByte, computeFlagsFromSubtraction } from './types';

export function executeCPI(instruction: string, registers: Registers, flags: Flags) {
  const match = /^cpi\s+([0-9a-f]{2})h$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const imm = parseInt(match[1], 16);
  const accValue = getRegisterByte(registers, 'A');
  
  // Compare by subtracting immediate value (but don't store result)
  const nextFlags = computeFlagsFromSubtraction(accValue, imm);

  return { registers, flags: nextFlags };
}