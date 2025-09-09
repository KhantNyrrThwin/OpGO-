import { type Registers, type Flags } from './types';

/**
 * SETC - Set Carry Flag
 * Equivalent to STC in 8085
 * 
 * Syntax: SETC
 * Affects only the Carry flag (sets it to 1)
 */
export function executeSETC(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags } {
  const trimmed = instruction.trim();
  if (!/^setc$/i.test(trimmed)) {
    console.warn('SETC failed to match:', instruction);
    return { registers, flags };
  }

  const newFlags = { ...flags, carry: 1 };
  return { registers, flags: newFlags };
}
