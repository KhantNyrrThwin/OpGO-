import {
  type Registers,
  type Flags,
  setRegisterByte,
  computeFlagsFromByte
} from './types';

/**
 * SUBBI data - Subtract immediate value and borrow from accumulator
 * Syntax: SUBBI 3AH
 * 
 * Affects all flags (Z, S, CY, etc.)
 */
export function executeSUBBI(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  const match = /^subbi\s+([0-9a-f]{1,2})h?$/i.exec(trimmed);
  if (!match) {
    console.warn('SUBBI failed to match:', instruction);
    return { registers, flags };
  }

  const immediateHex = match[1].toUpperCase().padStart(2, '0');
  const immediateValue = parseInt(immediateHex, 16);
  const borrowValue = flags.carry;
  const accValue = parseInt(registers.A.join(''), 16);

  let result = accValue - immediateValue - borrowValue;
  const newBorrow = result < 0 ? 1 : 0;
  result = result & 0xFF;

  const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
  const upper = resultHex[0];
  const lower = resultHex[1];

  const nextRegisters = { ...registers, A: [upper, lower] as [string, string] };
  const nextFlags = computeFlagsFromByte(upper, lower);
  nextFlags.carry = newBorrow;

  return { registers: nextRegisters, flags: nextFlags };
}
