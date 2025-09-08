/**
 * MOV (Move) Instruction Implementation for 8085 Microprocessor
 * 
 * This file implements the MOV instruction for the 8085 microprocessor:
 * 
 * MOV r1, r2 - Move from register to register
 * Example: MOV A, B (copies value from register B to register A)
 * 
 * MOV instruction does NOT affect the processor flags (Z, S, C).
 */

import { type Registers, type Flags, getRegisterByte, setRegisterByte } from './types';

// MOV r1, r2 - Move from register to register
export function executeMOV(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
    const trimmed = instruction.trim();
    
    // Match pattern: MOV r1, r2 (case insensitive, with optional spaces)
    const match = /^mov\s+([abcdehl])\s*,\s*([abcdehl])$/i.exec(trimmed);
    
    if (!match) {
        return { registers, flags };
    }

    const destReg = match[1].toUpperCase() as keyof Registers;
    const srcReg = match[2].toUpperCase() as keyof Registers;

    // Get source register value
    const srcValue = getRegisterByte(registers, srcReg);
    
    // Set destination register value
    const newRegisters = setRegisterByte(registers, destReg, srcValue);

    // MOV doesn't affect flags
    return { registers: newRegisters, flags };
}