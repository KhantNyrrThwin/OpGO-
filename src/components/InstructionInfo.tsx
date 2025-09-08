import React, { useState } from 'react';

interface Instruction {
  name: string;
  description: string;
}

const instructions: Instruction[] = [
  { name: "MOV R1, R2", description: "Copy contents of register R2 into register R1" },
  { name: "MVI R1, data", description: "Copy operand (1 byte hexadecimal number) to register R1" },
  { name: "LDA X", description: "Load accumulator with contents of memory location X" },
  { name: "STA X", description: "Store contents of accumulator in memory location X" },
  { name: "ADD R1", description: "Add contents of register R1 to accumulator" },
  { name: "ADDC R1", description: "Add R1 and carry bit C to accumulator" },
  { name: "ADDI data", description: "Add immediate data to accumulator" },
  { name: "SUB R1", description: "Subtract contents of R1 from accumulator" },
  { name: "SUBB R1", description: "Subtract R1 and carry bit C from accumulator" },
  { name: "SUBI data", description: "Subtract immediate data from accumulator" },
  { name: "MUL R1", description: "Multiply contents of accumulator by R1" },
  { name: "MULI data", description: "Multiply contents of accumulator by immediate data" },
  { name: "DIV R1", description: "Divide contents of accumulator by R1" },
  { name: "DIVI data", description: "Divide contents of accumulator by immediate data" },
  { name: "AND R1", description: "Bitwise AND contents of accumulator and R1" },
  { name: "ANDI data", description: "Bitwise AND contents of accumulator and hexadecimal data" },
  { name: "OR R1", description: "Bitwise OR contents of accumulator and R1" },
  { name: "ORI data", description: "Bitwise OR contents of accumulator and hexadecimal data" },
  { name: "XOR R1", description: "Bitwise XOR contents of accumulator and R1" },
  { name: "XORI data", description: "Bitwise XOR contents of accumulator and hexadecimal data" },
  { name: "NOT", description: "Bitwise invert contents of accumulator" },
  { name: "CMP R1", description: "Compare R1 with contents of accumulator" },
  { name: "CPI data", description: "Compare immediate data with contents of accumulator" },
  { name: "INR", description: "Increment Registers by 1" },
  { name: "DCR", description: "Decrement Registers by 1" },
  { name: "JMP adr", description: "Jump to designated instruction" },
  { name: "JNZ adr", description: "Jump if result is not zero (Z = 0)" },
  { name: "JZ adr", description: "Jump if result is zero (Z = 1)" },
  { name: "JNC adr", description: "Jump if no carry generated (C = 0)" },
  { name: "JC adr", description: "Jump if carry generated (C = 1)" },
  { name: "JP adr", description: "Jump if sign bit is 0 (positive)" },
  { name: "JM adr", description: "Jump if sign bit is 1 (negative)" },
  { name: "HLT", description: "Stop program execution" },
];

interface Props {
  goBack: () => void;
}

export default function InstructionInfo({ goBack }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInstructions = instructions.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-80 text-white p-8 relative">
      {/* Top-right Back Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={goBack}
          className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow transition cursor-pointer"
        >
          ← Back to Simulator
        </button>
      </div>

      {/* Page Content */}
      <div className="max-w-5xl mx-auto mt-16">
        <h1 className="text-3xl font-bold mb-6 text-left">Valid OpGO!! Instructions</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 bg-opacity-70 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredInstructions.map((inst, idx) => (
            <div
              key={idx}
              className="bg-gray-800 bg-opacity-70 p-4 rounded-lg shadow hover:bg-gray-700 transition"
            >
              <span className="block text-green-400 font-semibold text-lg">{inst.name}</span>
              <p className="text-sm text-gray-300 mt-1">{inst.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}