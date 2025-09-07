import {
	type Registers,
	type Flags,
	getRegisterByte,
	setRegisterByte,
	computeFlagsFromByte
} from './types';

/**
 * SUBB r - Subtract register from Accumulator with Borrow
 * Example: SUBB B (Subtracts register B and the Borrow flag from A)
 * 
 * This instruction affects all flags (zero, sign, carry).
 */
export function executeSUBB(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	// Normalize input: "SUBB B" or "subb b"
	const trimmed = instruction.trim();
	const match = /^subb\s+([abcdehl])$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const reg = match[1].toUpperCase() as keyof Registers;

	// Get numerical values
	const accValue = getRegisterByte(registers, 'A');
	const regValue = getRegisterByte(registers, reg);
	const borrowValue = flags.carry; // Previous borrow (0 or 1)

	// Perform the subtraction with borrow
	let result = accValue - regValue - borrowValue;

	// Calculate new Borrow
	const newBorrow = result < 0 ? 1 : 0;

	// Handle underflow
	result = result & 0xFF;

	// Update the accumulator
	const nextRegisters = setRegisterByte(registers, 'A', result);
	const newAccTuple = nextRegisters.A;

	// Compute flags
	const nextFlags = computeFlagsFromByte(...newAccTuple);
	nextFlags.carry = newBorrow; // Set new borrow flag

	return { registers: nextRegisters, flags: nextFlags };
}
