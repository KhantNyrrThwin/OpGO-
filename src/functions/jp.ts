/**

JP Instruction Implementation for 8085 Microprocessor

JP label - Jump to specified label only if Sign flag is 0 (positive)

Example: JP LOOP

This instruction does not modify registers or flags.

It returns the updated line index (if jump is taken), or undefined if not.
*/

import { type Registers, type Flags } from './types';

export function executeJP(
instruction: string,
registers: Registers,
flags: Flags,
labelMap: Record<string, number>
): { registers: Registers; flags: Flags; jumpTo?: number } {
const trimmed = instruction.trim();
console.log('Sign flag value:', flags.sign);

// Only proceed if Sign flag is 0 (positive)
if (flags.sign !== 0) {
return { registers, flags }; // No jump
}

const labelMatch = /^jp\s+([a-z_][a-z0-9_]*)$/i.exec(trimmed);
if (labelMatch) {
const label = labelMatch[1].toLowerCase();
const resolvedLine = labelMap[label];
if (resolvedLine !== undefined) {
return { registers, flags, jumpTo: resolvedLine };
}
}

console.warn('JP failed to match or resolve:', instruction);
return { registers, flags };
}