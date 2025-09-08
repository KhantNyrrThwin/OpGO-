/**
 * MOV (Move) Instruction Implementation for 8085 Microprocessor
 * 
 * This file implements the MOV instruction for the 8085 microprocessor:
 * 
 * MOV r1, r2 - Move from register to register
 * Example: MOV A, B (copies value from register B to register A)
 * 
 * MOV instruction does NOT affect the processor flags (Z, S, C).
 */

import {
  type Registers,
  type Flags,
  getRegisterByte,
  setRegisterByte
} from './types';

export const setMemoryByteAtHL = (
  registers: Registers,
  memory: number[],
  value: number
): number[] => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  const hlAddress = (h << 8) | l;

  const updatedMemory = [...memory];
  updatedMemory[hlAddress] = value;
  return updatedMemory;
};


export function executeMOV(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; memory: number[]; error?: string } {
  const trimmed = instruction.trim();

  const match = /^mov\s+([abcdehlm])\s*,\s*([abcdehlm])$/i.exec(trimmed);
  if (!match) {
    return {
      registers,
      flags,
      memory,
      error: `Invalid MOV format. Use: MOV r1, r2 (e.g., MOV A, B or MOV M, A)`
    };
  }

  const dest = match[1].toUpperCase();
  const src = match[2].toUpperCase();

  let updatedRegisters = { ...registers };
  let updatedMemory = [...memory];

  // Read source value
  let srcValue: number;
  if (src === 'M') {
    const h = parseInt(registers.H[0] + registers.H[1], 16);
    const l = parseInt(registers.L[0] + registers.L[1], 16);
    const hlAddress = (h << 8) | l;
    srcValue = memory[hlAddress] ?? 0x00;
  } else {
    srcValue = getRegisterByte(registers, src as keyof Registers);
  }

  // Write to destination
  if (dest === 'M') {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  const hlAddress = (h << 8) | l;
  console.log(`MOV M, ${src}: Writing ${srcValue.toString(16)} to memory[${hlAddress.toString(16)}]`);
  updatedMemory = setMemoryByteAtHL(registers, memory, srcValue);
  console.log(`Memory after:`, updatedMemory.slice(hlAddress - 1, hlAddress + 2));
}
 else {
    updatedRegisters = setRegisterByte(updatedRegisters, dest as keyof Registers, srcValue);
  }

  return { registers: updatedRegisters, flags, memory: updatedMemory };
}
