import { useRef, useState } from 'react';
import { FolderIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useFileContext } from '../contexts/FileContext';
import { executeMVI } from '../functions/mvi';
import { executeMOV } from '../functions/mov';
import { executeJMP } from '../functions/jmp';
import { executeJNZ } from '../functions/jnz';
import { executeJZ } from '../functions/jz';
import { executeJNC } from '../functions/jnc';
import { parseLabels } from '../functions/parseLabels';
import { getInitialFlags, type Registers as RegistersType, type Flags as FlagsType } from '../functions/types';

export default function ControlBar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { fileName, hasUnsavedChanges, openFile, saveFile, saveAsFile } = useFileContext();

  const [cpuFlags, setCpuFlags] = useState<FlagsType>(getInitialFlags());
  const currentLineRef = useRef<number>(0);

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
      const content = await getCurrentContent();
      await saveAsFile(content);
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

    const regs = await getCurrentRegisters();
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

    const regs = await getCurrentRegisters();
    let workingRegs = regs;
    let workingFlags = cpuFlags;

    for (let i = 0; i < rawLines.length; i += 1) {
      const raw = rawLines[i];
      const normalized = normalizeInstruction(raw);
      if (normalized.length === 0) continue;

      // Highlight current line
      window.dispatchEvent(new CustomEvent('highlightLine', { detail: i }));

      let result;
      // Use switch on mnemonic (opcode)
      {
        const opcode = normalized.split(' ')[0].toLowerCase();
        switch (opcode) {
          case 'mov':
            result = executeMOV(normalized, workingRegs, workingFlags);
            break;
          case 'jmp':
            result = executeJMP(normalized, workingRegs, workingFlags, labelMap);
            if (result.jumpTo !== undefined) {
              i = result.jumpTo - 1; // -1 because the loop will increment i
              workingRegs = result.registers;
              workingFlags = result.flags;
              continue; // skip normal flow
            }
            break;
          case 'jnz':
            result = executeJNZ(normalized, workingRegs, workingFlags, labelMap);
            if (result.jumpTo !== undefined) {
              i = result.jumpTo - 1;
              workingRegs = result.registers;
              workingFlags = result.flags;
              continue;
            }
            break;
          case 'jz':
            result = executeJZ(normalized, workingRegs, workingFlags, labelMap);
            if (result.jumpTo !== undefined) {
              i = result.jumpTo - 1;
              workingRegs = result.registers;
              workingFlags = result.flags;
              continue;
            }
            break;
          case 'jnc':
            result = executeJNC(normalized, workingRegs, workingFlags, labelMap);
            if (result.jumpTo !== undefined) {
              i = result.jumpTo - 1;
              workingRegs = result.registers;
              workingFlags = result.flags;
              continue;
            }
            break;
          default:
            result = executeMVI(normalized, workingRegs, workingFlags);
            break;
        }
      }

      workingRegs = result.registers;
      workingFlags = result.flags;

      window.dispatchEvent(new CustomEvent('setRegisters', { detail: workingRegs }));
      window.dispatchEvent(new CustomEvent('setFlags', { detail: workingFlags }));
    }

    setCpuFlags(workingFlags);
    // Clear highlight after run completes
    window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
    // Reset step-into position
    currentLineRef.current = 0;
  };

  const handleStop = () => {
    currentLineRef.current = 0;
    window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
    window.dispatchEvent(new CustomEvent('clearErrors'));
  };

  return (
    <div className="bg-[#d3d3d3] text-white flex items-center justify-between px-4 py-2 text-sm font-medium relative">
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
