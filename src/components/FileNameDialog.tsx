import { useState, useEffect, useRef } from 'react';

interface FileNameDialogProps {
  isOpen: boolean;
  currentFileName: string;
  onSave: (fileName: string) => void;
  onCancel: () => void;
}

export default function FileNameDialog({
  isOpen,
  currentFileName,
  onSave,
  onCancel,
}: FileNameDialogProps) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName(currentFileName.replace('.mpc', '').replace('.opgo', ''));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentFileName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fileName.trim();
    if (trimmed) {
      const finalFileName = trimmed.endsWith('.opgo') || trimmed.endsWith('.opg') || trimmed.endsWith('.mpc') ? trimmed : `${trimmed}.opgo`;
      onSave(finalFileName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Save File As</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
              File Name:
            </label>
            <input
              ref={inputRef}
              type="text"
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter file name"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">File will be saved as .opgo</p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
