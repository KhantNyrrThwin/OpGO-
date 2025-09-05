
import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { useFileContext } from '../contexts/FileContext';

interface ValidationError {
  line: number;
  message: string;
  type: 'semicolon' | 'syntax' | 'invalid_instruction';
}

export default function InstructionInput() {
  const [instructions, setInstructions] = useState("");
  const [highlightedLine, setHighlightedLine] = useState<number>(-1);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setHasUnsavedChanges } = useFileContext();

  const lines = instructions.split('\n');

  // Function to validate all errors (for run button)
  const validateAllErrors = (): ValidationError[] => {
    return validateInstructions(instructions);
  };

  // Expose validation function to parent components
  useEffect(() => {
    const handleValidateAll = () => {
      const allErrors = validateAllErrors();
      setErrors(allErrors);
      setShowErrors(allErrors.length > 0);
      console.log('Validation errors:', allErrors);
    };

    const handleExternalErrors = (event: CustomEvent) => {
      const incoming = event.detail as ValidationError[];
      setErrors(incoming);
      setShowErrors(incoming.length > 0);
    };

    const handleClearErrors = () => {
      setErrors([]);
      setShowErrors(false);
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
  const validateInstructions = (text: string): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    const instructionLines = text.split('\n');
    
    instructionLines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (trimmedLine === '') return;
      
      // Check for semicolon
      if (!trimmedLine.endsWith(';')) {
        validationErrors.push({
          line: index,
          message: `Line ${index + 1}: Instruction must end with semicolon (;)`,
          type: 'semicolon'
        });
      }
      

      // Check for valid instruction format
      const instruction = trimmedLine.replace(';', '').trim().toLowerCase();
      const validInstructions = ['mov', 'mvi', 'jmp', 'jnz', 'jz', 'jnc', 'subi', 'muli', 'mul', 'div', 'jp', 'jm', 'jc', 'inr', 'dcr'];

      
      if (instruction.length > 0) {
        const instructionType = instruction.split(' ')[0];
        if (!validInstructions.includes(instructionType)) {          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: Invalid instruction "${instructionType}". Valid instructions: MOV, MVI, DIVI, AND, ANDI, OR`,
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
        
       


        

      if (instructionType === 'jmp') {
        const jmpPattern = /^jmp\s+[a-z_][a-z0-9_]*$/i;
        if (!jmpPattern.test(instruction)) {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: JMP must be followed by a valid label (e.g., JMP LOOP)`,
            type: 'syntax'
          });
        }
      }
      //Raven
            // === JP === (Jump if Positive)
      if (instructionType === 'jp') {
        const jpPattern = /^jp\s+[a-z_][a-z0-9_]*$/i;
        if (!jpPattern.test(instruction)) {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: JP must be followed by a valid label (e.g., JP LOOP)`,
            type: 'syntax'
          });
        }
      }

      // === JM === (Jump if Minus)
      if (instructionType === 'jm') {
        const jmPattern = /^jm\s+[a-z_][a-z0-9_]*$/i;
        if (!jmPattern.test(instruction)) {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: JM must be followed by a valid label (e.g., JM LOOP)`,
            type: 'syntax'

          });
        }}
        
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
        const jcPattern = /^jc\s+[a-z_][a-z0-9_]*$/i;
        if (!jcPattern.test(instruction)) {
          validationErrors.push({
            line: index,
            message: `Line ${index + 1}: JC must be followed by a valid label (e.g., JC LOOP)`,
            type: 'syntax'
          });
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
      {/* Error Display */}
      {showErrors && errors.length > 0 && (
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-red-400 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Validation Errors ({errors.length})
            </h3>
            <button
              onClick={() => setShowErrors(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto">
            {errors.map((error, index) => (
              <Alert key={index} variant='destructive' className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-red-400">
                  {error.type === 'semicolon' ? 'Missing Semicolon' : 
                   error.type === 'syntax' ? 'Syntax Error' : 'Invalid Instruction'}
                </AlertTitle>
                <AlertDescription className="text-red-300">
                  {error.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-row flex-1">
        <div className="bg-[#1f1f1f] text-gray-400 px-2 py-2 text-right select-none flex-shrink-0">
          {lines.map((_, index) => {
            const isActive = index === highlightedLine;
            return (
              <div
                key={index}
                className={`leading-[3rem] ${isActive ? 'bg-blue-500 text-white font-bold shadow-lg border-2 border-blue-300' : ''}`}
              >
                {index + 1}
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
        </div>
      </div>
    </div>
  );
}