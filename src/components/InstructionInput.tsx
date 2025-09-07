
import { useState, useEffect, useRef } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { useFileContext } from '../contexts/FileContext';
import { parseLabels } from '../functions/parseLabels';

interface ValidationError {
  line: number;
  message: string;
  type: 'semicolon' | 'syntax' | 'invalid_instruction';
}

export default function InstructionInput() {
  const [instructions, setInstructions] = useState("");
  const [highlightedLine, setHighlightedLine] = useState<number>(-1);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isErrorPanelExpanded, setIsErrorPanelExpanded] = useState(false);
  const [selectedError, setSelectedError] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setHasUnsavedChanges } = useFileContext();
  const labelMap = parseLabels(instructions);

  const lines = instructions.split('\n');

  // Function to validate all errors (for run button)
  const validateAllErrors = (): ValidationError[] => {
    return validateInstructions(instructions, labelMap);
  };

  // Helper functions for error handling
  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'semicolon': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'syntax': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'invalid_instruction': return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'semicolon': return 'border-orange-400 bg-orange-900/20';
      case 'syntax': return 'border-red-400 bg-red-900/20';
      case 'invalid_instruction': return 'border-red-500 bg-red-900/30';
      default: return 'border-blue-400 bg-blue-900/20';
    }
  };

  const getErrorPriority = (type: string) => {
    switch (type) {
      case 'semicolon': return 1; // High priority
      case 'syntax': return 2;    // Medium priority
      case 'invalid_instruction': return 3; // Low priority
      default: return 4;
    }
  };

  const getQuickFix = (error: ValidationError) => {
    if (error.type === 'semicolon') {
      return 'Add semicolon (;) at the end';
    }
    return null;
  };

  const applyQuickFix = (error: ValidationError) => {
    if (error.type === 'semicolon') {
      const lines = instructions.split('\n');
      if (lines[error.line] && !lines[error.line].trim().endsWith(';')) {
        lines[error.line] = lines[error.line].trim() + ';';
        setInstructions(lines.join('\n'));
        setHasUnsavedChanges(true);
      }
    }
  };

  // Sort errors by priority
  const sortedErrors = [...errors].sort((a, b) => getErrorPriority(a.type) - getErrorPriority(b.type));

  // Expose validation function to parent components
  useEffect(() => {
    const handleValidateAll = () => {
      const allErrors = validateAllErrors();
      setErrors(allErrors);
      console.log('Validation errors:', allErrors);
    };

    const handleExternalErrors = (event: CustomEvent) => {
      const incoming = event.detail as ValidationError[];
      setErrors(incoming);
    };

    const handleClearErrors = () => {
      setErrors([]);
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
      
      // Skip empty lines
      if (trimmedLine === '') return;

      // Split label if present
      const labelSplit = trimmedLine.split(':');
      let instructionPart = trimmedLine;

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
      
      // Check for semicolon
      if (!instructionPart.endsWith(';')) {
        validationErrors.push({
          line: index,
          message: `Line ${index + 1}: Instruction must end with semicolon (;)`,
          type: 'semicolon'
        });
      }
      

      // Check for valid instruction format
      const instruction = instructionPart.replace(/;$/, '').trim().toLowerCase();
      const validInstructions = ['mov', 'mvi', 'jmp', 'jnz', 'jz', 'jnc', 'subi', 'muli', 'mul', 'sub', 'div', 'jp', 'jm', 'jc', 'inr', 'dcr','divi','and','andi','or','ori','xor','xori','not', 'addc', 'addi', 'sub', 'subb', 'add', 'hlt', 'cmp', 'cpi'];

      
      if (instruction.length > 0) {
        const instructionType = instruction.split(' ')[0];
        if (!validInstructions.includes(instructionType)) {          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: Invalid instruction "${instructionType}". Valid instructions: ${validInstructions}`,
            type: 'invalid_instruction'
          });
        }
        
        // === MOV === (two operands: MOV A,B)
        if (instructionType === 'mov') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 3) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV requires two registers (e.g., MOV A,B)`,
              type: 'syntax'
            });
          } else if (parts.length > 3) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV has too many operands`,
              type: 'syntax'
            });
          } else if (!/^[abcdehl]$/i.test(parts[1].replace(',', '')) || !/^[abcdehl]$/i.test(parts[2])) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MOV requires valid registers (A,B,C,D,E,H,L)`,
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
            const mviPattern = /^mvi\s+[abcdehl]\s*,\s*[0-9a-f]{2}h$/i;
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
          const andPattern = /^and\s*[abcdehl]$/i;
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
          const orPattern = /^or\s*[abcdehl]$/i;
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
          const xorPattern = /^xor\s*[abcdehl]$/i;
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
          const label = match[1].toLowerCase();
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
          const label = match[1].toLowerCase();
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
          const label = match[1].toLowerCase();
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
          const label = match[1].toLowerCase();
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
          const label = match[1].toLowerCase();
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
          const label = match[1].toLowerCase();
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
        
        // Check MVI instruction format (require two hex digits followed by 'H')
        if (instructionType === 'mvi') {
          const mviPattern = /^mvi\s+[abcdehl]\s*,\s*[0-9a-f]{2}h$/i;
          if (!mviPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MVI immediate must be two hex digits followed by 'H' (e.g., MVI A,05H)`,
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
          const label = match[1].toLowerCase();
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
            const inrPattern = /^inr\s+[abcdehl]$/i;
            if (!inrPattern.test(instruction)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: INR requires a valid register (A,B,C,D,E,H,L)`,
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
            const dcrPattern = /^dcr\s+[abcdehl]$/i;
            if (!dcrPattern.test(instruction)) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: DCR requires a valid register (A,B,C,D,E,H,L)`,
                type: 'syntax'
              });
            }
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
  const cmpPattern = /^cmp\s+[abcdehl]$/i;
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
          const mulPattern = /^mul\s+[abcdehl]$/i;
          if (!mulPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: MUL instruction must be in the form MUL reg (e.g., MUL B) where reg is A, B, C, D, E, H, or L.`,
              type: 'syntax'
            });
          }
        }

        if (instructionType === 'div') {
          // DIV reg (reg must be one of A, B, C, D, E, H, L)
          const divPattern = /^div\s+[abcdehl]$/i;
          if (!divPattern.test(instruction)) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DIV instruction must be in the form DIV reg (e.g., DIV B) where reg is A, B, C, D, E, H, or L.`,
              type: 'syntax'
            });
          }
        }

        // === ADDC === (Add with Carry)
        if (instructionType === 'addc') {
          const addcPattern = /^addc\s+[abcdehl]$/i;
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
          const subPattern = /^sub\s+[abcdehl]$/i;
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
          const subbPattern = /^subb\s+[abcdehl]$/i;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="h-full bg-[#121212] text-white font-mono text-lg overflow-y-auto flex flex-col">
      {/* Enhanced Error Display */}
      {errors.length > 0 && (
        <div className="border-b border-gray-700">
          {/* Error Panel Header */}
          <div 
            className="flex items-center justify-between p-3 bg-gray-800/50 cursor-pointer hover:bg-gray-800/70 transition-colors"
            onClick={() => setIsErrorPanelExpanded(!isErrorPanelExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                {sortedErrors.filter(e => e.type === 'semicolon').length > 0 && (
                  <span className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded text-xs">
                    {sortedErrors.filter(e => e.type === 'semicolon').length} Missing Semicolon
                  </span>
                )}
                {sortedErrors.filter(e => e.type === 'syntax').length > 0 && (
                  <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs">
                    {sortedErrors.filter(e => e.type === 'syntax').length} Syntax
                  </span>
                )}
                {sortedErrors.filter(e => e.type === 'invalid_instruction').length > 0 && (
                  <span className="px-2 py-1 bg-red-900/40 text-red-200 rounded text-xs">
                    {sortedErrors.filter(e => e.type === 'invalid_instruction').length} Invalid
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isErrorPanelExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Expanded Error Details */}
          {isErrorPanelExpanded && (
            <div className="max-h-64 overflow-y-auto bg-gray-900/30">
              {sortedErrors.map((error, index) => (
                <div 
                  key={index}
                  className={`border-l-4 ${getErrorColor(error.type)} p-3 hover:bg-gray-800/30 transition-colors cursor-pointer`}
                  onClick={() => {
                    setSelectedError(selectedError === index ? null : index);
                    // Scroll to the error line
                    if (textareaRef.current) {
                      const linesUpToIndex = instructions.split('\n').slice(0, error.line).join('\n');
                      const approxCharIndex = linesUpToIndex.length + 1;
                      textareaRef.current.selectionStart = approxCharIndex;
                      textareaRef.current.selectionEnd = approxCharIndex;
                      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getErrorIcon(error.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            Line {error.line + 1}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                            {error.type === 'semicolon' ? 'Missing Semicolon' : 
                             error.type === 'syntax' ? 'Syntax Error' : 'Invalid Instruction'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{error.message}</p>
                        
                        {/* Quick Fix Suggestion */}
                        {getQuickFix(error) && (
                          <div className="mt-2 flex items-center gap-2">
                            <Lightbulb className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs text-yellow-300">{getQuickFix(error)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                applyQuickFix(error);
                              }}
                              className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                            >
                              Fix
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {selectedError === index ? 'Hide' : 'Show'} Details
                    </div>
                  </div>
                  
                  {/* Expanded Error Details */}
                  {selectedError === index && (
                    <div className="mt-3 pl-7 border-l border-gray-600">
                      <div className="text-xs text-gray-400">
                        <div className="mb-1">
                          <strong>Current line:</strong> <code className="bg-gray-800 px-1 rounded">{lines[error.line] || '(empty)'}</code>
                        </div>
                        {error.type === 'semicolon' && (
                          <div className="text-yellow-300">
                            💡 <strong>Tip:</strong> All instructions must end with a semicolon (;)
                          </div>
                        )}
                        {error.type === 'syntax' && (
                          <div className="text-blue-300">
                            💡 <strong>Tip:</strong> Check the instruction format and operands
                          </div>
                        )}
                        {error.type === 'invalid_instruction' && (
                          <div className="text-purple-300">
                            💡 <strong>Tip:</strong> Use the instruction reference (ℹ️ icon) to see valid instructions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-row flex-1">
        <div className="bg-[#1f1f1f] text-gray-400 px-2 py-2 text-right select-none flex-shrink-0">
          {lines.map((_, index) => {
            const isActive = index === highlightedLine;
            const lineError = errors.find(e => e.line === index);
            const errorType = lineError?.type;
            
            return (
              <div
                key={index}
                className={`leading-[3rem] relative ${
                  isActive ? 'bg-blue-500 text-white font-bold shadow-lg border-2 border-blue-300' : ''
                }`}
              >
                {index + 1}
                {/* Error indicator dot */}
                {lineError && (
                  <div className={`absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${
                    errorType === 'semicolon' ? 'bg-orange-400' :
                    errorType === 'syntax' ? 'bg-red-400' :
                    'bg-red-500'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

<div className="flex-grow relative">
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
          }}
            onKeyDown={handleKeyDown}
            placeholder="Type your instructions here."
            className="w-full h-full bg-transparent p-2 resize-none outline-none leading-[3rem] whitespace-pre relative z-10"
            style={{ lineHeight: '3rem' }}
          />
          {/* Highlight overlay for current line */}
          {highlightedLine >= 0 && (
            <div 
              className="absolute left-2 right-2 bg-blue-500/20 border-l-4 border-blue-500 z-0"
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
                className={`absolute left-2 right-2 border-l-4 z-0 ${
                  error.type === 'semicolon' ? 'bg-orange-500/10 border-orange-400' :
                  error.type === 'syntax' ? 'bg-red-500/10 border-red-400' :
                  'bg-red-500/15 border-red-500'
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