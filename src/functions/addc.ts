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
 * ADDC r - Add register or memory to Accumulator with Carry
 * Example: ADDC B or ADDC M
 * 
 * This instruction affects all flags (Z, S, CY).
 */
export function executeADDC(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; jumpTo?: number } {
  const trimmed = instruction.trim();
  const match = /^addc\s+([abcdehlm])$/i.exec(trimmed);
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

  const carryValue = flags.carry;
  let result = accValue + operandValue + carryValue;

  const newCarry = result > 0xFF ? 1 : 0;
  result = result & 0xFF;

  const nextRegisters = setRegisterByte(registers, 'A', result);
  const newAccTuple = nextRegisters.A;
  const nextFlags = computeFlagsFromByte(...newAccTuple);
  nextFlags.carry = newCarry;

  return { registers: nextRegisters, flags: nextFlags };
}
