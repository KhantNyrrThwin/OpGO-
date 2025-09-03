import { useState, useEffect, useRef } from 'react';
import { FolderIcon, PlayIcon } from '@heroicons/react/24/solid';
import { useFileContext } from '../contexts/FileContext';

export default function ControlBar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fileName, hasUnsavedChanges, openFile, saveFile, saveAsFile } = useFileContext();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Ctrl+S / Cmd+S to trigger Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileName]);

  const handleNewFile = () => {
    window.dispatchEvent(new CustomEvent('newFile'));
    setShowDropdown(false);
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

      // Ensure filename ends with .mpc
      let finalFileName = fileName;
      if (!finalFileName.endsWith('.mpc')) {
        finalFileName += '.mpc';
      }

      await saveFile(content, finalFileName);
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

  return (
    <div className="bg-[#d3d3d3] text-white flex items-center justify-between px-4 py-2 text-sm font-medium relative">
      {/* File Menu */}
      <div className="relative" ref={dropdownRef}>
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
                className="px-15 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleNewFile}
              >
                New File
              </li>
              <li
                className="px-15 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleOpen}
              >
                Open 
              </li>
              <li
                className="px-15 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleSave}
              >
                Save
              </li>
              <li
                className="px-15 py-4 hover:bg-green-700 cursor-pointer"
                onClick={handleSaveAs}
              >
                Save As 
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons Styled Like Image */}
      <div className="flex items-center gap-4">
        <button className="bg-red-600 hover:bg-red-700 rounded-full p-2 flex items-center justify-center cursor-pointer">
          <div className="bg-white w-4 h-4" />
        </button>

        <button className="bg-[#add8e6] hover:bg-[#9ccbe0] text-black border border-black px-4 py-1 rounded cursor-pointer">
          Step Into
        </button>

        <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 flex items-center justify-center cursor-pointer">
          <PlayIcon className="h-5 w-5 text-white" />
        </button>

        <div className="bg-blue-600 px-4 py-1 rounded text-[#39ff14] font-bold">
          BUTTONS
        </div>
      </div>
    </div>
  );
}
