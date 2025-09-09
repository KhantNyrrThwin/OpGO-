import {
  type Registers,
  type Flags,
  computeFlagsFromByte
} from './types';

// Helper to compute HL address
const getHLAddress = (registers: Registers): number => {
  const h = parseInt(registers.H[0] + registers.H[1], 16);
  const l = parseInt(registers.L[0] + registers.L[1], 16);
  return (h << 8) | l;
};

// Executes MVI r, data where r ∈ {A,B,C,D,E,H,L,M} and data is 8-bit immediate
export function executeMVI(
  instruction: string,
  registers: Registers,
  flags: Flags,
  memory: number[]
): { registers: Registers; flags: Flags; memory: number[]; error?: string } {
  const trimmed = instruction.trim();
  const match = /^mvi\s+([abcdehlm])\s*,\s*([0-9a-f]{2})h$/i.exec(trimmed);

  if (!match) {
    return {
      registers,
      flags,
      memory,
      error: `Invalid MVI format. Use: MVI r, data (e.g., MVI A, 3FH or MVI M, 05H)`
    };
  }

  const dest = match[1].toUpperCase();
  const byte = match[2].toUpperCase();
  const upper = byte[0];
  const lower = byte[1];
  const value = parseInt(byte, 16);

  const nextFlags = computeFlagsFromByte(upper, lower);

  if (dest === 'M') {
    const hlAddress = getHLAddress(registers);
    const updatedMemory = [...memory];
    updatedMemory[hlAddress] = value;

    return {
      registers,
      flags: nextFlags,
      memory: updatedMemory
    };
  }

  const nextRegisters: Registers = { ...registers };
  nextRegisters[dest as keyof Registers] = [upper, lower];

  return {
    registers: nextRegisters,
    flags: nextFlags,
    memory
  };
}
