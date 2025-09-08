/**

 * STA (Store Accumulator Direct) Instruction Implementation for 8085 Microprocessor

 * 

 * This file implements the STA instruction for the 8085 microprocessor:

 * 

 * STA addr - Store accumulator directly to memory address

 * Example: STA 2000H (stores value from accumulator to memory address 2000H)

 * 

 * STA instruction does NOT affect the processor flags (Z, S, C).

 */



import { 

    type Registers, 

    type Flags, 

    getRegisterByte 

} from './types';



// Helper function to parse hex string to number

const parseHex = (hexStr: string): number => {

    // Remove 'H' suffix if present and parse

    const cleanHex = hexStr.replace(/h$/i, '');

    const value = parseInt(cleanHex, 16);

    return Number.isNaN(value) ? 0 : value;

};



// STA addr - Store accumulator directly to memory address

// store.ts
// STA addr - Store accumulator directly to memory address
export function executeSTA(instruction: string, registers: Registers, flags: Flags, memory: number[]): { registers: Registers; flags: Flags; memory: number[]; error?: string } {
    const trimmed = instruction.trim();
    
    // OLD REGEX (too lenient): /^sta\s+([0-9a-f]{1,4})h?$/i
    // NEW STRICT REGEX: 'H' suffix is now REQUIRED
    const match = /^sta\s+([0-9a-f]{1,4})h$/i.exec(trimmed);
    
    if (!match) {
        return { registers, flags, memory, error: `Invalid STA instruction format. Use: STA XXXXH` };
    }

    const address = parseHex(match[1]);
    // Optional: Check if address is within 16-bit range (0-65535)
    if (address > 0xFFFF) {
        return { registers, flags, memory, error: `Address ${match[1]}H is out of range.` };
    }

    const accValue = getRegisterByte(registers, 'A');
    
    // Create a copy of memory array to avoid direct mutation
    const newMemory = [...memory];
    newMemory[address] = accValue;

    // STA doesn't affect flags
    return { registers, flags, memory: newMemory };
}