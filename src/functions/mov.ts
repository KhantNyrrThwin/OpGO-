/**
 * MOV (Move) Instruction Implementation for 8085 Microprocessor
 * 
 * This file implements various MOV (Move) instructions for the 8085 microprocessor:
 * 
 * 1. MOV r1, r2 - Move from register to register
 *    Example: MOV A, B (copies value from register B to register A)
 * 
 * 2. MOV r, M - Move from memory to register (using HL as address)
 *    Example: MOV A, M (loads value from memory address in HL to register A)
 * 
 * 3. MOV M, r - Move from register to memory (using HL as address)
 *    Example: MOV M, A (stores value from register A to memory address in HL)
 * 
 * 4. MOV r, data - Move immediate 8-bit data to register
 *    Example: MOV A, 3F (loads immediate value 3F into register A)
 * 
 * 5. MOV rp, data16 - Move immediate 16-bit data to register pair
 *    Example: MOV HL, 2000 (loads immediate value 2000 into HL register pair)
 * 
 * MOV instructions now affect the processor flags (Z, S) based on the moved value.
 */

import { type Registers, type Flags, getRegisterByte, setRegisterByte, setRegisterPair, computeFlagsFromByte } from './types';

// MOV r1, r2 - Move from register to register
export function executeMOV_RR(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	const match = /^mov\s+([abcdehl])\s*,\s*([abcdehl])$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const destReg = match[1].toUpperCase() as keyof Registers;
	const srcReg = match[2].toUpperCase() as keyof Registers;

	const srcValue = getRegisterByte(registers, srcReg);
	const newRegisters = setRegisterByte(registers, destReg, srcValue);

	// Set flags based on the moved value (zero flag when value is 00)
	const newFlags = computeFlagsFromByte(
		((srcValue >> 4) & 0x0F).toString(16).toUpperCase(),
		(srcValue & 0x0F).toString(16).toUpperCase()
	);
	return { registers: newRegisters, flags: newFlags };
}

// MOV r, M - Move from memory to register (using HL as address)
export function executeMOV_RM(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	const match = /^mov\s+([abcdehl])\s*,\s*m$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const destReg = match[1].toUpperCase() as keyof Registers;
	
	// For now, we'll simulate memory access with a default value
	// In a real implementation, this would access memory at the address in HL register pair
	const memoryValue = 0x00; // Default memory value
	
	const newRegisters = setRegisterByte(registers, destReg, memoryValue);

	// Set flags based on the loaded value (zero flag when value is 00)
	const newFlags = computeFlagsFromByte(
		((memoryValue >> 4) & 0x0F).toString(16).toUpperCase(),
		(memoryValue & 0x0F).toString(16).toUpperCase()
	);
	return { registers: newRegisters, flags: newFlags };
}

// MOV M, r - Move from register to memory (using HL as address)
export function executeMOV_MR(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	const match = /^mov\s+m\s*,\s*([abcdehl])$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	// For now, we'll just return the registers unchanged since we're not implementing actual memory
	// In a real implementation, this would store the value from the source register to memory at the address in HL register pair

	// MOV doesn't affect flags
	return { registers, flags };
}

// MOV r, data - Move immediate data to register
export function executeMOV_RD(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	const match = /^mov\s+([abcdehl])\s*,\s*([0-9a-f]{2})$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const destReg = match[1].toUpperCase() as keyof Registers;
	const data = match[2].toUpperCase();
	const upper = data[0];
	const lower = data[1];

	const newRegisters: Registers = { ...registers };
	newRegisters[destReg] = [upper, lower];

	// Set flags based on the immediate data (zero flag when data is 00)
	const newFlags = computeFlagsFromByte(upper, lower);
	return { registers: newRegisters, flags: newFlags };
}

// MOV rp, data16 - Move 16-bit immediate data to register pair
export function executeMOV_RP_D16(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	const match = /^mov\s+(bc|de|hl|sp)\s*,\s*([0-9a-f]{4})$/i.exec(trimmed);
	if (!match) {
		return { registers, flags };
	}

	const regPair = match[1].toUpperCase();
	const data = match[2].toUpperCase();
	const highByte = parseInt(data.substring(0, 2), 16);
	const lowByte = parseInt(data.substring(2, 4), 16);

	let newRegisters = { ...registers };

	switch (regPair) {
		case 'BC':
			newRegisters = setRegisterPair(registers, 'B', 'C', (highByte << 8) | lowByte);
			break;
		case 'DE':
			newRegisters = setRegisterPair(registers, 'D', 'E', (highByte << 8) | lowByte);
			break;
		case 'HL':
			newRegisters = setRegisterPair(registers, 'H', 'L', (highByte << 8) | lowByte);
			break;
		case 'SP':
			// SP is not implemented in our register structure, so we'll skip it
			break;
	}

	// Set flags based on the 16-bit value (zero flag when value is 0000)
	const isZero = (highByte === 0 && lowByte === 0);
	const newFlags = {
		zero: isZero ? 1 : 0,
		sign: (highByte & 0x80) !== 0 ? 1 : 0, // Sign based on high byte
		carry: 0,
	};
	return { registers: newRegisters, flags: newFlags };
}

// Main MOV function that determines which specific MOV operation to execute
export function executeMOV(instruction: string, registers: Registers, flags: Flags): { registers: Registers; flags: Flags } {
	const trimmed = instruction.trim();
	
	// Check for different MOV patterns
	if (/^mov\s+[abcdehl]\s*,\s*[abcdehl]$/i.test(trimmed)) {
		return executeMOV_RR(instruction, registers, flags);
	} else if (/^mov\s+[abcdehl]\s*,\s*m$/i.test(trimmed)) {
		return executeMOV_RM(instruction, registers, flags);
	} else if (/^mov\s+m\s*,\s*[abcdehl]$/i.test(trimmed)) {
		return executeMOV_MR(instruction, registers, flags);
	} else if (/^mov\s+[abcdehl]\s*,\s*[0-9a-f]{2}$/i.test(trimmed)) {
		return executeMOV_RD(instruction, registers, flags);
	} else if (/^mov\s+(bc|de|hl|sp)\s*,\s*[0-9a-f]{4}$/i.test(trimmed)) {
		return executeMOV_RP_D16(instruction, registers, flags);
	}
	
	// If no pattern matches, return unchanged
	return { registers, flags };
}
