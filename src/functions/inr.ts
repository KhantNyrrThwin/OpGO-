/**
 * INR (Increment Register) Instruction Implementation for 8085 Microprocessor
 * 
 * INR r - Increment the value of a register by 1
 * Example: INR A (increments the value in register A by 1)
 * 
 * This instruction affects the Zero and Sign flags based on the result.
 * It does not affect the Carry flag.
 */

import { type Registers, type Flags, getRegisterByte, setRegisterByte, computeFlagsFromByte } from './types';

export function executeINR(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  
  // Match INR instruction with register parameter
  const match = /^inr\s+([abcdehl])$/i.exec(trimmed);
  if (!match) {
    console.warn('INR failed to match:', instruction);
    return { registers, flags };
  }

  const reg = match[1].toUpperCase() as keyof Registers;
  
  // Get current register value
  const currentValue = getRegisterByte(registers, reg);
  
  // Increment value (handle 8-bit overflow)
  const newValue = (currentValue + 1) % 256;
  
  // Update register with new value
  const newRegisters = setRegisterByte(registers, reg, newValue);
  
  // Calculate new flags based on the result
  const newFlags = computeFlagsFromByte(
    ((newValue >> 4) & 0x0F).toString(16).toUpperCase(),
    (newValue & 0x0F).toString(16).toUpperCase()
  );
  
  // INR does not affect the Carry flag, so preserve it
  newFlags.carry = flags.carry;
  
  return { registers: newRegisters, flags: newFlags };
}