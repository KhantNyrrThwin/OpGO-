import { useState } from 'react';
import { FolderIcon, PlayIcon} from '@heroicons/react/24/solid';

export default function ControlBar() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="bg-[#d3d3d3] text-white flex items-center justify-between px-4 py-2 text-sm font-medium relative">
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 hover:text-green-400"
        >
          <FolderIcon className="text-yellow-500 h-8 w-8" />
          
        </button>

        {showDropdown && (
          <div className="absolute top-8 left-0 bg-[#3a3a3a] border border-gray-600 rounded shadow-lg z-10">
            <ul className="flex flex-col text-left">
              <li className="px-10 py-4 hover:bg-green-700 cursor-pointer">Open</li>
              <li className="px-10 py-4 hover:bg-green-700 cursor-pointer">Save</li>
              <li className="px-10 py-4 hover:bg-green-700 cursor-pointer">Save As</li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons Styled Like Image */}
      <div className="flex items-center gap-4">
        {/* Stop Button */}
        <button className="bg-red-600 hover:bg-red-700 rounded-full p-2 flex items-center justify-center">
          <div className="bg-white w-3.5 h-3.5" />
        </button>

        {/* Step Into Button */}
        <button className="bg-[#add8e6] hover:bg-[#9ccbe0] text-black border border-black px-4 py-1 rounded">
          Step Into
        </button>

        {/* Run Button */}
        <button className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 flex items-center justify-center">
          <PlayIcon className="h-4.5 w-4.5 text-white" />
        </button>

        {/* Neon BUTTONS Label */}
        <div className="bg-blue-600 px-4 py-1 rounded text-[#39ff14] font-bold">
          BUTTONS
        </div>
      </div>
    </div>
  );
}
