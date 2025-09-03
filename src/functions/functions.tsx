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

const toHexNibble = (value: number): string => {
	const clamped = Math.max(0, Math.min(15, value | 0));
	return clamped.toString(16).toUpperCase();
};

const parseHexNibble = (n: string): number => {
	const v = parseInt(n, 16);
	if (Number.isNaN(v) || v < 0 || v > 15) return 0;
	return v;
};

const computeFlagsFromByte = (upper: string, lower: string): Flags => {
	const upperVal = parseHexNibble(upper);
	const lowerVal = parseHexNibble(lower);
	const byteVal = (upperVal << 4) | lowerVal;
	return {
		zero: byteVal === 0 ? 1 : 0,
		sign: (byteVal & 0x80) !== 0 ? 1 : 0,
		carry: 0,
	};
};

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

export function getInitialFlags(): Flags {
	return { zero: 0, sign: 0, carry: 0 };
}
