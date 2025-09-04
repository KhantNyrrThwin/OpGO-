# 8085 Microprocessor Functions

This directory contains the separated function implementations for the 8085 microprocessor simulator.

## File Structure

### `types.ts`
- **Purpose**: Shared types and utility functions
- **Contents**:
  - `Registers` type definition
  - `Flags` type definition
  - Helper functions for hex conversion and register manipulation
  - Initial value functions (`getInitialRegisters`, `getInitialFlags`)

### `mvi.ts`
- **Purpose**: MVI (Move Immediate) instruction implementation
- **Contents**:
  - `executeMVI()` - Main MVI function
  - Handles: `MVI r, data` (8-bit immediate data to register)

### `mov.ts`
- **Purpose**: MOV (Move) instruction implementation
- **Contents**:
  - `executeMOV()` - Main MOV function dispatcher
  - `executeMOV_RR()` - Register to register transfers
  - `executeMOV_RM()` - Memory to register transfers
  - `executeMOV_MR()` - Register to memory transfers
  - `executeMOV_RD()` - Immediate data to register
  - `executeMOV_RP_D16()` - 16-bit immediate data to register pairs

### `functions.tsx` (Legacy)
- **Purpose**: Backward compatibility file
- **Contents**: Re-exports all functions from the separate files
- **Note**: This file is kept for backward compatibility but all actual implementations are in the separate files

## Usage

Import the specific functions you need:

```typescript
// Import specific functions
import { executeMVI } from '../functions/mvi';
import { executeMOV } from '../functions/mov';
import { type Registers, type Flags } from '../functions/types';

// Or import everything from the legacy file (backward compatibility)
import { executeMVI, executeMOV, type Registers, type Flags } from '../functions/functions';
```

## Instruction Support

### MVI Instructions
- `MVI A, 3F` - Load immediate value 3F into register A
- `MVI B, 2A` - Load immediate value 2A into register B
- And so on for all registers (A, B, C, D, E, H, L)

### MOV Instructions
- `MOV A, B` - Copy value from register B to register A
- `MOV A, M` - Load value from memory (address in HL) to register A
- `MOV M, A` - Store value from register A to memory (address in HL)
- `MOV A, 3F` - Load immediate value 3F into register A
- `MOV HL, 2000` - Load immediate value 2000 into HL register pair

All instructions are case-insensitive and support flexible spacing.
