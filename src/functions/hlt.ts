/**
 * HLT (Halt) Instruction Implementation for 8085 Microprocessor
 * 
 * HLT - Halt the processor
 * Example: HLT (stops program execution)
 * 
 * This instruction stops the processor execution and does not modify registers or flags.
 * It returns a special flag indicating that the program should halt.
 */

import { type Registers, type Flags } from './types';

export function executeHLT(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags; halt?: boolean } {
  const trimmed = instruction.trim();
  
  // Match HLT instruction (case-insensitive)
  const match = /^hlt$/i.exec(trimmed);
  if (!match) {
    console.warn('HLT failed to match:', instruction);
    return { registers, flags };
  }

  // HLT instruction does not modify registers or flags
  // It only signals that the program should halt
  console.log('HLT instruction executed - Program halted');
  return { registers, flags, halt: true };
}
