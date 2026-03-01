
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

import { useFileContext } from '../contexts/FileContext';
import { parseLabels } from '../functions/parseLabels';

interface ValidationError {
  line: number;
  message: string;
  type: 'semicolon' | 'syntax' | 'invalid_instruction';
}

export default function InstructionInput() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [instructions, setInstructions] = useState("");
  const [highlightedLine, setHighlightedLine] = useState<number>(-1);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Suggestion state
  const [suggestion, setSuggestion] = useState<{ line: number, text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { setHasUnsavedChanges } = useFileContext();
  const labelMap = parseLabels(instructions);

  const lines = instructions.split('\n');

  // Available instructions for auto-suggest
  const instructionDocs = [
    { cmd: "MOV", desc: "A, B" },
    { cmd: "MVI", desc: "A, 05H" },
    { cmd: "LXI", desc: "H, 2000H" },
    { cmd: "LDA", desc: "2000H" },
    { cmd: "STA", desc: "2000H" },
    { cmd: "LHLD", desc: "2000H" },
    { cmd: "SHLD", desc: "2000H" },
    { cmd: "LDAX", desc: "B" },
    { cmd: "STAX", desc: "B" },
    { cmd: "XCHG", desc: "" },
    { cmd: "ADD", desc: "B" },
    { cmd: "ADI", desc: "05H" },
    { cmd: "ADDI", desc: "05H" },
    { cmd: "ADC", desc: "B" },
    { cmd: "ADDC", desc: "B" },
    { cmd: "ACI", desc: "05H" },
    { cmd: "ADDCI", desc: "05H" },
    { cmd: "SUB", desc: "B" },
    { cmd: "SUI", desc: "05H" },
    { cmd: "SUBI", desc: "05H" },
    { cmd: "SBB", desc: "B" },
    { cmd: "SUBB", desc: "B" },
    { cmd: "SBI", desc: "05H" },
    { cmd: "SUBBI", desc: "05H" },
    { cmd: "INR", desc: "A" },
    { cmd: "INX", desc: "H" },
    { cmd: "DCR", desc: "A" },
    { cmd: "DCX", desc: "H" },
    { cmd: "DAA", desc: "" },
    { cmd: "ANA", desc: "B" },
    { cmd: "AND", desc: "B" },
    { cmd: "ANI", desc: "05H" },
    { cmd: "ANDI", desc: "05H" },
    { cmd: "ORA", desc: "B" },
    { cmd: "OR", desc: "B" },
    { cmd: "ORI", desc: "05H" },
    { cmd: "XRA", desc: "B" },
    { cmd: "XOR", desc: "B" },
    { cmd: "XRI", desc: "05H" },
    { cmd: "XORI", desc: "05H" },
    { cmd: "CMA", desc: "" },
    { cmd: "NOT", desc: "" },
    { cmd: "CMP", desc: "B" },
    { cmd: "CPI", desc: "05H" },
    { cmd: "RLC", desc: "" },
    { cmd: "RRC", desc: "" },
    { cmd: "RAL", desc: "" },
    { cmd: "RAR", desc: "" },
    { cmd: "STC", desc: "" },
    { cmd: "SETC", desc: "" },
    { cmd: "CMC", desc: "" },
    { cmd: "JMP", desc: "LOOP" },
    { cmd: "JC", desc: "LOOP" },
    { cmd: "JNC", desc: "LOOP" },
    { cmd: "JZ", desc: "LOOP" },
    { cmd: "JNZ", desc: "LOOP" },
    { cmd: "JP", desc: "LOOP" },
    { cmd: "JM", desc: "LOOP" },
    { cmd: "JPE", desc: "LOOP" },
    { cmd: "JPO", desc: "LOOP" },
    { cmd: "CALL", desc: "SUBROUTINE" },
    { cmd: "RET", desc: "" },
    { cmd: "PUSH", desc: "B" },
    { cmd: "POP", desc: "B" },
    { cmd: "IN", desc: "00H" },
    { cmd: "OUT", desc: "00H" },
    { cmd: "EI", desc: "" },
    { cmd: "DI", desc: "" },
    { cmd: "HLT", desc: "" },
    { cmd: "NOP", desc: "" },
    { cmd: "MUL", desc: "B" },
    { cmd: "MULI", desc: "05H" },
    { cmd: "DIV", desc: "B" },
    { cmd: "DIVI", desc: "05H" },
    { cmd: "TEST", desc: "" }
  ];

  // Logic to find a suggestion based on current text formatting
  const calculateSuggestion = (text: string, selectionStart: number) => {
    // Find which line the cursor is on
    const linesToCursor = text.substring(0, selectionStart).split('\n');
    const currentLineIdx = linesToCursor.length - 1;
    const currentLineText = lines[currentLineIdx] || "";
    const textBeforeCursor = linesToCursor[currentLineIdx];

    // Only suggest if cursor is at the end of the line (or end of typed text in that line)
    // and there's no trailing semicolon yet (unless it's part of what we're suggesting)
    if (textBeforeCursor !== currentLineText || textBeforeCursor.trim() === "") {
      setSuggestion(null);
      return;
    }

    const trimmed = textBeforeCursor.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith(';')) {
      setSuggestion(null);
      return;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1 && parts[0].length > 0) {
      // Suggest command
      const cmdStart = parts[0].toUpperCase();
      const match = instructionDocs.find(doc => doc.cmd.startsWith(cmdStart));
      if (match) {
        // Build suggestion: complete the command, and if it has args, show them, and add a semicolon
        const remainingCmd = match.cmd.substring(cmdStart.length);
        const argHint = (match.desc ? ` ${match.desc}` : '') + ';';
        // If the command is exact match, suggest uppercase args, else suggest remainder + args
        const suggestionText = (cmdStart === match.cmd) ? argHint : (remainingCmd + argHint);
        if (suggestionText) {
          setSuggestion({ line: currentLineIdx, text: suggestionText });
          return;
        }
      }
    } else if (parts.length > 1) {
      // Suggest arguments if command matches exactly but arguments are incomplete
      const cmd = parts[0].toUpperCase();
      const match = instructionDocs.find(doc => doc.cmd === cmd);
      if (match && match.desc) {
        // e.g. "mvi a," -> suggest " data8"
        // This is a naive suggestion just appending what's likely missing based on commas or spaces
        const argTextPassed = textBeforeCursor.substring(textBeforeCursor.toUpperCase().indexOf(cmd) + cmd.length).trim();

        // Naive logic: if expected is "reg, data8" and we typed "a", suggest ", data8"
        // if we typed "a,", suggest " data8"

        // Count commas to know which arg we are on
        const passedCommas = (argTextPassed.match(/,/g) || []).length;
        const expectedCommas = (match.desc.match(/,/g) || []).length;

        if (passedCommas === 0 && expectedCommas === 1) {
          // We are typing the first arg
          if (argTextPassed.length > 0 && !argTextPassed.includes(',')) {
            setSuggestion({ line: currentLineIdx, text: `, ${match.desc.split(',')[1].trim()};` });
            return;
          }
        } else if (passedCommas === 1 && expectedCommas === 1) {
          // We typing second arg
          const afterComma = argTextPassed.split(',')[1]?.trim() || '';
          if (afterComma === '') {
            setSuggestion({ line: currentLineIdx, text: `${match.desc.split(',')[1].trim()};` });
            return;
          }
        } else if (passedCommas === 0 && expectedCommas === 0) {
          // No commas expected, just one argument (like JMP LOOP)
          if (argTextPassed.length > 0) {
            // We've typed part of the argument
            if (match.desc.startsWith(argTextPassed.toUpperCase())) {
              setSuggestion({ line: currentLineIdx, text: `${match.desc.substring(argTextPassed.length)};` });
              return;
            } else {
              setSuggestion({ line: currentLineIdx, text: ';' });
              return;
            }
          }
        }
      }
    }

    setSuggestion(null);
  };

  // Function to validate all errors (for run button)
  const validateAllErrors = (): ValidationError[] => {
    return validateInstructions(instructions, labelMap);
  };

  // Helper functions for error handling

  // Expose validation function to parent components
  useEffect(() => {
    const handleValidateAll = () => {
      const allErrors = validateAllErrors();
      setErrors(allErrors);
      window.dispatchEvent(new CustomEvent('onErrorsUpdated', { detail: allErrors }));
      console.log('Validation errors:', allErrors);
    };

    const handleExternalErrors = (event: CustomEvent) => {
      const incoming = event.detail as ValidationError[];
      setErrors(incoming);
      window.dispatchEvent(new CustomEvent('onErrorsUpdated', { detail: incoming }));
    };

    const handleClearErrors = () => {
      setErrors([]);
      window.dispatchEvent(new CustomEvent('onErrorsUpdated', { detail: [] }));
    };

    window.addEventListener('validateInstructions', handleValidateAll);
    window.addEventListener('externalErrors', handleExternalErrors as EventListener);
    window.addEventListener('clearErrors', handleClearErrors);
    return () => {
      window.removeEventListener('validateInstructions', handleValidateAll);
      window.removeEventListener('externalErrors', handleExternalErrors as EventListener);
      window.removeEventListener('clearErrors', handleClearErrors);
    };
  }, [instructions]);

  // Removed immediate semicolon validation; semicolons are validated on Run/Step

  // Full validation function for run button
  const validateInstructions = (text: string, labelMap: Record<string, number>): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    const instructionLines = text.split('\n');

    instructionLines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty and full-line comments
      if (trimmedLine === '' || trimmedLine.startsWith('//') || trimmedLine.startsWith(';')) return;

      // Remove inline '//' comment and treat anything after first ';' as comment
      const beforeSlash = line.split('//')[0];
      const semiIdxGlobal = beforeSlash.indexOf(';');
      const codeForChecks = (semiIdxGlobal >= 0 ? beforeSlash.slice(0, semiIdxGlobal + 1) : beforeSlash).trim();
      const codeForParse = (semiIdxGlobal >= 0 ? beforeSlash.slice(0, semiIdxGlobal + 1) : beforeSlash).trim();
      if (codeForParse === '') return;

      // Split label if present (using the part considered as code)
      const labelSplit = codeForParse.split(':');
      let instructionPart = codeForParse;

      if (labelSplit.length === 2) {
        const label = labelSplit[0].trim();
        const labelValid = /^[a-z_][a-z0-9_]*$/i.test(label);
        if (!labelValid) {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: Invalid label name "${label}"`,
            type: 'syntax'
          });
        }

        instructionPart = labelSplit[1].trim();
        if (instructionPart === '') {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: Label must be followed by an instruction`,
            type: 'syntax'
          });
          return;
        }
      } else if (labelSplit.length > 2) {
        validationErrors.push({
          line: index,
          message: `Line ${index + 1}: Multiple colons found. Only one label allowed per line.`,
          type: 'syntax'
        });
        return;
      }

      // Check for semicolon at end of the code part (before any comment)
      if (!codeForChecks.endsWith(';')) {
        validationErrors.push({
          line: index,
          message: `Line ${index + 1}: Instruction must end with semicolon (;)`,
          type: 'semicolon'
        });
      }


      // Check for valid instruction format
      const raw = instructionPart.replace(/;$/, '').trim();
      const opcode = raw.split(/\s+/)[0].toLowerCase();

      const jumpMnemonics = ['jmp', 'jnz', 'jz', 'jc', 'jnc', 'jp', 'jm'];

      const instruction = jumpMnemonics.includes(opcode)
        ? opcode + raw.slice(opcode.length) // lowercase only the mnemonic
        : raw.toLowerCase(); // lowercase entire instruction for others

      const validInstructions = ['mov', 'mvi', 'jmp', 'jnz', 'jz', 'jnc', 'subi', 'muli', 'mul', 'div', 'jp', 'jm', 'jc', 'inr', 'dcr', 'divi', 'and', 'andi', 'or', 'ori', 'xor', 'xori', 'not', 'addc', 'addi', 'sub', 'subb', 'hlt', 'cmp', 'cpi', 'add', 'lda', 'sta', 'inx', 'dcx', 'lxi', 'ldax', 'stax', 'setc', 'addci', 'subbi', 'test'];


      if (instruction.length > 0) {
        const instructionType = instruction.split(' ')[0];
        if (!validInstructions.includes(instructionType)) {
          validationErrors.push({
            line: index,

            message: `Line ${index + 1}: Invalid instruction "${instructionType}".`,
            type: 'invalid_instruction'
          });
        }
        // Should already have MOV validation (keep this as is):
        if (instructionType === 'mov') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 3) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV requires two registers (e.g., MOV A,D)`,
              type: 'syntax'
            });
          } else if (parts.length > 3) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV has too many operands`,
              type: 'syntax'
            });
          } else if (!/^[abcdehlm]$/i.test(parts[1].replace(',', '')) || !/^[abcdehlm]$/i.test(parts[2])) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV requires valid registers (A,B,C,D,E,H,L,M)`,
              type: 'syntax'
            });
          }
        }
        //BMM 
        // === ADD === (register to accumulator: ADD B)
        if (instructionType === 'add') {
          const addPattern = /^add\s+[abcdehlm]$/i;
          if (!addPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ADD requires a valid register (A,B,C,D,E,H,L) or M for memory`,
              type: 'syntax'
            });
          }
        }

        // === ADDCI === (add carry immediate)
        if (instructionType === 'addci') {
          const addciPattern = /^addci\s+[0-9a-f]{1,2}h?$/i;
          if (!addciPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ADDCI requires a valid 8-bit hexadecimal immediate value (e.g. ADDCI 3AH)`,
              type: 'syntax'
            });
          }
        }

        // === SUBBI === (subtract borrow immediate)
        if (instructionType === 'subbi') {
          const subbiPattern = /^subbi\s+[0-9a-f]{1,2}h?$/i;
          if (!subbiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: SUBBI requires a valid 8-bit hexadecimal immediate value (e.g. SUBBI 2FH)`,
              type: 'syntax'
            });
          }
        }

        // === SETC === (set carry)
        if (instructionType === 'setc') {
          const setcPattern = /^setc$/i;
          if (!setcPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: SETC does not take any arguments`,
              type: 'syntax'
            });
          }
        }


        // Add LDA validation (after the ADD validation):
        // === LDA === (load from memory address: LDA 2000H)
        // In validateInstructions function, enhance LDA/STA validation:
        if (instructionType === 'lda') {
          // Follow the same strict format used in src/functions/lda.ts: require an H suffix
          const ldaPattern = /^lda\s+([0-9a-f]{1,4})h$/i;
          const match = ldaPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: Invalid LDA instruction format. Use: LDA XXXXH`,
              type: 'syntax'
            });
          } else {
            // Validate that the parsed address fits in 16 bits
            const addr = parseInt(match[1], 16);
            if (Number.isNaN(addr) || addr > 0xffff) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: LDA address out of range (0000-FFFF)`,
                type: 'syntax'
              });
            }
          }
        }

        if (instructionType === 'sta') {
          // Follow the same strict format used in src/functions/sta.ts: require an H suffix
          const staPattern = /^sta\s+([0-9a-f]{1,4})h$/i;
          const match = staPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: Invalid STA instruction format. Use: STA XXXXH`,
              type: 'syntax'
            });
          } else {
            // Validate that the parsed address fits in 16 bits
            const addr = parseInt(match[1], 16);
            if (Number.isNaN(addr) || addr > 0xffff) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: STA address out of range (0000-FFFF)`,
                type: 'syntax'
              });
            }
          }
        }

        // === LDAX === (load accumulator from memory via register pair: LDAX B or LDAX D)
        if (instructionType === 'ldax') {
          const ldaxPattern = /^ldax\s+(b|d)$/i;
          if (!ldaxPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: LDAX requires a valid register pair (B or D)`,
              type: 'syntax'
            });
          }
        }

        // === STAX === (store accumulator into memory via register pair: STAX B or STAX D)
        if (instructionType === 'stax') {
          const staxPattern = /^stax\s+(b|d)$/i;
          if (!staxPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: STAX requires a valid register pair (B or D)`,
              type: 'syntax'
            });
          }
        }



        // === LXI === (load 16-bit address into register pair: LXI H, 2000H)
        if (instructionType === 'lxi') {
          const lxiPattern = /^lxi\s+(b|d|h),\s*[0-9a-f]{1,4}h$/i;
          if (!lxiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: LXI requires a valid register pair (B, D, H) and a 16-bit hex address (e.g., LXI H, 2000H)`,
              type: 'syntax'
            });
          }
        }

        // === MVI === (register + immediate hex: MVI A,05H)
        if (instructionType === 'mvi') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MVI requires a register and immediate value`,
              type: 'syntax'
            });
          } else if (parts.length === 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MVI requires an immediate value (e.g., MVI A,05H)`,
              type: 'syntax'
            });
          } else {
            const mviPattern = /^mvi\s+[abcdehlm]\s*,\s*[0-9a-f]{2}h$/i;
            if (!mviPattern.test(instruction)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: MVI requires a register and immediate hex (e.g., MVI A,05H)`,
                type: 'syntax'
              });
            }
          }
        }

        // === AND === (one register: AND A)
        if (instructionType === 'and') {
          // More flexible parsing for AND that handles cases with and without spaces
          const andPattern = /^and\s*[abcdehlm]$/i;
          if (!andPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: AND requires a valid register (A,B,C,D,E,H,L)`,
              type: 'syntax'
            });
          }
        }

        // === ANDI === (immediate hex: ANDI 0FH)
        if (instructionType === 'andi') {
          // More flexible parsing for ANDI that handles cases with and without spaces
          const andiPattern = /^andi\s*[0-9a-f]{2}h$/i;
          if (!andiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ANDI immediate must be two hex digits followed by 'H' (e.g., ANDI 0FH)`,
              type: 'syntax'
            });
          }
        }

        // === OR === (one register: OR A)
        if (instructionType === 'or') {
          // More flexible parsing for OR that handles cases with and without spaces
          const orPattern = /^or\s*[abcdehlm]$/i;
          if (!orPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: OR requires a valid register (A,B,C,D,E,H,L)`,
              type: 'syntax'
            });
          }
        }

        // === ORI === (immediate hex: ORI 0FH)
        if (instructionType === 'ori') {
          // More flexible parsing for ORI that handles cases with and without spaces
          const oriPattern = /^ori\s*[0-9a-f]{2}h$/i;
          if (!oriPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ORI immediate must be two hex digits followed by 'H' (e.g., ORI 0FH)`,
              type: 'syntax'
            });
          }
        }

        // === XOR === (one register: XOR A)
        if (instructionType === 'xor') {
          // More flexible parsing for XOR that handles cases with and without spaces
          const xorPattern = /^xor\s*[abcdehlm]$/i;
          if (!xorPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: XOR requires a valid register (A,B,C,D,E,H,L)`,
              type: 'syntax'
            });
          }
        }

        // === XORI === (immediate hex: XORI 0FH)
        if (instructionType === 'xori') {
          // More flexible parsing for XORI that handles cases with and without spaces
          const xoriPattern = /^xori\s*[0-9a-f]{2}h$/i;
          if (!xoriPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: XORI immediate must be two hex digits followed by 'H' (e.g., XORI 0FH)`,
              type: 'syntax'
            });
          }
        }

        // === TEST === (Raspberry Pi test: TEST)
        if (instructionType === 'test') {
          const testPattern = /^test$/i;
          if (!testPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: TEST takes no operands`,
              type: 'syntax'
            });
          }
        }

        // === NOT === (no operands: NOT)
        if (instructionType === 'not') {
          // More flexible parsing for NOT that handles cases with and without spaces
          const notPattern = /^not$/i;
          if (!notPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: NOT takes no operands`,
              type: 'syntax'
            });
          }
        }

        // === DIVI === (immediate hex: DIVI 05H)
        if (instructionType === 'divi') {
          // More flexible parsing for DIVI that handles cases with and without spaces
          const diviPattern = /^divi\s*[0-9a-f]{2}h$/i;
          if (!diviPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DIVI immediate must be two hex digits followed by 'H' (e.g., DIVI 05H)`,
              type: 'syntax'
            });
          }
        }

        // ===== JMP ====== (Unconditional Jump)
        if (instructionType === 'jmp') {
          const jmpPattern = /^jmp\s+([a-z_][a-z0-9_]*)$/i;
          const match = jmpPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JMP must be followed by a valid label (e.g., JMP LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        // ===== JNZ ====== (Jump if result not zero)
        if (instructionType === 'jnz') {
          const jnzPattern = /^jnz\s+([a-z_][a-z0-9_]*)$/i;
          const match = jnzPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JNZ must be followed by a valid label (e.g., JNZ LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        // ===== JZ ====== (Jump if result zero)
        if (instructionType === 'jz') {
          const jzPattern = /^jz\s+([a-z_][a-z0-9_]*)$/i;
          const match = jzPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JZ must be followed by a valid label (e.g., JZ LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        // ===== JNC ====== (Jump if no carry)
        if (instructionType === 'jnc') {
          const jncPattern = /^jnc\s+([a-z_][a-z0-9_]*)$/i;
          const match = jncPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JNC must be followed by a valid label (e.g., JNC LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        //Raven
        // === JP === (Jump if Positive)
        if (instructionType === 'jp') {
          const jpPattern = /^jp\s+([a-z_][a-z0-9_]*)$/i;
          const match = jpPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JP must be followed by a valid label (e.g., JP LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        // === JM === (Jump if Minus)
        if (instructionType === 'jm') {
          const jmPattern = /^jm\s+([a-z_][a-z0-9_]*)$/i;
          const match = jmPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JM must be followed by a valid label (e.g., JM LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        // Check MOV instruction format
        if (instructionType === 'mov') {
          const parts = instruction.split(' ');
          if (parts.length !== 3) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV instruction requires 2 operands (e.g., MOV A,B)`,
              type: 'syntax'
            });
          }
        }


        // === JC === (Jump if Carry)
        if (instructionType === 'jc') {
          const jcPattern = /^jc\s+([a-z_][a-z0-9_]*)$/i;
          const match = jcPattern.exec(instruction);
          if (!match) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: JC must be followed by a valid label (e.g., JC LOOP)`,
              type: 'syntax'
            });
          } else {
            const label = match[1];
            if (!(label in labelMap)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: Label "${label}" not found`,
                type: 'invalid_instruction'
              });
            }
          }
        }

        if (instructionType === 'subi') {
          const subiPattern = /^subi\s+[0-9a-f]{2}h$/i;
          if (!subiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: SUBI immediate must be two hex digits followed by 'H' (e.g., SUBI 05H)`,
              type: 'syntax'
            });
          }
        }
        if (instructionType === 'muli') {
          const muliPattern = /^muli\s+[0-9a-f]{2}h$/i;
          if (!muliPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MULI immediate must be two hex digits followed by 'H' (e.g., MULI 05H)`,
              type: 'syntax'
            });
          }
        }

        // === INR === (Increment Register)
        if (instructionType === 'inr') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: INR requires a register`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: INR has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating multiple operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: INR only takes one register (e.g., INR A)`,
                type: 'syntax'
              });
            } else {
              const inrPattern = /^inr\s+[abcdehlm]$/i;
              if (!inrPattern.test(instruction)) {
                validationErrors.push({
                  line: index,
                  message: `Line ${index + 1}: INR requires a valid register (A,B,C,D,E,H,L,M)`,
                  type: 'syntax'
                });
              }
            }
          }
        }

        // === DCR === (Decrement Register)
        if (instructionType === 'dcr') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DCR requires a register`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DCR has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating multiple operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: DCR only takes one register (e.g., DCR A)`,
                type: 'syntax'
              });
            } else {
              const dcrPattern = /^dcr\s+[abcdehlm]$/i;
              if (!dcrPattern.test(instruction)) {
                validationErrors.push({
                  line: index,
                  message: `Line ${index + 1}: DCR requires a valid register (A,B,C,D,E,H,L,M)`,
                  type: 'syntax'
                });
              }
            }
          }
        }

        // === INX === (Increment Register Pair)
        if (instructionType === 'inx') {
          const parts = instruction.split(/\s+/);
          if (parts.length !== 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: INX requires exactly one register-pair operand (B, D or H)`,
              type: 'syntax'
            });
          } else {
            const inxPattern = /^inx\s+[bdh]$/i;
            if (!inxPattern.test(instruction)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: INX requires a valid register pair (B, D or H) (e.g., INX H)`,
                type: 'syntax'
              });
            }
          }
        }

        // === DCX === (Decrement Register Pair)
        if (instructionType === 'dcx') {
          const parts = instruction.split(/\s+/);
          if (parts.length !== 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DCX requires exactly one register-pair operand (B, D or H)`,
              type: 'syntax'
            });
          } else {
            const dcxPattern = /^dcx\s+[bdh]$/i;
            if (!dcxPattern.test(instruction)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: DCX requires a valid register pair (B, D or H) (e.g., DCX H)`,
                type: 'syntax'
              });
            }
          }
        }

        // === CPI === (Compare Immediate)
        if (instructionType === 'cpi') {
          const cpiPattern = /^cpi\s+[0-9a-f]{2}h$/i;
          if (!cpiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: CPI immediate must be two hex digits followed by 'H' (e.g., CPI 05H)`,
              type: 'syntax'
            });
          }
        }

        // === CMP === (Compare Register)
        if (instructionType === 'cmp') {
          const cmpPattern = /^cmp\s+[abcdehlm]$/i;
          if (!cmpPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: CMP requires a valid register (A,B,C,D,E,H,L) (e.g., CMP B)`,
              type: 'syntax'
            });
          }
        }
        //Raven

        if (instructionType === 'mul') {
          // MUL reg (reg must be one of A, B, C, D, E, H, L)
          const mulPattern = /^mul\s+[abcdehlm]$/i;
          if (!mulPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MUL instruction must be in the form MUL reg (e.g., MUL B) where reg is A, B, C, D, E, H, L or M.`,
              type: 'syntax'
            });
          }
        }

        if (instructionType === 'div') {
          // DIV reg (reg must be one of A, B, C, D, E, H, L)
          const divPattern = /^div\s+[abcdehlm]$/i;
          if (!divPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DIV instruction must be in the form DIV reg (e.g., DIV B) where reg is A, B, C, D, E, H, L or M.`,
              type: 'syntax'
            });
          }
        }

        // === ADDC === (Add with Carry)
        if (instructionType === 'addc') {
          const addcPattern = /^addc\s+[abcdehlm]$/i;
          if (!addcPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ADDC requires one register operand (e.g., ADDC B)`,
              type: 'syntax'
            });
          }
        }

        // === ADDI === (Add Immediate)
        if (instructionType === 'addi') {
          const addiPattern = /^addi\s+[0-9a-f]{2}h$/i;
          if (!addiPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ADDI requires immediate value (two hex digits + H) (e.g., ADDI 3FH)`,
              type: 'syntax'
            });
          }
        }

        // === SUB === (Subtract)
        if (instructionType === 'sub') {
          const subPattern = /^sub\s+[abcdehlm]$/i;
          if (!subPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: SUB requires one register operand (e.g., SUB B)`,
              type: 'syntax'
            });
          }
        }

        // === SUBB === (Subtract with Borrow)
        if (instructionType === 'subb') {
          const subbPattern = /^subb\s+[abcdehlm]$/i;
          if (!subbPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: SUBB requires one register operand (e.g., SUBB B)`,
              type: 'syntax'
            });
          }
        }
      }

    });

    return validationErrors;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Generate HTML with pale-green comments. Full-line comments start with // or ;
  // Inline comments use // only to avoid conflict with required semicolon terminator.
  const getCommentHighlightedHtml = (text: string): string => {
    const commentClass = isDark ? 'text-green-300' : 'text-emerald-700';
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;');

    const linesLocal = text.split('\n');
    const htmlLines: string[] = [];
    for (let i = 0; i < linesLocal.length; i++) {
      const line = linesLocal[i];
      const trimmed = line.trimStart();

      // Determine if full-line comment (// or ;) after leading spaces
      const leadingSpacesCount = line.length - trimmed.length;
      const leadingSpaces = line.slice(0, leadingSpacesCount).replace(/ /g, '&nbsp;');

      if (trimmed.startsWith('//') || trimmed.startsWith('/')) {
        const commentHtml = `<span class=\"${commentClass}\">${escapeHtml(trimmed)}</span>`;
        htmlLines.push(`${leadingSpaces}${commentHtml}`);
        continue;
      }

      // Inline comment using // or anything after first ;
      const inlineSlashIdx = line.indexOf('//');
      const semiIdx = line.indexOf('/');
      const hasInlineSlash = inlineSlashIdx >= 0;
      const hasInlineSemi = semiIdx >= 0;

      if (hasInlineSlash || hasInlineSemi) {
        const splitIdx = Math.min(
          hasInlineSlash ? inlineSlashIdx : Number.POSITIVE_INFINITY,
          hasInlineSemi ? semiIdx : Number.POSITIVE_INFINITY
        );
        const codePart = line.slice(0, splitIdx);
        const commentPart = line.slice(splitIdx);
        let codeHtml = escapeHtml(codePart).replace(/ /g, '&nbsp;');

        // Add suggestion if applicable
        if (suggestion && i === suggestion.line) {
          codeHtml += `<span class="opacity-40">${escapeHtml(suggestion.text).replace(/ /g, '&nbsp;')}</span>`;
        }

        const commentHtml = `<span class=\"${commentClass}\">${escapeHtml(commentPart)}</span>`;
        htmlLines.push(leadingSpaces + codeHtml + commentHtml);
      } else {
        // No comment in this line
        let codeHtml = escapeHtml(trimmed).replace(/ /g, '&nbsp;');
        // Add suggestion if applicable
        if (suggestion && i === suggestion.line) {
          codeHtml += `<span class="opacity-40 italic pointer-events-none">${escapeHtml(suggestion.text).replace(/ /g, '&nbsp;')}</span>`;
        }
        htmlLines.push(leadingSpaces + codeHtml);
      }
    }
    return htmlLines.join('<br/>');
  };

  useEffect(() => {
    const handleFileOpened = (event: CustomEvent) => {
      setInstructions(event.detail);
      setHasUnsavedChanges(false);
    };

    const handleRequestContent = () => {
      window.dispatchEvent(new CustomEvent('getContent', { detail: instructions }));
    };

    const handleHighlightLine = (event: CustomEvent) => {
      const index = event.detail as number;
      setHighlightedLine(index);
      // Auto-scroll the textarea to make the line visible
      if (textareaRef.current && index >= 0) {
        const linesUpToIndex = instructions.split('\n').slice(0, index).join('\n');
        const approxCharIndex = linesUpToIndex.length + 1;
        // Move caret to target line start for scrollIntoView behavior
        textareaRef.current.selectionStart = approxCharIndex;
        textareaRef.current.selectionEnd = approxCharIndex;
        textareaRef.current.scrollTop = textareaRef.current.scrollTop + 0; // force layout
      }
    };

    window.addEventListener('fileOpened', handleFileOpened as EventListener);
    window.addEventListener('requestContent', handleRequestContent);
    window.addEventListener('highlightLine', handleHighlightLine as EventListener);

    return () => {
      window.removeEventListener('fileOpened', handleFileOpened as EventListener);
      window.removeEventListener('requestContent', handleRequestContent);
      window.removeEventListener('highlightLine', handleHighlightLine as EventListener);
    };
  }, [instructions, setHasUnsavedChanges]);

  useEffect(() => {
    const handleApplyQuickFix = (event: CustomEvent) => {
      const error = event.detail as ValidationError;
      if (error.type === 'semicolon') {
        setInstructions(prev => {
          const lines = prev.split('\n');
          if (lines[error.line] && !lines[error.line].trim().endsWith(';')) {
            lines[error.line] = lines[error.line].trim() + ';';
            return lines.join('\n');
          }
          return prev;
        });
        setHasUnsavedChanges(true);
      }
    };
    window.addEventListener('applyQuickFix', handleApplyQuickFix as EventListener);

    // highlight error line when clicked in error panel
    const handleHighlightErrorLine = (event: CustomEvent) => {
      const index = event.detail as number;
      if (textareaRef.current) {
        const linesUpToIndex = instructions.split('\n').slice(0, index).join('\n');
        const approxCharIndex = linesUpToIndex.length + 1;
        textareaRef.current.selectionStart = approxCharIndex;
        textareaRef.current.selectionEnd = approxCharIndex;
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('highlightErrorLine', handleHighlightErrorLine as EventListener);

    return () => {
      window.removeEventListener('applyQuickFix', handleApplyQuickFix as EventListener);
      window.removeEventListener('highlightErrorLine', handleHighlightErrorLine as EventListener);
    };
  }, [instructions, setHasUnsavedChanges]);

  // Sync overlay scroll with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Add // to the start of each selected line (or current line if none selected)
  const commentSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    const fullText = instructions;

    // Find start index of the first selected line
    const firstLineStart = fullText.lastIndexOf('\n', selectionStart - 1) + 1;
    // Find end index (exclusive) of the last selected line
    const lastLineBreakIdx = fullText.indexOf('\n', selectionEnd);
    const lastLineEnd = lastLineBreakIdx === -1 ? fullText.length : lastLineBreakIdx;

    const before = fullText.slice(0, firstLineStart);
    const target = fullText.slice(firstLineStart, lastLineEnd);
    const after = fullText.slice(lastLineEnd);

    const linesToComment = target.split('\n');

    const commentedLines = linesToComment.map((line) => {
      // Preserve leading spaces, then insert //
      const leadingSpacesMatch = line.match(/^\s*/);
      const leading = leadingSpacesMatch ? leadingSpacesMatch[0] : '';
      const rest = line.slice(leading.length);
      // If already a full-line comment starting with //, leave as is
      if (rest.startsWith('//')) return line;
      return `${leading}//${rest}`;
    });

    const updatedTarget = commentedLines.join('\n');
    const updatedText = before + updatedTarget + after;
    setInstructions(updatedText);
    setHasUnsavedChanges(true);

    // Adjust selection to cover the same logical region after inserting //
    // Each affected line (including possibly empty) got 2 extra chars before its content
    const affectedLinesCount = linesToComment.length;
    const selectionStartShift = 2; // caret is at start line; after "//" insertion
    const selectionEndShift = 2 * affectedLinesCount;

    // If there was no selection (caret within a single line), keep caret after the inserted //
    if (selectionStart === selectionEnd) {
      const newCaret = selectionStart + selectionStartShift;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCaret;
      }, 0);
    } else {
      // Expand selection by the number of inserted characters
      const newStart = selectionStart + selectionStartShift;
      const newEnd = selectionEnd + selectionEndShift;
      setTimeout(() => {
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab or Right Arrow to accept suggestion
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      const cursorLineIdx = suggestion.line;
      const linesArray = instructions.split('\n');
      linesArray[cursorLineIdx] = linesArray[cursorLineIdx] + suggestion.text;
      const newText = linesArray.join('\n');
      setInstructions(newText);
      setHasUnsavedChanges(true);
      setSuggestion(null);
      // Move cursor to end of suggestion
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = linesArray.slice(0, cursorLineIdx + 1).join('\n').length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 0);
      return;
    }

    // Ctrl+/ to comment selected lines
    if (e.ctrlKey && (e.key === '/' || e.key === '?')) {
      e.preventDefault();
      commentSelection();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const indent = '  ';
      const updatedValue =
        instructions.substring(0, start) + indent + instructions.substring(end);

      setInstructions(updatedValue);


      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  return (
    <div className={`h-full ${isDark ? 'bg-[#121212] text-white' : 'bg-neutral-100 text-neutral-900'} font-mono text-lg overflow-y-auto flex flex-col`}>
      <div className="flex flex-row flex-1">
        <div className={`${isDark ? 'bg-[#1f1f1f] text-gray-400' : 'bg-neutral-200 text-neutral-600'} px-2 py-2 text-right select-none flex-shrink-0`}>
          {lines.map((_, index) => {
            const isActive = index === highlightedLine;
            const lineError = errors.find(e => e.line === index);
            const errorType = lineError?.type;

            return (
              <div
                key={index}
                className={`leading-[3rem] relative ${isActive ? (isDark ? 'bg-blue-500 text-white font-bold shadow-lg border-2 border-blue-300' : 'bg-blue-100 text-blue-900 font-bold border-2 border-blue-300') : ''
                  }`}
              >
                {index + 1}
                {/* Error indicator dot */}
                {lineError && (
                  <div className={`absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${errorType === 'semicolon' ? 'bg-orange-400' :
                    errorType === 'syntax' ? 'bg-red-400' :
                      'bg-red-500'
                    }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-grow relative">
          {/* Syntax-highlight overlay for comments */}
          <div
            ref={overlayRef}
            className={`absolute inset-0 z-10 whitespace-pre-wrap break-words font-mono p-2 pointer-events-none overflow-hidden ${isDark ? 'text-white' : 'text-neutral-900'}`}
            style={{ lineHeight: '3rem' }}
            dangerouslySetInnerHTML={{ __html: getCommentHighlightedHtml(instructions) }}
          />
          <textarea
            ref={textareaRef}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            value={instructions}
            onChange={(e) => {
              const newInstructions = e.target.value;
              setInstructions(newInstructions);
              setHasUnsavedChanges(true);
              calculateSuggestion(newInstructions, e.target.selectionStart);
            }}
            onSelect={(e) => {
              // Re-calculate to clear if cursor moved
              if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) {
                setSuggestion(null);
              } else {
                calculateSuggestion(instructions, e.currentTarget.selectionStart);
              }
            }}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            placeholder="Type your instructions here."
            className="w-full h-full bg-transparent p-2 resize-none outline-none leading-[3rem] whitespace-pre relative z-20"
            style={{ lineHeight: '3rem', color: 'transparent', caretColor: isDark ? 'white' : 'black' }}
          />
          {/* Highlight overlay for current line */}
          {highlightedLine >= 0 && (
            <div
              className={`absolute left-2 right-2 z-0 ${isDark ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-200/40 border-blue-400'} border-l-4`}
              style={{
                top: `calc(${highlightedLine * 3}rem + 0.5rem)`,
                height: '3rem'
              }}
            />
          )}

          {/* Error line highlighting */}
          {errors.map((error, index) => {
            const lineError = errors.find(e => e.line === error.line);
            if (!lineError) return null;

            return (
              <div
                key={`error-${index}`}
                className={`absolute left-2 right-2 border-l-4 z-0 ${error.type === 'semicolon' ? (isDark ? 'bg-orange-500/10 border-orange-400' : 'bg-orange-100 border-orange-400') :
                  error.type === 'syntax' ? (isDark ? 'bg-red-500/10 border-red-400' : 'bg-red-100 border-red-400') :
                    (isDark ? 'bg-red-500/15 border-red-500' : 'bg-red-100 border-red-500')
                  }`}
                style={{
                  top: `calc(${error.line * 3}rem + 0.5rem)`,
                  height: '3rem'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}