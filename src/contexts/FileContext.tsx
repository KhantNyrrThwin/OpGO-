import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  saveAsFile: (content: string) => Promise<void>;
  handleSaveWithName: (fileName: string, content: string) => Promise<void>;
  resetFileName: () => void; // 
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
  const lines = content.split('\n');
  const formattedLines = lines.map(line => line.trimEnd());
  while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
    formattedLines.pop();
  }
  return formattedLines.join('\r\n');
};

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [fileName, setFileName] = useState('Untitled.mpc');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<string>('');

  const resetFileName = () => {
    setFileName('untitled.mpc'); // or 'untitled.mpc' if preferred
    setFilePath(null);
    setHasUnsavedChanges(false);
  };

  const openFile = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.mpc';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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
    if (filePath && fileName !== 'Untitled.mpc') {
      const formattedContent = formatContentFor8085(content);
      const blob = new Blob([formattedContent], { type: 'text/plain; charset=utf-8' });
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
      await saveAsFile(content);
    }
  };

  const saveAsFile = async (content: string): Promise<void> => {
    setPendingContent(content);
    setShowFileNameDialog(true);
  };

  const handleSaveWithName = async (finalFileName: string, content: string): Promise<void> => {
    const formattedContent = formatContentFor8085(content);
    const blob = new Blob([formattedContent], { type: 'text/plain; charset=utf-8' });
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
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
