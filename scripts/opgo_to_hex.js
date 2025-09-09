#!/usr/bin/env node

/**
 * OpGo!! .opgo → Intel HEX converter (8085)
 *
 * - Reads JSON-based .opgo project: { projectName: string, sourceCode: string[] }
 * - Each line typically ends with a ';' terminator; we strip it during parsing
 * - Assembles a subset of 8085 assembly into machine code using a two-pass process
 * - Emits standard Intel HEX with configurable origin (default 0x0000)
 *
 * Usage:
 *   node scripts/opgo_to_hex.js -i ./program.opgo -o ./program.hex --org 0x0100
 *
 * Notes:
 * - Labels use the form: LABEL: on a line by itself or as a prefix: LABEL: INSTR ...
 * - Numbers: 12H (hex), 0x12 (hex), 18 (decimal). Addresses are little-endian where required
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { input: null, output: null, origin: 0x0000 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if ((a === '-i' || a === '--input') && argv[i + 1]) {
      args.input = argv[++i];
    } else if ((a === '-o' || a === '--output') && argv[i + 1]) {
      args.output = argv[++i];
    } else if (a === '--org' && argv[i + 1]) {
      args.origin = parseNumber(argv[++i]);
      if (Number.isNaN(args.origin) || args.origin < 0 || args.origin > 0xFFFF) {
        throw new Error('Invalid --org value. Must be 0..65535.');
      }
    } else if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    }
  }
  if (!args.input) throw new Error('Missing -i / --input path to .opgo file');
  if (!args.output) {
    const base = args.input.replace(/\.[^/.]+$/, '');
    args.output = `${base}.hex`;
  }
  return args;
}

function printHelp() {
  console.log(`OpGo!! 8085 Assembler to Intel HEX\n\n` +
    `Usage:\n` +
    `  node scripts/opgo_to_hex.js -i ./program.opgo -o ./program.hex --org 0x0100\n\n` +
    `Arguments:\n` +
    `  -i, --input   Path to .opgo JSON file\n` +
    `  -o, --output  Path to output .hex file (default: same name)\n` +
    `  --org         Origin address (default: 0x0000)\n`);
}

function parseNumber(text) {
  if (typeof text === 'number') return text;
  const s = String(text).trim().toUpperCase();
  if (/^0X[0-9A-F]+$/.test(s)) return parseInt(s.slice(2), 16);
  if (/^[0-9A-F]+H$/.test(s)) return parseInt(s.slice(0, -1), 16);
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  throw new Error(`Invalid numeric literal: ${text}`);
}

const REGISTER_CODES = { B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7 };
const REGISTER_PAIRS = { B: 0, D: 1, H: 2, SP: 3 };

function encodeImmediate8(value) {
  const v = value & 0xFF;
  return [v];
}

function encodeImmediate16(value) {
  const v = value & 0xFFFF;
  return [v & 0xFF, (v >> 8) & 0xFF]; // little-endian
}

function sizeOfInstruction(instr) {
  const { op, operands } = instr;
  switch (op) {
    case 'NOP':
    case 'HLT':
      return 1;
    case 'MOV':
    case 'ADD':
    case 'ADC':
    case 'SUB':
    case 'SBB':
    case 'ANA':
    case 'XRA':
    case 'ORA':
    case 'CMP':
    case 'INR':
    case 'DCR':
      return 1;
    case 'MVI':
    case 'ADI':
    case 'SUI':
    case 'ANI':
    case 'XRI':
    case 'ORI':
    case 'CPI':
      return 2;
    case 'LXI':
    case 'JMP':
    case 'JZ':
    case 'JNZ':
    case 'JC':
    case 'JNC':
    case 'JM':
    case 'JP':
    case 'LDA':
    case 'STA':
    case 'SHLD':
    case 'LHLD':
      return 3;
    case 'INX':
    case 'DCX':
      return 1;
    default:
      throw new Error(`Unsupported opcode for size: ${op}`);
  }
}

function encodeInstruction(instr, addr, labels) {
  const { op, operands } = instr;
  const O = (name) => (name || '').toUpperCase();
  const err = (m) => new Error(`${m} at address ${toHex16(addr)}`);

  switch (op) {
    case 'NOP': return [0x00];
    case 'HLT': return [0x76];

    case 'MOV': {
      // MOV r1, r2
      const [d, s] = operands.map(O);
      if (!(d in REGISTER_CODES) || !(s in REGISTER_CODES)) throw err('MOV expects registers');
      const code = 0x40 + (REGISTER_CODES[d] << 3) + REGISTER_CODES[s];
      return [code];
    }

    case 'MVI': {
      // MVI r, d8
      const [r, immStr] = operands;
      const R = O(r);
      if (!(R in REGISTER_CODES)) throw err('MVI expects register');
      const opcodes = [0x06, 0x0E, 0x16, 0x1E, 0x26, 0x2E, 0x36, 0x3E]; // B C D E H L M A
      const idx = REGISTER_CODES[R];
      const base = opcodes[idx];
      const imm = parseNumber(immStr);
      return [base, ...encodeImmediate8(imm)];
    }

    case 'ADD': {
      // ADD r
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('ADD expects register');
      return [0x80 + REGISTER_CODES[r]];
    }
    case 'ADC': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('ADC expects register');
      return [0x88 + REGISTER_CODES[r]];
    }
    case 'SUB': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('SUB expects register');
      return [0x90 + REGISTER_CODES[r]];
    }
    case 'SBB': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('SBB expects register');
      return [0x98 + REGISTER_CODES[r]];
    }
    case 'ANA': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('ANA expects register');
      return [0xA0 + REGISTER_CODES[r]];
    }
    case 'XRA': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('XRA expects register');
      return [0xA8 + REGISTER_CODES[r]];
    }
    case 'ORA': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('ORA expects register');
      return [0xB0 + REGISTER_CODES[r]];
    }
    case 'CMP': {
      const [r] = operands.map(O);
      if (!(r in REGISTER_CODES)) throw err('CMP expects register');
      return [0xB8 + REGISTER_CODES[r]];
    }

    case 'ADI': return [0xC6, ...encodeImmediate8(parseNumber(operands[0]))];
    case 'SUI': return [0xD6, ...encodeImmediate8(parseNumber(operands[0]))];
    case 'ANI': return [0xE6, ...encodeImmediate8(parseNumber(operands[0]))];
    case 'XRI': return [0xEE, ...encodeImmediate8(parseNumber(operands[0]))];
    case 'ORI': return [0xF6, ...encodeImmediate8(parseNumber(operands[0]))];
    case 'CPI': return [0xFE, ...encodeImmediate8(parseNumber(operands[0]))];

    case 'INR': {
      const [r] = operands.map(O);
      const table = { B: 0x04, C: 0x0C, D: 0x14, E: 0x1C, H: 0x24, L: 0x2C, M: 0x34, A: 0x3C };
      if (!(r in table)) throw err('INR expects register');
      return [table[r]];
    }
    case 'DCR': {
      const [r] = operands.map(O);
      const table = { B: 0x05, C: 0x0D, D: 0x15, E: 0x1D, H: 0x25, L: 0x2D, M: 0x35, A: 0x3D };
      if (!(r in table)) throw err('DCR expects register');
      return [table[r]];
    }
    case 'INX': {
      const [rp] = operands.map(O);
      if (!(rp in REGISTER_PAIRS)) throw err('INX expects register pair (B, D, H, SP)');
      return [0x03 + 0x10 * REGISTER_PAIRS[rp]];
    }
    case 'DCX': {
      const [rp] = operands.map(O);
      if (!(rp in REGISTER_PAIRS)) throw err('DCX expects register pair (B, D, H, SP)');
      return [0x0B + 0x10 * REGISTER_PAIRS[rp]];
    }
    case 'LXI': {
      const [rp, imm] = operands;
      const RP = O(rp);
      if (!(RP in REGISTER_PAIRS)) throw err('LXI expects register pair (B, D, H, SP)');
      const base = [0x01, 0x11, 0x21, 0x31][REGISTER_PAIRS[RP]];
      const val = resolveValue(imm, labels);
      return [base, ...encodeImmediate16(val)];
    }

    case 'LDA': {
      const addr = resolveValue(operands[0], labels);
      return [0x3A, ...encodeImmediate16(addr)];
    }
    case 'STA': {
      const addr = resolveValue(operands[0], labels);
      return [0x32, ...encodeImmediate16(addr)];
    }
    case 'LHLD': {
      const addr = resolveValue(operands[0], labels);
      return [0x2A, ...encodeImmediate16(addr)];
    }
    case 'SHLD': {
      const addr = resolveValue(operands[0], labels);
      return [0x22, ...encodeImmediate16(addr)];
    }

    case 'JMP': return [0xC3, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JNZ': return [0xC2, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JZ':  return [0xCA, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JNC': return [0xD2, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JC':  return [0xDA, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JP':  return [0xF2, ...encodeImmediate16(resolveValue(operands[0], labels))];
    case 'JM':  return [0xFA, ...encodeImmediate16(resolveValue(operands[0], labels))];

    default:
      throw err(`Unsupported opcode: ${op}`);
  }
}

function resolveValue(token, labels) {
  const t = String(token).trim();
  if (labels && t in labels) return labels[t];
  return parseNumber(t);
}

function toHex8(n) {
  return n.toString(16).toUpperCase().padStart(2, '0');
}
function toHex16(n) {
  return n.toString(16).toUpperCase().padStart(4, '0');
}

function checksum(bytes) {
  let sum = 0;
  for (const b of bytes) sum = (sum + b) & 0xFF;
  const cksum = ((~sum + 1) & 0xFF);
  return cksum;
}

function toIntelHex(dataBytes, origin = 0x0000, recordSize = 16) {
  const lines = [];
  let addr = origin & 0xFFFF;
  for (let i = 0; i < dataBytes.length; i += recordSize) {
    const chunk = dataBytes.slice(i, i + recordSize);
    const len = chunk.length & 0xFF;
    const hi = (addr >> 8) & 0xFF;
    const lo = addr & 0xFF;
    const type = 0x00;
    const raw = [len, hi, lo, type, ...chunk];
    const cks = checksum(raw);
    lines.push(':' + raw.map(toHex8).join('') + toHex8(cks));
    addr = (addr + chunk.length) & 0xFFFF;
  }
  // EOF record
  lines.push(':00000001FF');
  return lines.join('\n') + '\n';
}

function cleanLine(raw) {
  // Remove inline comments starting with //
  const withoutComment = raw.split('//')[0];
  // Remove trailing ; if present, and trim trailing spaces
  const noSemi = withoutComment.replace(/\s*;\s*$/, '');
  return noSemi.trim();
}

function parseInstruction(line) {
  // Handle optional leading label: LABEL: INSTR ...
  const labelMatch = /^(?<label>[A-Za-z_][A-Za-z0-9_]*):\s*(?<rest>.*)$/.exec(line);
  let label = null;
  let rest = line;
  if (labelMatch) {
    label = labelMatch.groups.label;
    rest = labelMatch.groups.rest.trim();
  }
  if (rest === '') return { label, instr: null };
  const parts = rest.split(/\s+/);
  const op = parts[0].toUpperCase();
  const opsStr = rest.slice(parts[0].length).trim();
  const operands = opsStr ? opsStr.split(',').map(s => s.trim()) : [];
  return { label, instr: { op, operands } };
}

function assemble(lines, origin = 0x0000) {
  // First pass: determine addresses for labels
  const labels = {};
  let pc = origin & 0xFFFF;
  const parsed = [];

  for (const raw of lines) {
    const line = cleanLine(raw);
    if (line === '') { parsed.push({ raw, label: null, instr: null, addr: pc }); continue; }
    const { label, instr } = parseInstruction(line);
    if (label) {
      if (label in labels) throw new Error(`Duplicate label: ${label}`);
      labels[label] = pc;
    }
    if (!instr) { parsed.push({ raw, label, instr: null, addr: pc }); continue; }
    const size = sizeOfInstruction(instr);
    parsed.push({ raw, label, instr, addr: pc });
    pc = (pc + size) & 0xFFFF;
  }

  // Second pass: encode bytes
  const bytes = [];
  for (const entry of parsed) {
    if (!entry.instr) continue;
    const chunk = encodeInstruction(entry.instr, entry.addr, labels);
    bytes.push(...chunk);
  }
  return { bytes, labels };
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const jsonText = fs.readFileSync(path.resolve(args.input), 'utf8');
    const data = JSON.parse(jsonText);
    if (!data || !Array.isArray(data.sourceCode)) {
      throw new Error('Invalid .opgo JSON: expected { sourceCode: string[] }');
    }
    const origin = typeof data.origin !== 'undefined' ? parseNumber(data.origin) : args.origin;
    const { bytes } = assemble(data.sourceCode, origin);
    const hexText = toIntelHex(bytes, origin, 16);
    fs.writeFileSync(path.resolve(args.output), hexText, 'utf8');
    console.log(`Wrote ${bytes.length} bytes to ${args.output} (origin=${toHex16(origin)})`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

