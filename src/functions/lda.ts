/**

 * LDA (Load Accumulator Direct) Instruction Implementation for 8085 Microprocessor

 * 

 * This file implements the LDA instruction for the 8085 microprocessor:

 * 

 * LDA addr - Load accumulator directly from memory address

 * Example: LDA 2000H (loads value from memory address 2000H to accumulator)

 * 

 * LDA instruction does NOT affect the processor flags (Z, S, C).

 */



import { 

    type Registers, 

    type Flags, 

    setRegisterByte 

} from './types';



// Helper function to parse hex string to number

const parseHex = (hexStr: string): number => {

    // Remove 'H' suffix if present and parse

    const cleanHex = hexStr.replace(/h$/i, '');

    const value = parseInt(cleanHex, 16);

    return Number.isNaN(value) ? 0 : value;

};



// LDA addr - Load accumulator directly from memory address

// lda.ts
// LDA addr - Load accumulator directly from memory address
export function executeLDA(instruction: string, registers: Registers, flags: Flags, memory: number[]): { registers: Registers; flags: Flags; error?: string } { // Add error return
    const trimmed = instruction.trim();
    
    // OLD REGEX (too lenient): /^lda\s+([0-9a-f]{1,4})h?$/i
    // NEW STRICT REGEX: 'H' suffix is now REQUIRED
    const match = /^lda\s+([0-9a-f]{1,4})h$/i.exec(trimmed);
    
    if (!match) {
        // If the instruction doesn't match the strict pattern, do not return an error string.
        // InstructionInput.tsx performs validation and will show user-facing messages.
        console.warn(`LDA: invalid format, input="${instruction}"`);
        return { registers, flags };
    }

    const address = parseHex(match[1]);
    // Optional: Check if address is within 16-bit range (0-65535)
    if (address > 0xFFFF) {
        // Out-of-range address — log for debugging. UI validation will report this to the user.
        console.warn(`LDA: address out of range: ${match[1]}H`);
        return { registers, flags };
    }

    const memoryValue = memory[address] || 0x00;
    
    const newRegisters = setRegisterByte(registers, 'A', memoryValue);

    // LDA doesn't affect flags
    return { registers: newRegisters, flags };
}