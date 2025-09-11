import { type Registers, type Flags, getRegisterByte, computeFlagsFromByte } from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

/**
 * DIV reg - Divide accumulator (A) by value in register or memory
 * Example: DIV B (A = A / B)
 *          DIV M (A = A / memory[HL])
 * 
 * Affects flags: Z, S, CY, AC, P
 */
export function executeDIV(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; halt?: boolean; error?: string } {
  const trimmed = instruction.trim();
  const match = /^div\s+([abcdehlm])$/i.exec(trimmed);
  if (!match) {
    return { registers, flags };
  }

  const operand = match[1].toUpperCase();

  const accValue = getRegisterByte(registers, 'A');
  let divisor: number;

  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    divisor = memory[hlAddress] ?? 0x00;
  } else {
    divisor = getRegisterByte(registers, operand as keyof Registers);
  }

  if (divisor === 0) {
    const errorFlags = { ...flags, zero: 1, carry: 1 };
    return { registers, flags: errorFlags, halt: true, error: 'DIVIDE BY ZERO' };
  }

  const quotient = Math.floor(accValue / divisor);
  const remainder = accValue % divisor;
  const carry = remainder !== 0 ? 1 : 0;

  const result = quotient & 0xFF;
  const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
  const upper = resultHex[0];
  const lower = resultHex[1];

  const newRegisters: Registers = { ...registers, A: [upper, lower] };
  const newFlags = computeFlagsFromByte(upper, lower);
  newFlags.carry = carry;

  return { registers: newRegisters, flags: newFlags };
}
