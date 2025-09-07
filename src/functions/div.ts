/**
 * DIV (Divide Register) Instruction Implementation for 8085 Microprocessor
 * 
 * DIV reg - Divide accumulator (A) by value in register (reg)
 * Example: DIV B (divides A by B)
 * 
 * This instruction affects the processor flags (Z, S, CY, AC, P) based on the result.
 */

import { type Registers, type Flags, getRegisterByte, computeFlagsFromByte } from './types';

// DIV reg - Divide accumulator by register
export function executeDIV(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim();
    const match = /^div\s+([abcdehl])$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const srcReg = match[1].toUpperCase() as keyof Registers;
    const srcValue = getRegisterByte(registers, srcReg);
    const accValue = getRegisterByte(registers, 'A');

    // Prevent division by zero
    if (srcValue === 0) {
        // Set zero flag, optionally set carry or other error flags
        const newFlags = { ...flags, zero: 1, carry: 1 };
        return { registers, flags: newFlags };
    }

    // Perform division (A / reg)
    let result = Math.floor(accValue / srcValue);
    let carry = accValue % srcValue !== 0 ? 1 : 0; // Set carry if remainder exists

    result = result & 0xFF; // Ensure 8-bit result

    // Convert result to hex string, pad to 2 digits
    const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
    const upper = resultHex[0];
    const lower = resultHex[1];

    const newRegisters: Registers = { ...registers };
    newRegisters.A = [upper, lower];

    // Compute flags from result
    const newFlags = computeFlagsFromByte(upper, lower);
    newFlags.carry = carry;

    return { registers: newRegisters, flags: newFlags };
}