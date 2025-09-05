import {
	type Registers,
	type Flags,
	getRegisterByte,
	setRegisterByte,
	computeFlagsFromByte
} from './types';

/**
 * SUB r - Subtract register from Accumulator
 * Example: SUB B (Subtracts register B from A)
 * 
 * For subtraction, the carry flag acts as a Borrow flag.
 * This instruction affects all flags (zero, sign, carry).
 */
export function executeSUB(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	// Normalize input: "SUB B" or "sub b"
	const trimmed = instruction.trim();
	const match = /^sub\s+([abcdehl])$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const reg = match[1].toUpperCase() as keyof Registers;

	// Get numerical values
	const accValue = getRegisterByte(registers, 'A');
	const regValue = getRegisterByte(registers, reg);

	// Perform the subtraction
	let result = accValue - regValue;

	// Calculate Borrow. If result is negative, we need to borrow (carry = 1).
	const newBorrow = result < 0 ? 1 : 0;

	// Handle underflow by converting to unsigned 8-bit (two's complement)
	result = result & 0xFF;

	// Update the accumulator
	const nextRegisters = setRegisterByte(registers, 'A', result);
	const newAccTuple = nextRegisters.A;

	// Compute flags
	const nextFlags = computeFlagsFromByte(...newAccTuple);
	nextFlags.carry = newBorrow; // Set borrow flag

	return { registers: nextRegisters, flags: nextFlags };
}
