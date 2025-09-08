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
 * INR r - Increment the value of a register or memory by 1
 * Example: INR A (increments register A)
 *          INR M (increments memory[HL])
 * 
 * Affects Zero and Sign flags. Does NOT affect Carry.
 */
export function executeINR(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; memory: number[] } {
  const trimmed = instruction.trim();
  const match = /^inr\s+([abcdehlm])$/i.exec(trimmed);
  if (!match) {
    console.warn('INR failed to match:', instruction);
    return { registers, flags, memory };
  }

  const operand = match[1].toUpperCase();

  let updatedRegisters = { ...registers };
  let updatedMemory = [...memory];
  let newValue: number;

  if (operand === 'M') {
    const hlAddress = getHLAddress(registers);
    const currentValue = memory[hlAddress] ?? 0x00;
    newValue = (currentValue + 1) % 256;
    updatedMemory[hlAddress] = newValue;
  } else {
    const currentValue = getRegisterByte(registers, operand as keyof Registers);
    newValue = (currentValue + 1) % 256;
    updatedRegisters = setRegisterByte(updatedRegisters, operand as keyof Registers, newValue);
  }

  const newFlags = computeFlagsFromByte(
    ((newValue >> 4) & 0x0F).toString(16).toUpperCase(),
    (newValue & 0x0F).toString(16).toUpperCase()
  );

  newFlags.carry = flags.carry; // Preserve carry

  return {
    registers: updatedRegisters,
    flags: newFlags,
    memory: updatedMemory
  };
}
