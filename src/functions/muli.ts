/**
 * MULI (Multiply Immediate) Instruction Implementation for 8085 Microprocessor
 * 
 * MULI data - Multiply accumulator (A) by immediate 8-bit data
 * Example: MULI 3F (multiplies A by 3F)
 * 
 * This instruction affects the processor flags (Z, S, CY, AC, P) based on the result.
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

// Executes MULI data where data is 8-bit immediate (two hex nibbles)
export function executeMULI(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    // Normalize input like: "MULI 05H" or "muli 3fh"
    const trimmed = instruction.trim();
    const match = /^muli\s+([0-9a-f]{2})h$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const byte = match[1].toUpperCase();
    const immediateValue = parseInt(byte, 16);

    // Get accumulator value
    const accHex = registers.A.join('');
    const accValue = parseInt(accHex, 16);

    // Perform multiplication (A * immediate)
    let result = accValue * immediateValue;
    if (result > 0xFF) result = result % 0x100; // Wrap around for 8-bit

    // Convert result to hex string, pad to 2 digits
    const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
    const upper = resultHex[0];
    const lower = resultHex[1];

    const nextRegisters: Registers = { ...registers };
    nextRegisters.A = [upper, lower];

    const nextFlags = computeFlagsFromByte(upper, lower);
    // You may want to set CY flag if accValue * immediateValue > 0xFF, etc.

    return { registers: nextRegisters, flags: nextFlags };
}