import {
  type Registers,
  type Flags,
  getRegisterByte,
  setRegisterByte,
  computeFlagsFromByte
} from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

/**
 * SUBB r - Subtract register or memory from Accumulator with Borrow
 * Example: SUBB B or SUBB M
 * 
 * This instruction affects all flags (Z, S, CY).
 */
export function executeSUBB(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  const match = /^subb\s+([abcdehlm])$/i.exec(trimmed);
  if (!match) {
    return { registers, flags };
  }

  const operand = match[1].toUpperCase();

  const accValue = getRegisterByte(registers, 'A');
  const borrowValue = flags.carry;

  let operandValue: number;
  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    operandValue = memory[hlAddress] ?? 0x00;
  } else {
    operandValue = getRegisterByte(registers, operand as keyof Registers);
  }

  let result = accValue - operandValue - borrowValue;
  const newBorrow = result < 0 ? 1 : 0;
  result = result & 0xFF;

  const nextRegisters = setRegisterByte(registers, 'A', result);
  const newAccTuple = nextRegisters.A;
  const nextFlags = computeFlagsFromByte(...newAccTuple);
  nextFlags.carry = newBorrow;

  return { registers: nextRegisters, flags: nextFlags };
}
