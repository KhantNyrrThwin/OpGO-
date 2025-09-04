/**
 * MVI (Move Immediate) Instruction Implementation for 8085 Microprocessor
 * 
 * MVI r, data - Move immediate 8-bit data to register
 * Example: MVI A, 3F (loads immediate value 3F into register A)
 * 
 * This instruction affects the processor flags (Z, S) based on the loaded value.
 */

import { type Registers, type Flags, computeFlagsFromByte } from './types';

// Executes MVI r, data where r in {A,B,C,D,E,H,L} and data is 8-bit immediate (two hex nibbles)
export function executeMVI(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	// Normalize input like: "MVI A, 3F" or "mvi b,3f"
	const trimmed = instruction.trim();
	const match = /^mvi\s+([abcdehl])\s*,\s*([0-9a-f]{2})$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const reg = match[1].toUpperCase() as keyof Registers;
	const byte = match[2].toUpperCase();
	const upper = byte[0];
	const lower = byte[1];

	const nextRegisters: Registers = { ...registers };
	nextRegisters[reg] = [upper, lower];

	const nextFlags = computeFlagsFromByte(upper, lower);
	return { registers: nextRegisters, flags: nextFlags };
}
