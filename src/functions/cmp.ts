/**
 * CMP (Compare) - Compare accumulator with register
 * Syntax: CMP register
 * Example: CMP B ; Compare accumulator with register B
 */

import { type Registers, type Flags, getRegisterByte, computeFlagsFromSubtraction } from './types';

export function executeCMP(instruction: string, registers: Registers, flags: Flags) {
  const match = /^cmp\s+([abcdehl])$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const reg = match[1].toUpperCase() as keyof Registers;
   const accValue = getRegisterByte(registers, 'A');
  const regVal = getRegisterByte(registers, reg);
  
  // Compare by subtracting (but don't store result)
  const nextFlags = computeFlagsFromSubtraction(accValue, regVal);

  return { registers, flags: nextFlags };
}