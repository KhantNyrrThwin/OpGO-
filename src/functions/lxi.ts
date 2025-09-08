/**
 * LXI (Load Register Pair Immediate) Instruction Implementation for 8085 Microprocessor
 *
 * This file implements the LXI instruction:
 *
 * LXI reg-pair, address - Load 16-bit immediate address into register pair
 *
 * Valid register pairs: B-C, D-E, H-L
 * Example: LXI H, 2000H (loads 2000H into H and L registers)
 *
 * LXI does NOT affect processor flags (Z, S, C).
 */

import {
  type Registers,
  type Flags,
  setRegisterByte
} from './types';

// Helper function to parse hex string to number
const parseHex = (hexStr: string): number => {
  const cleanHex = hexStr.replace(/h$/i, '');
  const value = parseInt(cleanHex, 16);
  return Number.isNaN(value) ? 0 : value;
};

// LXI reg-pair, address
export function executeLXI(
  instruction: string,
  registers: Registers,
  flags: Flags
): { registers: Registers; flags: Flags; error?: string } {
  const trimmed = instruction.trim();

  // Strict format: LXI RP, XXXXH
  const match = /^lxi\s+(b|d|h),\s*([0-9a-f]{1,4})h$/i.exec(trimmed);
  if (!match) {
    return {
      registers,
      flags,
      error: `Invalid LXI format. Use: LXI reg-pair, address (e.g., LXI H, 2000H)`
    };
  }

  const regPair = match[1].toUpperCase(); // 'B', 'D', or 'H'
  const address = parseHex(match[2]);

  if (address > 0xFFFF) {
    return {
      registers,
      flags,
      error: `Address ${match[2]}H is out of range.`
    };
  }

  const highByte = (address >> 8) & 0xFF;
  const lowByte = address & 0xFF;

  let updated = { ...registers };

  switch (regPair) {
    case 'B':
      updated = setRegisterByte(updated, 'B', highByte);
      updated = setRegisterByte(updated, 'C', lowByte);
      break;
    case 'D':
      updated = setRegisterByte(updated, 'D', highByte);
      updated = setRegisterByte(updated, 'E', lowByte);
      break;
    case 'H':
      updated = setRegisterByte(updated, 'H', highByte);
      updated = setRegisterByte(updated, 'L', lowByte);
      break;
    default:
      return {
        registers,
        flags,
        error: `Unsupported register pair "${regPair}". Use B, D, or H.`
      };
  }

  // LXI does not affect flags
  return { registers: updated, flags };
}
