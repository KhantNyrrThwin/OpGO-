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
import { executeHLT } from '../functions/hlt';
import { parseLabels } from '../functions/parseLabels';
import { executeADD } from '../functions/add';
import { executeLDA } from '../functions/lda';
import { executeSTA } from '../functions/sta';
import { executeLXI } from '../functions/lxi';
import { executeLDAX } from '../functions/ldax';
import { executeSTAX } from '../functions/stax';
import { executeINX } from '../functions/inx';
import { executeDCX } from '../functions/dcx';
import { executeADDCI } from '../functions/addci';
import { executeSUBBI } from '../functions/subbi';
import { executeSETC } from '../functions/setc';
import { getInitialFlags, getInitialRegisters, type Registers as RegistersType, type Flags as FlagsType } from '../functions/types';
import { useTheme } from '../contexts/ThemeContext';

export default function ControlBar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showDropdown, setShowDropdown] = useState(false);
  const { fileName, hasUnsavedChanges, openFile, saveFile, saveAsFile, exportAsAsm, exportAsHex } = useFileContext();

  const [cpuFlags, setCpuFlags] = useState<FlagsType>(getInitialFlags());
  const currentLineRef = useRef<number>(0);
  const isFirstStepRef = useRef<boolean>(true);
  const isRunningRef = useRef<boolean>(false);

  const getCurrentMemory = (): Promise<number[]> => {
  return new Promise((resolve) => {
    const handleMemory = (event: CustomEvent) => {
      resolve(event.detail as number[]);
      window.removeEventListener('getMemory', handleMemory as EventListener);
    };
    window.addEventListener('getMemory', handleMemory as EventListener);
    window.dispatchEvent(new CustomEvent('requestMemory'));
  });
  };

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

  const handleExportAsm = async () => {
    try {
      const content = await getCurrentContent();
      await exportAsAsm(content);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error exporting ASM:', error);
    }
  };

  const handleExportHex = async () => {
    try {
      const content = await getCurrentContent();
      await exportAsHex(content);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error exporting HEX:', error);
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
    // Remove inline '//' comment first
    const beforeSlash = raw.split('//')[0];
    // Cut off anything after the first ';' (treat as terminator/comment boundary)
    const semiIdx = beforeSlash.indexOf(';');
    const beforeSemi = semiIdx >= 0 ? beforeSlash.slice(0, semiIdx) : beforeSlash;
    const trimmed = beforeSemi.trim();
    // Treat full-line comments beginning with ';' as comments
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith(';')) return '';
    // Remove inline label if present
    const labelSplit = trimmed.split(':');
    const instructionOnly = labelSplit.length === 2 ? labelSplit[1] : trimmed;

    return instructionOnly.replace(/\s+/g, ' ').trim();
  };

  const getSemicolonErrors = (content: string) => {
    const errors: Array<{ line: number; message: string; type: 'semicolon' }> = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();
      // Skip empty and full-line comments (// or ;)
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith(';')) continue;
      // Consider only code before inline '//' and treat anything after first ';' as comment
      const beforeSlash = line.split('//')[0];
      const semiIdx = beforeSlash.indexOf(';');
      const codeForCheck = semiIdx >= 0 ? beforeSlash.slice(0, semiIdx + 1) : beforeSlash;
      const check = codeForCheck.trim();
      if (check === '') continue;
      if (!/;\s*$/.test(check)) {
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
    const memory = await getCurrentMemory();

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
    while (
      currentLineRef.current < totalLines && (
        rawLines[currentLineRef.current].trim() === '' ||
        rawLines[currentLineRef.current].trim().startsWith('//') ||
        rawLines[currentLineRef.current].trim().startsWith(';')
      )
    ) {      currentLineRef.current += 1;
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
        // In stepInto function, add error handling:
        case 'lda':
          result = executeLDA(nextInstruction, regs, cpuFlags, memory);
          break;
        case 'sta': {
          const staResult = executeSTA(nextInstruction, regs, cpuFlags, memory);
          result = { registers: staResult.registers, flags: staResult.flags };
          if (staResult.memory !== memory) {
            window.dispatchEvent(new CustomEvent('setMemory', { detail: staResult.memory }));
              }
        }
          break;

        case 'ldax':
          result = executeLDAX(nextInstruction, regs, cpuFlags, memory);
          if (result.error) {
            window.dispatchEvent(new CustomEvent('externalErrors', { 
              detail: [{ 
                line: currentLineRef.current, 
                message: result.error, 
                type: 'syntax' 
              }] 
            }));
            return;
          }
          break;
       
        
        case 'stax':
          result = executeSTAX(nextInstruction, regs, cpuFlags, memory);
          if (result.error) {
            window.dispatchEvent(new CustomEvent('externalErrors', { 
              detail: [{ 
                line: currentLineRef.current, 
                message: result.error, 
                type: 'syntax' 
              }] 
            }));
            return;
          }
          // Update memory state
          if (result.memory !== memory) {
            window.dispatchEvent(new CustomEvent('setMemory', { detail: result.memory }));
          }
          break;
        case 'lxi':
          result = executeLXI(nextInstruction, regs, cpuFlags);
          break;
        case 'mov':
          result = executeMOV(nextInstruction, regs, cpuFlags, memory);
          if (result.error) {
            window.dispatchEvent(new CustomEvent('externalErrors', { 
              detail: [{ 
                line: currentLineRef.current, 
                message: result.error, 
                type: 'syntax' 
              }] 
            }));
            return;
          }
          // Update memory state
          if (result.memory !== memory) {
            window.dispatchEvent(new CustomEvent('setMemory', { detail: result.memory }));
          }
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
   // In the stepInto function, add this case to the switch statement:
        case 'add':
          result = executeADD(nextInstruction, regs, cpuFlags, memory);
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
    result = executeCMP(nextInstruction, regs, cpuFlags, memory);
    break;
case 'cpi':
    result = executeCPI(nextInstruction, regs, cpuFlags);
    break;
  //Raven
  case 'inr':
          result = executeINR(nextInstruction, regs, cpuFlags, memory);
          // Update memory state
          if (result.memory !== memory) {
            window.dispatchEvent(new CustomEvent('setMemory', { detail: result.memory }));
          }
          break;
    case 'dcr':
          result = executeDCR(nextInstruction, regs, cpuFlags, memory);
          // Update memory state
          if (result.memory !== memory) {
            window.dispatchEvent(new CustomEvent('setMemory', { detail: result.memory }));
          }
          break;
    case 'inx':
      result = executeINX(nextInstruction, regs, cpuFlags);
      break;
    case 'dcx':
      result = executeDCX(nextInstruction, regs, cpuFlags);
      break;
    //Raven
          case 'subi':
            result = executeSUBI(nextInstruction, regs, cpuFlags);
          break;
          case 'muli':
              result = executeMULI(nextInstruction, regs, cpuFlags);
              break;
          case 'mul':
          result = executeMUL(nextInstruction, regs, cpuFlags, memory);
          break;  
          case 'div': {
            const divResult = executeDIV(nextInstruction, regs, cpuFlags, memory);
            if (divResult.halt) {
              window.dispatchEvent(new CustomEvent('externalErrors', {
                detail: [{
                  line: currentLineRef.current,
                  message: divResult.error ?? 'DIVIDE BY ZERO',
                  type: 'syntax'
                }]
              }));
              currentLineRef.current = rawLines.length;
              setCpuFlags(divResult.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: divResult.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: divResult.flags }));
              return;
            }
            result = divResult;
            break;
          }
          //act
          case 'addc':
            result = executeADDC(nextInstruction, regs, cpuFlags, memory);
            console.log("ADDC result:", result);
            break;
          case 'addi':
            result = executeADDI(nextInstruction, regs, cpuFlags);
            break;
          case 'addci':
            result = executeADDCI(nextInstruction, regs, cpuFlags);
            break;
          case 'sub':
            result = executeSUB(nextInstruction, regs, cpuFlags, memory);
            break;
          case 'subb':
            result = executeSUBB(nextInstruction, regs, cpuFlags, memory);
            break;
          case 'subbi':
            result = executeSUBBI(nextInstruction, regs, cpuFlags);
            break;
          case 'divi': {
            const diviResult = executeDIVI(nextInstruction, regs, cpuFlags);
            if (diviResult.halt) {
              window.dispatchEvent(new CustomEvent('externalErrors', {
                detail: [{
                  line: currentLineRef.current,
                  message: diviResult.error ?? 'DIVIDE BY ZERO',
                  type: 'syntax'
                }]
              }));
              currentLineRef.current = rawLines.length;
              setCpuFlags(diviResult.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: diviResult.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: diviResult.flags }));
              return;
            }
            result = diviResult;
            break;
          }
          case 'and':
            result = executeAND(nextInstruction, regs, cpuFlags, memory);
            break;
          case 'andi':
            result = executeANDI(nextInstruction, regs, cpuFlags);
            break;
          case 'or':
            result = executeOR(nextInstruction, regs, cpuFlags, memory);
            break;
          case 'ori':
            result = executeORI(nextInstruction, regs, cpuFlags);
            break;
          case 'not':
            result = executeNOT(nextInstruction, regs, cpuFlags);
            break;
          case 'xor':
            result = executeXOR(nextInstruction, regs, cpuFlags, memory);
            break;
          case 'xori':
            result = executeXORI(nextInstruction, regs, cpuFlags);
            break;
          case 'setc':
            result = executeSETC(nextInstruction, regs, cpuFlags);
            break;
          case 'hlt':
            result = executeHLT(nextInstruction, regs, cpuFlags);
            if (result.halt) {
              console.log('Program halted by HLT instruction');
              // Stop execution immediately
              currentLineRef.current = rawLines.length; // Move to end to stop execution
              setCpuFlags(result.flags);
              window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
              window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
              return; // Exit stepInto function
            }
            break;
          case 'mvi':
            result = executeMVI(nextInstruction, regs, cpuFlags, memory);
            if (result.error) {
              window.dispatchEvent(new CustomEvent('externalErrors', { 
                detail: [{ 
                  line: currentLineRef.current, 
                  message: result.error, 
                  type: 'syntax' 
                }] 
              }));
              return;
            }
            // Update memory state
            if (result.memory !== memory) {
              window.dispatchEvent(new CustomEvent('setMemory', { detail: result.memory }));
            }
            break;
        default:
          return;
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
      let memory = await getCurrentMemory();


      // Keep track of current flags locally to avoid React state update delays
      let currentFlags = initialFlags;
            while (isRunningRef.current && currentLineRef.current < rawLines.length) {
        // Check if we should stop
        if (!isRunningRef.current) break;
        
           // Advance to next non-empty, non-comment line
           while (
            currentLineRef.current < rawLines.length && (
              rawLines[currentLineRef.current].trim() === '' ||
              rawLines[currentLineRef.current].trim().startsWith('//') ||
              rawLines[currentLineRef.current].trim().startsWith(';')
            )
          ) {
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
            // In handleRun function:
            case 'sta': {
              const staResult = executeSTA(nextInstruction, regs, cpuFlags, memory);

              if (staResult.error) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: staResult.error,
                    type: 'syntax'
                  }]
                }));
                return; // ⛔ Block execution on error
              }

              result = {
                registers: staResult.registers,
                flags: staResult.flags
              };

              if (staResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: staResult.memory }));
                memory = staResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }

            case 'lda':
              result = executeLDA(nextInstruction, regs, cpuFlags, memory);
            break;
            case 'ldax':
              result = executeLDAX(nextInstruction, regs, cpuFlags, memory);
            break;
            case 'stax': {
              const staxResult = executeSTAX(nextInstruction, regs, cpuFlags, memory);

              if (staxResult.error) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: staxResult.error,
                    type: 'syntax'
                  }]
                }));
                return; // ⛔ Block execution on error
              }

              result = {
                registers: staxResult.registers,
                flags: staxResult.flags
              };

              if (staxResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: staxResult.memory }));
                memory = staxResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }
            case 'lxi':
              result = executeLXI(nextInstruction, regs, currentFlags);
              break;
            case 'mov': {
              const movResult = executeMOV(nextInstruction, regs, cpuFlags, memory);

              if (movResult.error) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: movResult.error,
                    type: 'syntax'
                  }]
                }));
                return; // ⛔ Block execution on error
              }

              result = {
                registers: movResult.registers,
                flags: movResult.flags
              };

              if (movResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: movResult.memory }));
                memory = movResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }
            case 'jmp':
              result = executeJMP(nextInstruction, regs, currentFlags, labelMap);
              if (result.jumpTo !== undefined) {
                currentLineRef.current = result.jumpTo;
                currentFlags = result.flags; // Update local flags
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                await new Promise(resolve => setTimeout(resolve, 500)); // 1 second delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 1 second delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 1 second delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 1 second delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 100ms delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 100ms delay
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
                await new Promise(resolve => setTimeout(resolve, 500)); // 100ms delay
                continue; // Skip incrementing line
            }
            break;
            // In the handleRun function, add this case to the switch statement:
            case 'add':
            result = executeADD(nextInstruction, regs, cpuFlags, memory);
            break;
            //Raven
            case 'inr': {
              const inrResult = executeINR(nextInstruction, regs, cpuFlags, memory);

              result = {
                registers: inrResult.registers,
                flags: inrResult.flags
              };

              if (inrResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: inrResult.memory }));
                memory = inrResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }
            case 'dcr': {
              const dcrResult = executeDCR(nextInstruction, regs, cpuFlags, memory);

              result = {
                registers: dcrResult.registers,
                flags: dcrResult.flags
              };

              if (dcrResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: dcrResult.memory }));
                memory = dcrResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }
            case 'inx':
              result = executeINX(nextInstruction, regs, currentFlags);
              break;
            case 'dcx':
              result = executeDCX(nextInstruction, regs, currentFlags);
              break;
            //Raven
            case 'cmp':
            result = executeCMP(nextInstruction, regs, currentFlags, memory);
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
              result = executeMUL(nextInstruction, regs, currentFlags, memory);
            break;
            case 'div': {
              const divResult = executeDIV(nextInstruction, regs, currentFlags, memory);
              if (divResult.halt) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: divResult.error ?? 'DIVIDE BY ZERO',
                    type: 'syntax'
                  }]
                }));
                isRunningRef.current = false;
                currentLineRef.current = rawLines.length;
                currentFlags = divResult.flags;
                setCpuFlags(divResult.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: divResult.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: divResult.flags }));
                window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
                currentLineRef.current = 0;
                isFirstStepRef.current = true;
                return;
              }
              result = divResult;
              break;
            }
            case 'addc':
              result = executeADDC(nextInstruction, regs, currentFlags, memory);
              break;
            case 'addi':
              result = executeADDI(nextInstruction, regs, currentFlags);
              break;
            case 'addci':
              result = executeADDCI(nextInstruction, regs, currentFlags);
              break;
            case 'sub':
              result = executeSUB(nextInstruction, regs, currentFlags, memory);
              break;
            case 'subb':
              result = executeSUBB(nextInstruction, regs, currentFlags, memory);
              break;
            case 'subbi':
              result = executeSUBBI(nextInstruction, regs, currentFlags);
              break;
            case 'divi': {
              const diviResult = executeDIVI(nextInstruction, regs, currentFlags);
              if (diviResult.halt) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: diviResult.error ?? 'DIVIDE BY ZERO',
                    type: 'syntax'
                  }]
                }));
                isRunningRef.current = false;
                currentLineRef.current = rawLines.length;
                currentFlags = diviResult.flags;
                setCpuFlags(diviResult.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: diviResult.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: diviResult.flags }));
                window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
                currentLineRef.current = 0;
                isFirstStepRef.current = true;
                return;
              }
              result = diviResult;
              break;
            }
            case 'and':
              result = executeAND(nextInstruction, regs, currentFlags, memory);
              break;
            case 'andi':
              result = executeANDI(nextInstruction, regs, currentFlags);
              break;
            case 'or':
              result = executeOR(nextInstruction, regs, currentFlags, memory);
              break;
            case 'ori':
              result = executeORI(nextInstruction, regs, currentFlags);
              break;
            case 'not':
              result = executeNOT(nextInstruction, regs, currentFlags);
              break;
            case 'xor':
              result = executeXOR(nextInstruction, regs, currentFlags, memory);
              break;
            case 'xori':
              result = executeXORI(nextInstruction, regs, currentFlags);
              break;
            case 'setc':
              result = executeSETC(nextInstruction, regs, currentFlags);
              break;
            case 'hlt':
              result = executeHLT(nextInstruction, regs, currentFlags);
              if (result.halt) {
                console.log('Program halted by HLT instruction');
                // Stop execution immediately
                isRunningRef.current = false;
                currentLineRef.current = rawLines.length; // Move to end to stop execution
                currentFlags = result.flags;
                setCpuFlags(result.flags);
                window.dispatchEvent(new CustomEvent('setRegisters', { detail: result.registers }));
                window.dispatchEvent(new CustomEvent('setFlags', { detail: result.flags }));
                // Clear highlight after halt
                window.dispatchEvent(new CustomEvent('highlightLine', { detail: -1 }));
                // Reset step-into position and first step flag
                currentLineRef.current = 0;
                isFirstStepRef.current = true;
                isRunningRef.current = false;
                return; // Exit the autoStep function
              }
              break;
            case 'mvi': {
              const mviResult = executeMVI(nextInstruction, regs, cpuFlags, memory);

              if (mviResult.error) {
                window.dispatchEvent(new CustomEvent('externalErrors', {
                  detail: [{
                    line: currentLineRef.current,
                    message: mviResult.error,
                    type: 'syntax'
                  }]
                }));
                return; // ⛔ Block execution on error
              }

              result = {
                registers: mviResult.registers,
                flags: mviResult.flags
              };

              if (mviResult.memory !== memory) {
                window.dispatchEvent(new CustomEvent('setMemory', { detail: mviResult.memory }));
                memory = mviResult.memory; // ✅ Update memory after dispatch
              }

              break;
            }
            default:
              return;
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
        await new Promise(resolve => setTimeout(resolve, 500));
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
    <div className={`${isDark ? 'bg-[#d3d3d3] text-white' : 'bg-gray-100 text-gray-900'} flex items-center justify-between px-4 py-2 text-sm font-medium relative z-25`}>
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
          <div className={`${isDark ? 'bg-[#3a3a3a] border border-gray-600' : 'bg-white border border-gray-200'} absolute top-8 left-0 rounded shadow-lg z-25`}>
            <ul className="flex flex-col text-left">
              <li 
                className={`${isDark ? 'hover:bg-green-700' : 'hover:bg-gray-100'} px-10 py-4 cursor-pointer`}
                onClick={handleOpen}
              >
                Open (.opgo/.opg/.mpc)
              </li>
              <li 
                className={`${isDark ? 'hover:bg-green-700' : 'hover:bg-gray-100'} px-10 py-4 cursor-pointer`}
                onClick={handleSave}
              >
                Save
              </li>
              <li 
                className={`${isDark ? 'hover:bg-green-700' : 'hover:bg-gray-100'} px-8 py-4 cursor-pointer`}
                onClick={handleSaveAs}
              >
                Save As (.opgo)
              </li>
              <li 
                className={`${isDark ? 'hover:bg-green-700' : 'hover:bg-gray-100'} px-8 py-4 cursor-pointer`}
                onClick={handleExportAsm}
              >
                Export as .asm
              </li>
             
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons Styled Like Image */}
      <div className="flex items-center gap-4">
        {/* Stop Button */}
        <button className={`${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} rounded-full p-2 flex items-center justify-center cursor-pointer`} onClick={handleStop}>
          <div className="bg-white w-3.5 h-3.5" />
        </button>

        {/* Step Into Button */}
        <button className={`${isDark ? 'bg-[#add8e6] hover:bg-[#9ccbe0] text-black border border-black' : 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300'} px-4 py-1 rounded cursor-pointer`} onClick={stepInto}>
          Step Into
        </button>

        {/* Run Button */}
        <button className={`${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} rounded-full p-2 flex items-center justify-center cursor-pointer`} onClick={handleRun}>
          <PlayIcon className="h-4.5 w-4.5 text-white" />
        </button>

        
      </div>
    </div>
  );
}