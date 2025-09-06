import { useRef, useState } from 'react';
import { FolderIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useFileContext } from '../contexts/FileContext';
import { executeMVI } from '../functions/mvi';
import { executeMOV } from '../functions/mov';
import { executeDIVI } from '../functions/divi';
import { executeAND } from '../functions/and';
import { executeANDI } from '../functions/andi';
import { executeOR } from '../functions/or';
import { executeORI } from '../functions/ori';
import { executeXOR } from '../functions/xor';
import { executeXORI } from '../functions/xori';
import { executeNOT } from '../functions/not';
import { executeJMP } from '../functions/jmp';
import { executeJNZ } from '../functions/jnz';
import { executeJZ } from '../functions/jz';
import { executeJNC } from '../functions/jnc';
import { executeSUBI } from '../functions/subi';
import { executeJM } from '../functions/jm';
import { executeJP } from '../functions/jp';
import { executeJC } from '../functions/jc';
import { executeINR } from '../functions/inr';
import { executeDCR } from '../functions/dcr';
import { executeMULI } from '../functions/muli';
import { executeMUL} from '../functions/mul';
import { executeDIV } from '../functions/div';
import { executeADDC } from '../functions/addc';
import { executeADDI } from '../functions/addi';
import { executeSUB } from '../functions/sub';
import { executeSUBB } from '../functions/subb';
import { executeCMP } from '../functions/cmp';
import { executeCPI } from '@/functions/cpi';
import { parseLabels } from '../functions/parseLabels';
import { getInitialFlags, getInitialRegisters, type Registers as RegistersType, type Flags as FlagsType } from '../functions/types';

