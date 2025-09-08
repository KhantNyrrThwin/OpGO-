/**
 * Shared types and utilities for 8085 Microprocessor functions
 */

export type Registers = {
	A: [string, string];
	B: [string, string];
	C: [string, string];
	D: [string, string];
	E: [string, string];
	H: [string, string];
	L: [string, string];
};

export type Flags = {
	zero: number;
	sign: number;
	carry: number;
};


// Helper function to convert number to hex nibble
export const toHexNibble = (value: number): string => {
	const clamped = Math.max(0, Math.min(15, value | 0));
	return clamped.toString(16).toUpperCase();
};

// Helper function to parse hex nibble
export const parseHexNibble = (n: string): number => {
	const v = parseInt(n, 16);
	if (Number.isNaN(v) || v < 0 || v > 15) return 0;
	return v;
};

// Helper function to compute flags from byte value
export const computeFlagsFromByte = (upper: string, lower: string): Flags => {
	const upperVal = parseHexNibble(upper);
	const lowerVal = parseHexNibble(lower);
	const byteVal = (upperVal << 4) | lowerVal;
	return {
		zero: byteVal === 0 ? 1 : 0,
		sign: (byteVal & 0x80) !== 0 ? 1 : 0,
		carry: 0,
	};
};

// Helper function to get register value as a byte
export const getRegisterByte = (registers: Registers, reg: keyof Registers): number => {
	const [upper, lower] = registers[reg];
	return (parseHexNibble(upper) << 4) | parseHexNibble(lower);
};

// Helper function to set register value from a byte
export const setRegisterByte = (registers: Registers, reg: keyof Registers, value: number): Registers => {
	const upper = toHexNibble((value >> 4) & 0x0F);
	const lower = toHexNibble(value & 0x0F);
	return { ...registers, [reg]: [upper, lower] };
};

// Helper function to get 16-bit register pair value
export const getRegisterPair = (registers: Registers, highReg: keyof Registers, lowReg: keyof Registers): number => {
	const highByte = getRegisterByte(registers, highReg);
	const lowByte = getRegisterByte(registers, lowReg);
	return (highByte << 8) | lowByte;
};

// Helper function to set 16-bit register pair value
export const setRegisterPair = (registers: Registers, highReg: keyof Registers, lowReg: keyof Registers, value: number): Registers => {
	const highByte = (value >> 8) & 0xFF;
	const lowByte = value & 0xFF;
	return setRegisterByte(setRegisterByte(registers, highReg, highByte), lowReg, lowByte);
};

// Initial register values
export function getInitialRegisters(): Registers {
	return {
		A: ["0", "0"],
		B: ["0", "0"],
		C: ["0", "0"],
		D: ["0", "0"],
		E: ["0", "0"],
		H: ["0", "0"],
		L: ["0", "0"],
	};
}

// Initial flag values
export function getInitialFlags(): Flags {
	return { zero: 0, sign: 0, carry: 0 };
}

// Helper function to compute flags from subtraction (for CMP instruction)
export function computeFlagsFromSubtraction(a: number, b: number): Flags {
  const result = (a - b) & 0xFF; // Get the 8-bit result
  const isZero = result === 0;
  const isNegative = (result & 0x80) !== 0;
  const hasCarry = a < b; // Carry flag is set if borrow is needed (unsigned comparison)

  return {
    zero: isZero ? 1 : 0,
    sign: isNegative ? 1 : 0,
    carry: hasCarry ? 1 : 0
  };
}
