import { type Registers, type Flags, computeFlagsFromByte } from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

/**
 * XOR r - Bitwise XOR between A and a register or memory
 * Syntax: XOR r
 * Example: XOR B ; A = A ^ B
 *          XOR M ; A = A ^ memory[HL]
 */
export function executeXOR(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags } {
  const match = /^xor\s+([abcdehlm])$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const operand = match[1].toUpperCase();

  const aVal = parseInt(registers.A.join(""), 16);
  let rVal: number;

  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    rVal = memory[hlAddress] ?? 0x00;
  } else {
    rVal = parseInt(registers[operand as keyof Registers].join(""), 16);
  }

  const result = (aVal ^ rVal) & 0xFF;
  const hex = result.toString(16).toUpperCase().padStart(2, "0");

  const nextRegs = { ...registers, A: [hex[0], hex[1]] as [string, string] };
  const nextFlags = computeFlagsFromByte(hex[0], hex[1]);

  return { registers: nextRegs, flags: nextFlags };
}
