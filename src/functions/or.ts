/**
 * OR (Logical OR) - bitwise OR between A and a register
 * Syntax: OR r
 * Example: OR C ; A = A | C
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

export function executeOR(instruction: string, registers: Registers, flags: Flags) {
  const match = /^or\s+([abcdehl])$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const reg = match[1].toUpperCase() as keyof Registers;
  const aVal = parseInt(registers.A.join(""), 16);
  const rVal = parseInt(registers[reg].join(""), 16);
  const result = (aVal | rVal) & 0xFF;

  const hex = result.toString(16).toUpperCase().padStart(2, "0");
  const nextRegs = { ...registers, A: [hex[0], hex[1]] };
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}
