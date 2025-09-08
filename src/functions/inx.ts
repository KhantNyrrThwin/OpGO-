/**
 * INX (Increment Register Pair) Instruction Implementation for 8085 Microprocessor
 *
 * INX rp - Increment the 16-bit value of a register pair by 1
 * Example: INX H (increments the pair HL by 1)
 *
 * This instruction does not affect flags.
 */

import { type Registers, type Flags, getRegisterPair, setRegisterPair } from './types';

export function executeINX(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();

  // Match INX instruction with register pair parameter (B, D, H)
  const match = /^inx\s+([bdh])$/i.exec(trimmed);
  if (!match) {
    console.warn('INX failed to match:', instruction);
    return { registers, flags };
  }

  const reg = match[1].toUpperCase();

  // Determine high and low registers for the pair
  let high: keyof Registers;
  let low: keyof Registers;

  if (reg === 'B') {
    high = 'B';
    low = 'C';
  } else if (reg === 'D') {
    high = 'D';
    low = 'E';
  } else {
    // H -> HL pair
    high = 'H';
    low = 'L';
  }

  // Get current 16-bit value and increment (16-bit wrap)
  const currentValue = getRegisterPair(registers, high, low);
  const newValue = (currentValue + 1) & 0xffff;

  const newRegisters = setRegisterPair(registers, high, low, newValue);

  // INX does not modify flags
  return { registers: newRegisters, flags };
}

