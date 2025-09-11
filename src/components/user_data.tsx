import React, { useState, useEffect } from 'react';
import UserData from "../assets/UserData.png"
import { useTheme } from "../contexts/ThemeContext";

// Define a type for a single row of memory data.
type MemoryRow = {
  address: string;
  data: string;
};

// Main component that serves as the user grid.
const App = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Use a type annotation to tell TypeScript what kind of data `memory` will hold.
  const [memory, setMemory] = useState<MemoryRow[]>([]);
  
  // Define a type for the editing cell state.
  const [editingCell, setEditingCell] = useState<{ rowIndex: number | null; column: 'address' | 'data' | null }>({ rowIndex: null, column: null });
      useEffect(() => {
      const handleRequestMemory = () => {
        // Convert your memory data to a number array
        const memoryArray = new Array(65536).fill(0); // 64KB memory
        memory.forEach((row) => {
          const address = parseInt(row.address.replace('H', ''), 16);
          const value = parseInt(row.data.replace('H', ''), 16);
          memoryArray[address] = value;
        });
        
        window.dispatchEvent(new CustomEvent('getMemory', { detail: memoryArray }));
      };

      window.addEventListener('requestMemory', handleRequestMemory);
      
      return () => {
        window.removeEventListener('requestMemory', handleRequestMemory);
      };
    }, [memory]); // Add memory to dependency array

        // In UserData component, add useEffect to listen for memory updates
    useEffect(() => {
      const handleSetMemory = (event: CustomEvent) => {
        const memoryArray = event.detail as number[];
        // Convert memory array back to your table format if needed
        const newMemoryRows: MemoryRow[] = [];
        memoryArray.forEach((value, index) => {
          if (value !== 0) { // Only show non-zero values or all if desired
            newMemoryRows.push({
              address: index.toString(16).toUpperCase().padStart(4, '0') + 'H',
              data: value.toString(16).toUpperCase().padStart(2, '0') + 'H'
            });
          }
        });
        setMemory(newMemoryRows);
      };

      window.addEventListener('setMemory', handleSetMemory as EventListener);
      
      return () => {
        window.removeEventListener('setMemory', handleSetMemory as EventListener);
      };
    }, []);


  // Function to convert a hex string to an integer, increment it, and convert it back to a padded hex string.
  const incrementHexAddress = (hexString: string): string => {
    // Remove the 'H' suffix for calculation
    const value = parseInt(hexString, 16);
    // Add 1 to the address
    const nextValue = value + 1;
    // Convert back to hex, pad with leading zeros to 4 characters, and add 'H' suffix
    return nextValue.toString(16).toUpperCase().padStart(4, '0') + 'H';
  };

  // Function to add a new row to the grid
  const handleAddRow = (): void => {
    let newAddress: string;
    // If the table is empty, start at 0000H
    if (memory.length === 0) {
      newAddress = '0000H';
    } else {
      // Otherwise, increment the address of the last row
      const lastAddress = memory[memory.length - 1].address;
      newAddress = incrementHexAddress(lastAddress.slice(0, -1));
    }
    // Add the new row with a default data value of 00H
    setMemory([...memory, { address: newAddress, data: '00H' }]);
  };

  // Handler for when a cell is clicked, enabling editing.
  const handleCellClick = (rowIndex: number, column: 'address' | 'data'): void => {
    setEditingCell({ rowIndex, column });
  };

  // Handler for when the input field value changes.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, column: 'address' | 'data'): void => {
    const newValue = e.target.value.toUpperCase();
    const updatedMemory = [...memory];
    updatedMemory[rowIndex][column] = newValue;
    setMemory(updatedMemory);
  };

  // Handler for when the user finishes editing a cell.
  const handleInputBlur = (): void => {
    setEditingCell({ rowIndex: null, column: null });
  };

  return (
    <div className={`${isDark ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-900'} p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto my-2 font-sans`}>
      <div className="flex flex-col items-center">
        <img src={UserData} className="w-35.5 h-[15%] mt-0 " />
        <div className={`w-full text-center py-2 mb-4 ${isDark ? 'text-gray-500 border-b border-gray-700' : 'text-neutral-500 border-b border-neutral-300'}`}></div>


         {/* Make table scrollable */}
        <div className="w-full" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`${isDark ? 'border-b border-gray-700 text-gray-400' : 'border-b border-neutral-300 text-neutral-600'}`}>
                <th className="text-left py-2 px-4">Address</th>
                <th className="text-left py-2 px-4">Data</th>
              </tr>
            </thead>
          <tbody>
            {memory.length > 0 ? (
              memory.map((row, index) => (
                <tr
                  key={index}
                  className={`${isDark ? 'border-b border-gray-800 hover:bg-gray-900' : 'border-b border-neutral-200 hover:bg-neutral-200'} cursor-pointer`}
                >
                  <td
                    className="py-2 px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(index, 'address');
                    }}
                  >
                    {editingCell.rowIndex === index && editingCell.column === 'address' ? (
                      <input
                        type="text"
                        value={row.address}
                        onChange={(e) => handleInputChange(e, index, 'address')}
                        onBlur={handleInputBlur}
                        className={`w-full rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-neutral-900 border border-neutral-300'}`}
                        autoFocus
                      />
                    ) : (
                      <span className={`${isDark ? 'text-gray-100' : 'text-neutral-900'}`}>{row.address}</span>
                    )}
                  </td>
                  <td
                    className="py-2 px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(index, 'data');
                    }}
                  >
                    {editingCell.rowIndex === index && editingCell.column === 'data' ? (
                      <input
                        type="text"
                        value={row.data}
                        onChange={(e) => handleInputChange(e, index, 'data')}
                        onBlur={handleInputBlur}
                        className={`w-full rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-neutral-900 border border-neutral-300'}`}
                        autoFocus
                      />
                    ) : (
                      <span className={`${isDark ? 'text-gray-100' : 'text-neutral-900'}`}>{row.data}</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr 
                className={`cursor-pointer ${isDark ? 'hover:bg-gray-900' : 'hover:bg-neutral-200'}`}
                onClick={handleAddRow}
              >
                <td colSpan={2} className={`text-center py-8 border-2 border-dashed rounded-md ${isDark ? 'text-gray-500 border-gray-700' : 'text-neutral-500 border-neutral-300'}`}>
                  Click here to add the first memory entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {memory.length > 0 && (
          <button
            onClick={handleAddRow}
            className={`mt-6 px-6 py-2 font-medium rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'}`}
          >
            Add New Row
          </button>
        )}
      </div>
    </div>
    </div>
  );
};

export default App;
