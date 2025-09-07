/**
 * MUL (Multiply Register) Instruction Implementation for 8085 Microprocessor
 * 
 * MUL reg - Multiply accumulator (A) by value in register (reg)
 * Example: MUL B (multiplies A by B)
 * 
 * This instruction affects the processor flags (Z, S, CY, AC, P) based on the result.
 */

import { type Registers, type Flags, getRegisterByte, computeFlagsFromByte } from './types';

// MUL reg - Multiply accumulator by register
export function executeMUL(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim();
    const match = /^mul\s+([abcdehl])$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const srcReg = match[1].toUpperCase() as keyof Registers;
    const srcValue = getRegisterByte(registers, srcReg);
    const accValue = getRegisterByte(registers, 'A');

    // Perform multiplication (A * reg)
    let result = accValue * srcValue;
    let carry = result > 0xFF ? 1 : 0;
    result = result & 0xFF; // Wrap around for 8-bit

    // Convert result to hex string, pad to 2 digits
    const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
    const upper = resultHex[0];
    const lower = resultHex[1];

    const newRegisters: Registers = { ...registers };
    newRegisters.A = [upper, lower];

    // Compute flags from result
    const newFlags = computeFlagsFromByte(upper, lower);
    // Set carry flag if overflow
    newFlags.carry = carry;

    return { registers: newRegisters, flags: newFlags };
}