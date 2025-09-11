import {
  type Registers,
  type Flags,
  setRegisterByte,
  computeFlagsFromByte
} from './types';

/**
 * ADDCI data - Add immediate value and carry to accumulator
 * Syntax: ADDCI 3AH
 * 
 * Affects all flags (Z, S, CY, etc.)
 */
export function executeADDCI(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  const match = /^addci\s+([0-9a-f]{1,2})h?$/i.exec(trimmed);
  if (!match) {
    console.warn('ADDCI failed to match:', instruction);
    return { registers, flags };
  }

  const immediateHex = match[1].toUpperCase().padStart(2, '0');
  const immediateValue = parseInt(immediateHex, 16);
  const carryValue = flags.carry;
  const accValue = parseInt(registers.A.join(''), 16);

  let result = accValue + immediateValue + carryValue;
  const newCarry = result > 0xFF ? 1 : 0;
  result = result & 0xFF;

  const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
  const nextRegisters = { ...registers, A: [resultHex[0], resultHex[1]] as [string, string] };
  const nextFlags = computeFlagsFromByte(resultHex[0], resultHex[1]);
  nextFlags.carry = newCarry;

  return { registers: nextRegisters, flags: nextFlags };
}
