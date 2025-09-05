import { type Registers, type Flags, computeFlagsFromByte } from './types';

/**
 * XOR (Logical XOR) - bitwise XOR between A and a register
 * Syntax: XOR r
 * Example: XOR B ; A = A ^ B
 */
export function executeXOR(instruction: string, registers: Registers, flags: Flags) {
  const match = /^xor\s+([abcdehl])$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const reg = match[1].toUpperCase() as keyof Registers;
  const aVal = parseInt(registers.A.join(""), 16);
  const rVal = parseInt(registers[reg].join(""), 16);
  const result = (aVal ^ rVal) & 0xFF;

  const hex = result.toString(16).toUpperCase().padStart(2, "0");
  const nextRegs = { ...registers, A: [hex[0], hex[1]] as [string, string] };
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}