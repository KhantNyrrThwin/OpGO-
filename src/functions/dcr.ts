/**
 * DCR (Decrement Register) Instruction Implementation for 8085 Microprocessor
 * 
 * DCR r - Decrement the value of a register by 1
 * Example: DCR A (decrements the value in register A by 1)
 * 
 * This instruction affects the Zero and Sign flags based on the result.
 * It does not affect the Carry flag.
 */

import { type Registers, type Flags, getRegisterByte, setRegisterByte, computeFlagsFromByte } from './types';

export function executeDCR(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  
  // Match DCR instruction with register parameter
  const match = /^dcr\s+([abcdehl])$/i.exec(trimmed);
  if (!match) {
    console.warn('DCR failed to match:', instruction);
    return { registers, flags };
  }

  const reg = match[1].toUpperCase() as keyof Registers;
  
  // Get current register value
  const currentValue = getRegisterByte(registers, reg);
  
  // Decrement value (handle 8-bit underflow)
  const newValue = currentValue === 0 ? 255 : currentValue - 1;
  
  // Update register with new value
  const newRegisters = setRegisterByte(registers, reg, newValue);
  
  // Calculate new flags based on the result
  const newFlags = computeFlagsFromByte(
    ((newValue >> 4) & 0x0F).toString(16).toUpperCase(),
    (newValue & 0x0F).toString(16).toUpperCase()
  );
  
  // DCR does not affect the Carry flag, so preserve it
  newFlags.carry = flags.carry;
  
  return { registers: newRegisters, flags: newFlags };
}