/**
 * STAX (Store Accumulator Indirect) Instruction Implementation for 8085 Microprocessor
 *
 * This file implements the STAX instruction:
 *
 * STAX rp - Store accumulator into memory pointed to by register pair
 *
 * Valid register pairs: B-C, D-E
 * Example: STAX D (stores accumulator value into memory at address in DE)
 *
 * STAX does NOT affect processor flags (Z, S, C).
 */

import {
  type Registers,
  type Flags,
  getRegisterByte
} from './types';

// Helper to compute address from register pair
const getAddressFromPair = (registers: Registers, pair: 'B' | 'D'): number => {
  const high = parseInt(registers[pair][0] + registers[pair][1], 16);
  const low = parseInt(registers[pair === 'B' ? 'C' : 'E'][0] + registers[pair === 'B' ? 'C' : 'E'][1], 16);
  return (high << 8) | low;
};

// STAX rp - Store accumulator into memory pointed to by register pair
export function executeSTAX(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; memory: number[]; error?: string } {
  const trimmed = instruction.trim();

  // Match pattern: STAX B or STAX D (case-insensitive)
  const match = /^stax\s+(b|d)$/i.exec(trimmed);
  if (!match) {
    return {
      registers,
      flags,
      memory,
      error: `Invalid STAX format. Use: STAX B or STAX D`
    };
  }

  const pair = match[1].toUpperCase() as 'B' | 'D';
  const address = getAddressFromPair(registers, pair);

  if (address > 0xFFFF) {
    return {
      registers,
      flags,
      memory,
      error: `Address ${address.toString(16).toUpperCase()}H is out of range.`
    };
  }

  const accValue = getRegisterByte(registers, 'A');
  const updatedMemory = [...memory];
  updatedMemory[address] = accValue;

  return { registers, flags, memory: updatedMemory };
}
