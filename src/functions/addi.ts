import {
	type Registers,
	type Flags,
	getRegisterByte,
	setRegisterByte,
	computeFlagsFromByte,
	parseHexNibble // Need this to parse the immediate value
} from './types';

/**
 * ADDI data - Add immediate 8-bit data to Accumulator
 * Example: ADDI 3FH (Adds immediate value 3F to A)
 */
export function executeADDI(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	// Normalize input: "ADDI 05H" or "addi 3fh"
	const trimmed = instruction.trim();
	// This regex now captures the two hex digits for the immediate value
	const match = /^addi\s+([0-9a-f]{1,2})h?$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	// Parse the immediate value (e.g., "3F" -> 63)
	const hexValue = match[1].toUpperCase().padStart(2, '0');
	const immediateValue = (parseHexNibble(hexValue[0]) << 4) | parseHexNibble(hexValue[1]);

	const accValue = getRegisterByte(registers, 'A');
	let result = accValue + immediateValue;
	const newCarry = result > 0xFF ? 1 : 0;
	result = result & 0xFF;

	const nextRegisters = setRegisterByte(registers, 'A', result);
	const newAccTuple = nextRegisters.A;
	const nextFlags = computeFlagsFromByte(...newAccTuple);
	nextFlags.carry = newCarry;

	return { registers: nextRegisters, flags: nextFlags };
}
