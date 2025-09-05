import {
	type Registers,
	type Flags,
	getRegisterByte,
	setRegisterByte,
	computeFlagsFromByte
} from './types';

/**
 * ADDC r - Add register to Accumulator with Carry
 * Example: ADDC B (Adds register B and the Carry flag to A)
 * 
 * This instruction affects all flags (Z, S, CY).
 */
export function executeADDC(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags ,jumpTo?: number;} {
	// Normalize input: "ADDC B" or "addc b"
	const trimmed = instruction.trim();
	const match = /^addc\s+([abcdehl])$/i.exec(trimmed);
	if (!match) {
		return { registers, flags }; // Return unchanged if input is invalid
	}

	const reg = match[1].toUpperCase() as keyof Registers;

	// Use the provided helper functions to get numerical values
	const accValue = getRegisterByte(registers, 'A');
	const regValue = getRegisterByte(registers, reg);
	const carryValue = flags.carry; // This is already a number (0 or 1)

	// Perform the addition
	let result = accValue + regValue + carryValue;

	// Calculate the new Carry flag *before* truncating to 8 bits
	const newCarry = result > 0xFF ? 1 : 0;

	// Truncate to 8 bits
	result = result & 0xFF;

	// Use the helper function to update the accumulator register
	const nextRegisters = setRegisterByte(registers, 'A', result);

	// Compute flags based on the new accumulator value
	// We get the new tuple value for the accumulator to pass to computeFlagsFromByte
	const newAccTuple = nextRegisters.A;
	const nextFlags = computeFlagsFromByte(...newAccTuple);
	

	return { registers: nextRegisters, flags: nextFlags };
}
