import { type Registers, type Flags, getRegisterByte, computeFlagsFromSubtraction } from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

/**
 * CMP r - Compare accumulator with register or memory
 * Syntax: CMP r
 * Example: CMP B ; Compare A with B
 *          CMP M ; Compare A with memory[HL]
 */
export function executeCMP(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags } {
  const match = /^cmp\s+([abcdehlm])$/i.exec(instruction.trim());
  if (!match) return { registers, flags };

  const operand = match[1].toUpperCase();

  const accValue = getRegisterByte(registers, 'A');
  let compareValue: number;

  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    compareValue = memory[hlAddress] ?? 0x00;
  } else {
    compareValue = getRegisterByte(registers, operand as keyof Registers);
  }

  const nextFlags = computeFlagsFromSubtraction(accValue, compareValue);

  return { registers, flags: nextFlags };
}
