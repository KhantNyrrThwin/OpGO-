/**
 * SUBI (Subtract Immediate) Instruction Implementation for 8085 Microprocessor
 * 
 * SUBI data - Subtract immediate 8-bit data from accumulator (A)
 * Example: SUBI 3F (subtracts 3F from register A)
 * 
 * This instruction affects the processor flags (Z, S, CY, AC, P) based on the result.
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

// Executes SUBI data where data is 8-bit immediate (two hex nibbles)
export function executeSUBI(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    // Normalize input like: "SUBI 05H" or "subi 3fh"
    const trimmed = instruction.trim();
    const match = /^subi\s+([0-9a-f]{1,2})h?$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const byte = match[1].toUpperCase().padStart(2, '0');
    const immediateValue = parseInt(byte, 16);

    // Get accumulator value
    const accHex = registers.A.join('');
    const accValue = parseInt(accHex, 16);

    console.log(`SUBI: Accumulator before = ${accHex} (${accValue}), Immediate = ${byte} (${immediateValue})`);

    // Perform subtraction (A - immediate)
    let result = accValue - immediateValue;
    if (result < 0) result += 0x100; // Wrap around for 8-bit

    console.log(`SUBI: Accumulator after = ${result.toString(16).toUpperCase().padStart(2, '0')} (${result})`);

    // Convert result to hex string, pad to 2 digits
    const resultHex = result.toString(16).toUpperCase().padStart(2, '0');
    const upper = resultHex[0];
    const lower = resultHex[1];

    const nextRegisters: Registers = { ...registers };
    nextRegisters.A = [upper, lower];

    const nextFlags = computeFlagsFromByte(upper, lower);
    console.log(`SUBI: Flags after = Z:${nextFlags.zero}, S:${nextFlags.sign}, C:${nextFlags.carry}`);
    
    // Set carry flag if borrow occurred (accValue < immediateValue)
    if (accValue < immediateValue) {
        nextFlags.carry = 1;
    }

    return { registers: nextRegisters, flags: nextFlags };
}