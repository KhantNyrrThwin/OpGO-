import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface FileContextType {
  fileName: string;
  filePath: string | null;
  hasUnsavedChanges: boolean;
  showFileNameDialog: boolean;
  setFileName: (name: string) => void;
  setFilePath: (path: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setShowFileNameDialog: (show: boolean) => void;
  openFile: () => Promise<string>;
  saveFile: (content: string) => Promise<void>;
  saveAsFile: () => Promise<void>;
  handleSaveWithName: (fileName: string, content: string) => Promise<void>;
  resetFileName: () => void; // 
  exportAsAsm: (content: string, outFileName?: string) => Promise<void>;
  exportAsHex: (content: string, outFileName?: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

// ✅ Format content for 8085 simulator compatibility
const formatContentFor8085 = (content: string): string => {
  // Extract just the instruction lines (remove any existing formatting)
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Create the RTF header
  const rtfHeader = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033{\\fonttbl{\\f0\\fnil\\fcharset0 Courier New;}}\n{\\colortbl ;\\red0\\green0\\blue0;}\n\\viewkind4\\uc1\\pard\\li195\\cf1\\f0\\fs20 ';
  
  // Create the RTF footer
  const rtfFooter = '\\cf0 \n\\par }\n<End Codes>\n20\n<End UserData>\n20\n<End HexData>\n\n<End Comment>';
  
  // Convert each instruction line to RTF format
  const rtfLines = lines.map(line => {
    // Escape RTF special characters
    const escapedLine = line
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par ');
    return escapedLine;
  });
  
  // Combine everything
  return rtfHeader + rtfLines.join('\\par ') + rtfFooter;
};

// ✅ Parse content from 8085 simulator format
const parseContentFrom8085 = (content: string): string => {
  // Remove RTF formatting and extract just the instruction lines
  let cleanContent = content;
  
  // Remove RTF header
  cleanContent = cleanContent.replace(/^.*?\\viewkind4\\uc1\\pard\\li195\\cf1\\f0\\fs20 /s, '');
  
  // Remove RTF footer
  cleanContent = cleanContent.replace(/\\cf0 \n\\par }\n<End Codes>.*$/s, '');
  
  // Remove RTF formatting commands
  cleanContent = cleanContent.replace(/\\par /g, '\n');
  cleanContent = cleanContent.replace(/\\cf1/g, '');
  cleanContent = cleanContent.replace(/\\cf0/g, '');
  
  // Unescape RTF special characters
  cleanContent = cleanContent
    .replace(/\\\\/g, '\\')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');
  
  // Split into lines and clean up
  const lines = cleanContent.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return lines.join('\n');
};

export const FileProvider: React.FC<FileProviderProps> = ({ children }: FileProviderProps) => {
  const [fileName, setFileName] = useState('Untitled.opgo');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);

  const resetFileName = () => {
    setFileName('untitled.opgo');
    setFilePath(null);
    setHasUnsavedChanges(false);
  };

  const openFile = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.opgo,.opg,.mpc';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const lower = file.name.toLowerCase();
            let normalizedContent = content;
            if (lower.endsWith('.mpc')) {
              // Parse content from 8085 simulator format
              normalizedContent = parseContentFrom8085(content);
            } else if (lower.endsWith('.opgo') || lower.endsWith('.opg')) {
              // .opgo is plain text in our own syntax, use as-is
              normalizedContent = content;
            }
            setFileName(file.name);
            setFilePath(file.name);
            setHasUnsavedChanges(false);
            resolve(normalizedContent);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.click();
    });
  };

  const saveFile = async (content: string): Promise<void> => {
    if (filePath && fileName !== 'Untitled.opgo') {
      const lower = fileName.toLowerCase();
      const shouldFormatAsMpc = lower.endsWith('.mpc');
      const dataToWrite = shouldFormatAsMpc ? formatContentFor8085(content) : content;
      const blob = new Blob([dataToWrite], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setHasUnsavedChanges(false);
    } else {
      await saveAsFile();
    }
  };

  const saveAsFile = async (): Promise<void> => {
    setShowFileNameDialog(true);
  };

  const handleSaveWithName = async (finalFileName: string, content: string): Promise<void> => {
    const lower = finalFileName.toLowerCase();
    const shouldFormatAsMpc = lower.endsWith('.mpc');
    const dataToWrite = shouldFormatAsMpc ? formatContentFor8085(content) : content;
    const blob = new Blob([dataToWrite], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFileName(finalFileName);
    setFilePath(finalFileName);
    setHasUnsavedChanges(false);
    setShowFileNameDialog(false);
  };

  const exportAsAsm = async (content: string, outFileName?: string): Promise<void> => {
    const inputLines = content.split('\n');
    const asmLines = inputLines.map((line) => {
      const withoutTrailingWhitespace = line.replace(/\s+$/, '');
      return withoutTrailingWhitespace.replace(/;\s*$/, '');
    });
    const asmContent = asmLines.join('\n');
    const baseName = (outFileName || fileName || 'program').replace(/\.[^/.]+$/, '');
    const downloadName = `${baseName}.asm`;
    const blob = new Blob([asmContent], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsHex = async (content: string, outFileName?: string): Promise<void> => {
    // Placeholder implementation. A real assembler is required for accurate machine code.
    const header = '; OpGo!! HEX export is not fully implemented yet.\n';
    const note = '; This file is a placeholder. Replace with real hex output when assembler is ready.\n';
    const body = content
      .split('\n')
      .map((l) => `; ${l}`)
      .join('\n');
    const hexContent = `${header}${note}\n${body}\n`;
    const baseName = (outFileName || fileName || 'program').replace(/\.[^/.]+$/, '');
    const downloadName = `${baseName}.hex`;
    const blob = new Blob([hexContent], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const value: FileContextType = {
    fileName,
    filePath,
    hasUnsavedChanges,
    showFileNameDialog,
    setFileName,
    setFilePath,
    setHasUnsavedChanges,
    setShowFileNameDialog,
    openFile,
    saveFile,
    saveAsFile,
    handleSaveWithName,
    resetFileName, // 
    exportAsAsm,
    exportAsHex,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
