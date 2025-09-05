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
      
      // Normalize instruction (remove semicolon)
      const instruction = trimmedLine.replace(';', '').trim().toLowerCase();
      const validInstructions = ['mov', 'mvi', 'divi','and', 'andi', 'or'];
      
      if (instruction.length > 0) {
        const instructionType = instruction.split(' ')[0];
        if (!validInstructions.includes(instructionType)) {
          validationErrors.push({
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
        
        // === AND === (one register: AND A)
        if (instructionType === 'and') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: AND requires a register`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: AND has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating multiple operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: AND only takes one register (e.g., AND A)`,
                type: 'syntax'
              });
            } else {
              const andPattern = /^and\s+[abcdehl]$/i;
              if (!andPattern.test(instruction)) {
                validationErrors.push({
                  line: index,
                  message: `Line ${index + 1}: AND requires a valid register (A,B,C,D,E,H,L)`,
                  type: 'syntax'
                });
              }
            }
          }
        }

        // === DIVI === (immediate hex: DIVI 05H)
        if (instructionType === 'divi') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DIVI requires an immediate value`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: DIVI has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating register operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: DIVI requires an immediate hex value, not registers (e.g., DIVI 05H)`,
                type: 'syntax'
              });
            } else {
              const diviPattern = /^divi\s+([0-9a-f]{2}h)$/i;
              const match = diviPattern.exec(instruction);
              if (!match) {
                // Specific error messages for different invalid formats
                const operand = parts[1];
                if (/^\d+$/.test(operand)) {
                  validationErrors.push({
                    line: index,
                    message: `Line ${index + 1}: DIVI requires 'H' suffix (e.g., DIVI 05H)`,
                    type: 'syntax'
                  });
                } else if (operand.endsWith('h') || operand.endsWith('H')) {
                  if (operand.toLowerCase().endsWith('hh')) {
                    validationErrors.push({
                      line: index,
                      message: `Line ${index + 1}: DIVI has extra 'H' suffix (e.g., DIVI 05H, not 05HH)`,
                      type: 'syntax'
                    });
                  } else if (!/^[0-9a-f]{2}h$/i.test(operand)) {
                    validationErrors.push({
                      line: index,
                      message: `Line ${index + 1}: DIVI requires valid hex digits (0-9, A-F)`,
                      type: 'syntax'
                    });
                  }
                } else {
                  validationErrors.push({
                    line: index,
                    message: `Line ${index + 1}: DIVI requires an immediate hex value (e.g., DIVI 05H)`,
                    type: 'syntax'
                  });
                }
              }
            }
          }
        }

        // === ANDI === (immediate hex: ANDI 0FH)
        if (instructionType === 'andi') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ANDI requires an immediate value`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: ANDI has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating register operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: ANDI requires an immediate hex value, not registers (e.g., ANDI 0FH)`,
                type: 'syntax'
              });
            } else {
              const andiPattern = /^andi\s+([0-9a-f]{2}h)$/i;
              const match = andiPattern.exec(instruction);
              if (!match) {
                // Specific error messages for different invalid formats
                const operand = parts[1];
                if (/^\d+$/.test(operand)) {
                  validationErrors.push({
                    line: index,
                    message: `Line ${index + 1}: ANDI requires 'H' suffix (e.g., ANDI 0FH)`,
                    type: 'syntax'
                  });
                } else if (operand.endsWith('h') || operand.endsWith('H')) {
                  if (operand.toLowerCase().endsWith('hh')) {
                    validationErrors.push({
                      line: index,
                      message: `Line ${index + 1}: ANDI has extra 'H' suffix (e.g., ANDI 0FH, not 0FHH)`,
                      type: 'syntax'
                    });
                  } else if (!/^[0-9a-f]{2}h$/i.test(operand)) {
                    validationErrors.push({
                      line: index,
                      message: `Line ${index + 1}: ANDI requires valid hex digits (0-9, A-F)`,
                      type: 'syntax'
                    });
                  }
                } else {
                  validationErrors.push({
                    line: index,
                    message: `Line ${index + 1}: ANDI requires an immediate hex value (e.g., ANDI 0FH)`,
                    type: 'syntax'
                  });
                }
              }
            }
          }
        }

        // === OR === (one register: OR A)
        if (instructionType === 'or') {
          const parts = instruction.split(/\s+/);
          if (parts.length < 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: OR requires a register`,
              type: 'syntax'
            });
          } else if (parts.length > 2) {
            validationErrors.push({
              line: index,
              message: `Line ${index + 1}: OR has too many operands`,
              type: 'syntax'
            });
          } else {
            // Check if the operand contains a comma (indicating multiple operands)
            if (parts[1].includes(',')) {
              validationErrors.push({
                line: index,
                message: `Line ${index + 1}: OR only takes one register (e.g., OR A)`,
                type: 'syntax'
              });
            } else {
              const orPattern = /^or\s+[abcdehl]$/i;
              if (!orPattern.test(instruction)) {
                validationErrors.push({
                  line: index,
                  message: `Line ${index + 1}: OR requires a valid register (A,B,C,D,E,H,L)`,
                  type: 'syntax'
                });
              }
            }
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
        textareaRef.current.selectionStart = approxCharIndex;
        textareaRef.current.selectionEnd = approxCharIndex;
        textareaRef.current.scrollTop = textareaRef.current.scrollTop + 0;
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
            autoCapitalize='off'
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