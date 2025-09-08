/**
 * LDAX (Load Accumulator Indirect) Instruction Implementation for 8085 Microprocessor
 *
 * This file implements the LDAX instruction:
 *
 * LDAX rp - Load accumulator from memory pointed to by register pair
 *
 * Valid register pairs: B-C, D-E
 * Example: LDAX B (loads value from memory address in BC into accumulator)
 *
 * LDAX does NOT affect processor flags (Z, S, C).
 */

import {
  type Registers,
  type Flags,
  setRegisterByte
} from './types';

// Helper to compute address from register pair
const getAddressFromPair = (registers: Registers, pair: 'B' | 'D'): number => {
  const high = parseInt(registers[pair][0] + registers[pair][1], 16);
  const low = parseInt(registers[pair === 'B' ? 'C' : 'E'][0] + registers[pair === 'B' ? 'C' : 'E'][1], 16);
  return (high << 8) | low;
};

// LDAX rp - Load accumulator from memory pointed to by register pair
export function executeLDAX(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; memory: number[]; error?: string } {
  const trimmed = instruction.trim();

  // Match pattern: LDAX B or LDAX D (case-insensitive)
  const match = /^ldax\s+(b|d)$/i.exec(trimmed);
  if (!match) {
    return {
      registers,
      flags,
      memory,
      error: `Invalid LDAX format. Use: LDAX B or LDAX D`
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

  const value = memory[address] ?? 0x00;
  const updatedRegisters = setRegisterByte(registers, 'A', value);

  return { registers: updatedRegisters, flags, memory };
}