export default function ControlBar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { fileName, hasUnsavedChanges, openFile, saveFile, saveAsFile } = useFileContext();

  const [cpuFlags, setCpuFlags] = useState<FlagsType>(getInitialFlags());
  const currentLineRef = useRef<number>(0);
  const isFirstStepRef = useRef<boolean>(true);
  const isRunningRef = useRef<boolean>(false);

  const handleOpen = async () => {
    try {
      const content = await openFile();
      window.dispatchEvent(new CustomEvent('fileOpened', { detail: content }));
      setShowDropdown(false);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const handleSave = async () => {
    try {
      const content = await getCurrentContent();
      await saveFile(content);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleSaveAs = async () => {
    try {
      await saveAsFile();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error saving file as:', error);
    }
  };

  const getCurrentContent = (): Promise<string> => {
    return new Promise((resolve) => {
      const handleContent = (event: CustomEvent) => {
        resolve(event.detail);
        window.removeEventListener('getContent', handleContent as EventListener);
      };
      window.addEventListener('getContent', handleContent as EventListener);
      window.dispatchEvent(new CustomEvent('requestContent'));
    });
  };

  const getCurrentRegisters = (): Promise<RegistersType> => {
    return new Promise((resolve) => {
      const handleRegs = (event: CustomEvent) => {
        resolve(event.detail as RegistersType);
        window.removeEventListener('getRegisters', handleRegs as EventListener);
      };
      window.addEventListener('getRegisters', handleRegs as EventListener);
      window.dispatchEvent(new CustomEvent('requestRegisters'));
    });
  };


  const normalizeInstruction = (raw: string): string => {
    const trimmed = raw.trim();
    // Remove trailing semicolon if present, then collapse whitespace
    const noSemi = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
    
    // Remove inline label if present
    const labelSplit = noSemi.split(':');
    const instructionOnly = labelSplit.length === 2 ? labelSplit[1] : noSemi;

    return instructionOnly.replace(/\s+/g, ' ').trim();
  };

  const getSemicolonErrors = (content: string) => {
    const errors: Array<{ line: number; message: string; type: 'semicolon' }> = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = lines[i].trim();
      if (trimmed === '') continue;
      if (!trimmed.endsWith(';')) {
        errors.push({
          line: i,
          message: `Line ${i + 1}: Instruction must end with semicolon (;)`,
          type: 'semicolon',
        });
      }
    }
    return errors;
  };

  const stepInto = async () => {
    const content = await getCurrentContent();
    const labelMap = parseLabels(content);
    
    // Block on semicolon errors
    const semiErrors = getSemicolonErrors(content);
    if (semiErrors.length > 0) {
      window.dispatchEvent(new CustomEvent('externalErrors', { detail: semiErrors }));
      window.dispatchEvent(new CustomEvent('highlightLine', { detail: semiErrors[0].line }));
      return;
    }

    // Validate all other errors (will show UI but not block here beyond semicolons)
    window.dispatchEvent(new CustomEvent('validateInstructions'));
    await new Promise(resolve => setTimeout(resolve, 50));
    const rawLines = content.split('\n');

    // Reset registers and flags to initial state only on first step
    let regs;
    if (isFirstStepRef.current) {
      const initialRegisters = getInitialRegisters();
      const initialFlags = getInitialFlags();
      setCpuFlags(initialFlags);
      window.dispatchEvent(new CustomEvent('setRegisters', { detail: initialRegisters }));
      window.dispatchEvent(new CustomEvent('setFlags', { detail: initialFlags }));
      regs = initialRegisters;
      isFirstStepRef.current = false;
    } else {
      regs = await getCurrentRegisters();
    }

    // Advance to next non-empty line
    const totalLines = rawLines.length;
    while (currentLineRef.current < totalLines && rawLines[currentLineRef.current].trim() === '') {
      currentLineRef.current += 1;
    }
    if (currentLineRef.current >= totalLines) return;

    // Indicate which line is running (0-based index)
    window.dispatchEvent(new CustomEvent('highlightLine', { detail: currentLineRef.current }));

    const nextInstruction = normalizeInstruction(rawLines[currentLineRef.current]);
    if (nextInstruction.length === 0) {
      currentLineRef.current += 1;
      return;
    }

    let result;

    // Use switch on mnemonic (opcode)
    {
      const opcode = nextInstruction.split(' ')[0].toLowerCase();
      switch (opcode) {
        case 'mov':
          result = executeMOV(nextInstruction, regs, cpuFlags);
          break;
        case 'jmp':
            result = executeJMP(nextInstruction, regs, cpuFlags, labelMap);
            if (result.jumpTo !== undefined) {
              currentLineRef.current = result.jumpTo;
              setCpuFlags(result.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
              return; // Skip incrementing line
            }
            break;
        case 'jnz':
            result = executeJNZ(nextInstruction, regs, cpuFlags, labelMap);
            if (result.jumpTo !== undefined) {
              currentLineRef.current = result.jumpTo;
              setCpuFlags(result.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
              return; // Skip incrementing line
            }
            break;
        case 'jz':
            result = executeJZ(nextInstruction, regs, cpuFlags, labelMap);
            if (result.jumpTo !== undefined) {
              currentLineRef.current = result.jumpTo;
              setCpuFlags(result.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
              return; // Skip incrementing line
            }
            break;
        case 'jnc':
            result = executeJNC(nextInstruction, regs, cpuFlags, labelMap);
            if (result.jumpTo !== undefined) {
              currentLineRef.current = result.jumpTo;
              setCpuFlags(result.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
              return; // Skip incrementing line
            }
            break;

//Raven
case 'jc':
  result = executeJC(nextInstruction, regs, cpuFlags, labelMap);
  if (result.jumpTo !== undefined) {
      currentLineRef.current = result.jumpTo;
      setCpuFlags(result.flags);
      window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
      window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
      return; // Skip incrementing line
  }
  break;
  case 'jm':
  result = executeJM(nextInstruction, regs, cpuFlags, labelMap);
  if (result.jumpTo !== undefined) {
      currentLineRef.current = result.jumpTo;
      setCpuFlags(result.flags);
      window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
      window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
      return; // Skip incrementing line
  }
  break;
  case 'jp':
  result = executeJP(nextInstruction, regs, cpuFlags, labelMap);
  if (result.jumpTo !== undefined) {
      currentLineRef.current = result.jumpTo;
      setCpuFlags(result.flags);
      window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
      window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
      return; // Skip incrementing line
  }
  break;
  //Raven
  case 'cmp':
    result = executeCMP(nextInstruction, regs, cpuFlags);
    break;
case 'cpi':
    result = executeCPI(nextInstruction, regs, cpuFlags);
    break;
  //Raven
  case 'inr':
    result = executeINR(nextInstruction, regs, cpuFlags);
    break;
    case 'dcr':
    result = executeDCR(nextInstruction, regs, cpuFlags);
    break;
    //Raven
          case 'subi':
            result = executeSUBI(nextInstruction, regs, cpuFlags);
          break;
          case 'muli':
              result = executeMULI(nextInstruction, regs, cpuFlags);
              break;
          case 'mul':
          result = executeMUL(nextInstruction, regs, cpuFlags);
          break;  
          case 'div':
            result = executeDIV(nextInstruction, regs, cpuFlags);
            break;
          //act
          case 'addc':
            result = executeADDC(nextInstruction, regs, cpuFlags);
            console.log("ADDC result:", result);
            break;
          case 'addi':
            result = executeADDI(nextInstruction, regs, cpuFlags);
            break;
          case 'sub':
            result = executeSUB(nextInstruction, regs, cpuFlags);
            break;
          case 'subb':
            result = executeSUBB(nextInstruction, regs, cpuFlags);
            break;
          case 'divi':
            result = executeDIVI(nextInstruction, regs, cpuFlags);
            break;
          case 'and':
            result = executeAND(nextInstruction, regs, cpuFlags);
            break;
          case 'andi':
            result = executeANDI(nextInstruction, regs, cpuFlags);
            break;
          case 'or':
            result = executeOR(nextInstruction, regs, cpuFlags);
            break;
          case 'ori':
            result = executeORI(nextInstruction, regs, cpuFlags);
            break;
          case 'not':
            result = executeNOT(nextInstruction, regs, cpuFlags);
            break;
          case 'xor':
            result = executeXOR(nextInstruction, regs, cpuFlags);
            break;
          case 'xori':
            result = executeXORI(nextInstruction, regs, cpuFlags);
            break;

        default:
          result = executeMVI(nextInstruction, regs, cpuFlags);
          break;
      }
      
    }

    const { registers: newRegs, flags: newFlags } = result;
    setCpuFlags(newFlags);

    window.dispatchEvent(new CustomEvent('setRegisters', { detail: newRegs }));
    window.dispatchEvent(new CustomEvent('setFlags', { detail: newFlags }));

    // Move to next line for subsequent clicks
    currentLineRef.current += 1;
  };

  const handleRun = async () => {
    if (isRunningRef.current) return; // Prevent multiple runs
    
    const content = await getCurrentContent();
    const labelMap = parseLabels(content);
    
    // Block on semicolon errors
    const semiErrors = getSemicolonErrors(content);
    if (semiErrors.length > 0) {
      window.dispatchEvent(new CustomEvent('externalErrors', { detail: semiErrors }));
      window.dispatchEvent(new CustomEvent('highlightLine', { detail: semiErrors[0].line }));
      return;
    }

    // Validate all other errors (display-only) before running
    window.dispatchEvent(new CustomEvent('validateInstructions'));
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const rawLines = content.split('\n');

    // Reset registers and flags to initial state
    const initialRegisters = getInitialRegisters();
    const initialFlags = getInitialFlags();
    setCpuFlags(initialFlags);
    window.dispatchEvent(new CustomEvent('setRegisters', { detail: initialRegisters }));
    window.dispatchEvent(new CustomEvent('setFlags', { detail: initialFlags }));

    // Reset position and flags
    currentLineRef.current = 0;
    isFirstStepRef.current = true;
    isRunningRef.current = true;

    // Auto-step through all instructions
    const autoStep = async () => {
      // Keep track of current flags locally to avoid React state update delays
      let currentFlags = initialFlags;
      
      while (isRunningRef.current && currentLineRef.current < rawLines.length) {
        // Check if we should stop
        if (!isRunningRef.current) break;

        // Advance to next non-empty line
        while (currentLineRef.current < rawLines.length && rawLines[currentLineRef.current].trim() === '') {
          currentLineRef.current += 1;
        }
        
        if (currentLineRef.current >= rawLines.length) break;

        // Highlight current line
        window.dispatchEvent(new CustomEvent('highlightLine', { detail: currentLineRef.current }));

        const nextInstruction = normalizeInstruction(rawLines[currentLineRef.current]);
        if (nextInstruction.length === 0) {
          currentLineRef.current += 1;
          continue;
        }

        // Get current registers (either initial or from previous step)
        let regs;
        if (isFirstStepRef.current) {
          regs = initialRegisters;
          isFirstStepRef.current = false;
        } else {
          regs = await getCurrentRegisters();
        }

        let result;
        // Use switch on mnemonic (opcode)
        {
          const opcode = nextInstruction.split(' ')[0].toLowerCase();
          switch (opcode) {
            case 'mov':
              result = executeMOV(nextInstruction, regs, currentFlags);
              break;
            case 'jmp':
              result = executeJMP(nextInstruction, regs, currentFlags, labelMap);
              if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                continue; // Skip incrementing line
              }
              break;
            case 'jnz':
              result = executeJNZ(nextInstruction, regs, currentFlags, labelMap);
              if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                continue; // Skip incrementing line
              }
              break;
            case 'jz':
              result = executeJZ(nextInstruction, regs, currentFlags, labelMap);
              if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                continue; // Skip incrementing line
              }
              break;
            case 'jnc':
              result = executeJNC(nextInstruction, regs, currentFlags, labelMap);
              if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                continue; // Skip incrementing line
              }
              break;
            //Raven
            case 'jc':
            result = executeJC(nextInstruction,regs, currentFlags, labelMap);
            if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 100ms delay
                continue; // Skip incrementing line
            }
            break;
            case 'jm':
            result = executeJM(nextInstruction, regs, currentFlags, labelMap);
            if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 100ms delay
                continue; // Skip incrementing line
            }
            break;
            case 'jp':
            result = executeJP(nextInstruction,regs, currentFlags, labelMap);
            if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 1000)); // 100ms delay
                continue; // Skip incrementing line
            }
            break;
            //Raven
            case 'inr':
            result = executeINR(nextInstruction, regs, currentFlags);
            break;
            case 'dcr':
            result = executeDCR(nextInstruction, regs, currentFlags);
            break;
            //Raven
            case 'cmp':
            result = executeCMP(nextInstruction, regs, currentFlags);
            // No jump handling needed for CMP - it just updates flags
            break;
            case 'cpi':
            result = executeCPI(nextInstruction, regs, currentFlags);
            break;
            //Raven
            case 'subi':
              result = executeSUBI(nextInstruction, regs, currentFlags);
              break;
            case 'muli':
              result = executeMULI(nextInstruction, regs, currentFlags);
              break;
            case 'mul':
              result = executeMUL(nextInstruction, regs, currentFlags);
            break;
            case 'div':
              result = executeDIV(nextInstruction, regs, currentFlags);
              break;
            case 'addc':
              result = executeADDC(nextInstruction, regs, currentFlags);
              break;
            case 'addi':
              result = executeADDI(nextInstruction, regs, currentFlags);
              break;
            case 'sub':
              result = executeSUB(nextInstruction, regs, currentFlags);
              break;
            case 'subb':
              result = executeSUBB(nextInstruction, regs, currentFlags);
              break;
            case 'divi':
              result = executeDIVI(nextInstruction, regs, currentFlags);
              break;
            case 'and':
              result = executeAND(nextInstruction, regs, currentFlags);
              break;
            case 'andi':
              result = executeANDI(nextInstruction, regs, currentFlags);
              break;
            case 'or':
              result = executeOR(nextInstruction, regs, currentFlags);
              break;
            case 'ori':
              result = executeORI(nextInstruction, regs, currentFlags);
              break;
            case 'not':
              result = executeNOT(nextInstruction, regs, currentFlags);
              break;
            case 'xor':
              result = executeXOR(nextInstruction, regs, currentFlags);
              break;
            case 'xori':
              result = executeXORI(nextInstruction, regs, currentFlags);
              break;

            default:
              result = executeMVI(nextInstruction, regs, currentFlags);
              break;
          }
        }

        const { registers: newRegs, flags: newFlags } = result;
        currentFlags = newFlags; // Update local flags
        setCpuFlags(newFlags);
        window.dispatchEvent(new CustomEvent('setRegisters', { detail: newRegs }));
        window.dispatchEvent(new CustomEvent('setFlags', { detail: newFlags }));

        // Move to next line
        currentLineRef.current += 1;

        // Wait 1 second before next step
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clear highlight after run completes
      window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
      // Reset step-into position and first step flag
      currentLineRef.current = 0;
      isFirstStepRef.current = true;
      isRunningRef.current = false;
    };

    // Start auto-stepping
    autoStep();
  };

  const handleStop = () => {
    // Stop any running process
    isRunningRef.current = false;
    
    currentLineRef.current = 0;
    isFirstStepRef.current = true;
    
    // Reset registers and flags to initial state
    const initialRegisters = getInitialRegisters();
    const initialFlags = getInitialFlags();
    setCpuFlags(initialFlags);
    window.dispatchEvent(new CustomEvent('setRegisters', { detail: initialRegisters }));
    window.dispatchEvent(new CustomEvent('setFlags', { detail: initialFlags }));
    
    window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
    window.dispatchEvent(new CustomEvent('clearErrors'));
  };

  return (
    <div className="bg-[#d3d3d3] text-white flex items-center justify-between px-4 py-2 text-sm font-medium relative z-15">
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 hover:text-green-400"
        >
          <FolderIcon className="text-yellow-500 h-8 w-8 cursor-pointer" />
          <span className="text-black font-semibold">
            {fileName}{hasUnsavedChanges ? ' *' : ''}
          </span>
        </button>

        {showDropdown && (
          <div className="absolute top-8 left-0 bg-[#3a3a3a] border border-gray-600 rounded shadow-lg z-10">
            <ul className="flex flex-col text-left">
              <li 
                className="px-10 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleOpen}
              >
                Open (.mpc)
              </li>
              <li 
                className="px-10 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleSave}
              >
                Save
              </li>
              <li 
                className="px-8 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleSaveAs}
              >
                Save As (.mpc)
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons Styled Like Image */}
      <div className="flex items-center gap-4">
        {/* Stop Button */}
        <button className="bg-red-600 hover:bg-red-700 rounded-full p-2 flex items-center justify-center cursor-pointer" onClick={handleStop}>
          <div className="bg-white w-3.5 h-3.5" />
        </button>

        {/* Step Into Button */}
        <button className="bg-[#add8e6] hover:bg-[#9ccbe0] text-black border border-black px-4 py-1 rounded cursor-pointer" onClick={stepInto}>
          Step Into
        </button>

        {/* Run Button */}
        <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 flex items-center justify-center cursor-pointer" onClick={handleRun}>
          <PlayIcon className="h-4.5 w-4.5 text-white" />
        </button>

        
      </div>
    </div>
  );
}