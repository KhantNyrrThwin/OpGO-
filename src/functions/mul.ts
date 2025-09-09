import { type Registers, type Flags, getRegisterByte, computeFlagsFromByte } from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

/**
 * MUL reg - Multiply accumulator (A) by value in register or memory
 * Example: MUL B (A = A * B)
 *          MUL M (A = A * memory[HL])
 * 
 * Affects flags: Z, S, CY, AC, P
 */
export function executeMUL(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  const match = /^mul\s+([abcdehlm])$/i.exec(trimmed);
  if (!match) {
    return { registers, flags };
  }

  const operand = match[1].toUpperCase();

  const accValue = getRegisterByte(registers, 'A');
  let operandValue: number;

  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    operandValue = memory[hlAddress] ?? 0x00;
  } else {
    operandValue = getRegisterByte(registers, operand as keyof Registers);
  }

  let result = accValue * operandValue;
  const carry = result > 0xFF ? 1 : 0;
  result = result & 0xFF;

  const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
  const upper = resultHex[0];
  const lower = resultHex[1];

  const newRegisters: Registers = { ...registers, A: [upper, lower] };
  const newFlags = computeFlagsFromByte(upper, lower);
  newFlags.carry = carry;

  return { registers: newRegisters, flags: newFlags };
}
