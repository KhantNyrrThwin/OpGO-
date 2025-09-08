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
 * SUB r - Subtract register or memory from Accumulator
 * Example: SUB B or SUB M
 * 
 * For subtraction, the carry flag acts as a Borrow flag.
 * This instruction affects all flags (Z, S, CY).
 */
export function executeSUB(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  const match = /^sub\s+([abcdehlm])$/i.exec(trimmed);
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

  let result = accValue - operandValue;
  const newBorrow = result < 0 ? 1 : 0;
  result = result & 0xFF;

  const nextRegisters = setRegisterByte(registers, 'A', result);
  const newAccTuple = nextRegisters.A;
  const nextFlags = computeFlagsFromByte(...newAccTuple);
  nextFlags.carry = newBorrow;

  return { registers: nextRegisters, flags: nextFlags };
}
