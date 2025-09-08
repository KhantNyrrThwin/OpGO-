/**
 * ADD (Add) Instruction Implementation for 8085 Microprocessor
 * 
 * This file implements two ADD instructions for the 8085 microprocessor:
 * 
 * 1. ADD r - Add register to accumulator
 *    Example: ADD B (adds value from register B to accumulator)
 * 
 * 2. ADD M - Add memory to accumulator (using HL as address)
 *    Example: ADD M (adds value from memory address in HL to accumulator)
 * 
 * Both ADD instructions affect the processor flags (Z, S, P, CY, AC).
 */

import { 
    type Registers, 
    type Flags, 
    getRegisterByte, 
    setRegisterByte, 
    getRegisterPair,
    computeFlagsFromByte 
} from './types';

/**
 * Updates flags after an addition operation
 */
function updateFlagsAfterAdd(flags: Flags, accumulator: number, operand: number, result: number): Flags {
    const resultByte = result & 0xFF;
    const [upper, lower] = [toHexNibble((resultByte >> 4) & 0x0F), toHexNibble(resultByte & 0x0F)];
    
    // Use the existing computeFlagsFromByte function
    const newFlags = computeFlagsFromByte(upper, lower);
    
    // Add carry flag calculation (not handled by computeFlagsFromByte)
    newFlags.carry = result > 0xFF ? 1 : 0;
    
    // Add auxiliary carry flag calculation
    const lowNibbleA = accumulator & 0x0F;
    const lowNibbleB = operand & 0x0F;
    newFlags.carry = (lowNibbleA + lowNibbleB) > 0x0F ? 1 : 0;
    
    return newFlags;
}

// Helper function to convert number to hex nibble
const toHexNibble = (value: number): string => {
    const clamped = Math.max(0, Math.min(15, value | 0));
    return clamped.toString(16).toUpperCase();
};

// ADD r - Add register to accumulator
export function executeADD_R(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim();
    const match = /^add\s+([abcdehl])$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const srcReg = match[1].toUpperCase() as keyof Registers;
    const srcValue = getRegisterByte(registers, srcReg);
    const accValue = getRegisterByte(registers, 'A');
    
    const result = accValue + srcValue;
    const newRegisters = setRegisterByte(registers, 'A', result & 0xFF);
    const newFlags = updateFlagsAfterAdd(flags, accValue, srcValue, result);

    return { registers: newRegisters, flags: newFlags };
}

// ADD M - Add memory to accumulator (using HL as address)
export function executeADD_M(instruction: string, registers: Registers, flags: Flags, memory: number[]): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim();
    const match = /^add\s+m$/i.exec(trimmed);
    if (!match) {
        return { registers, flags };
    }

    const hlAddress = getRegisterPair(registers, 'H', 'L');
    const memoryValue = memory[hlAddress] || 0x00;
    const accValue = getRegisterByte(registers, 'A');
    
    const result = accValue + memoryValue;
    const newRegisters = setRegisterByte(registers, 'A', result & 0xFF);
    const newFlags = updateFlagsAfterAdd(flags, accValue, memoryValue, result);

    return { registers: newRegisters, flags: newFlags };
}

// Main ADD function that determines which specific ADD operation to execute
export function executeADD(instruction: string, registers: Registers, flags: Flags, memory: number[] = []): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim().toUpperCase();
    
    // Check for different ADD patterns
    if (/^ADD\s+[ABCDEHL]$/.test(trimmed)) {
        return executeADD_R(instruction, registers, flags);
    } else if (/^ADD\s+M$/.test(trimmed)) {
        return executeADD_M(instruction, registers, flags, memory);
    }
    
    // If no pattern matches, return unchanged
    return { registers, flags };
}