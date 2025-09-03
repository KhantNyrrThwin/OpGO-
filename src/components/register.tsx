import { useState } from "react";
import RegTitle from "../assets/Register Title.png"


interface RegisterData {
  A: [string, string];
  B: [string, string];
  C: [string, string];
  D: [string, string];
  E: [string, string];
  H: [string, string];
  L: [string, string];
}

export default function Registers() {
  const [registers, setRegisters] = useState<RegisterData>({
    A: ["0", "B"],
    B: ["0", "0"],
    C: ["0", "0"],
    D: ["A", "A"],
    E: ["0", "0"],
    H: ["0", "0"],
    L: ["0", "0"],
  });

  const updateRegister = (register: keyof RegisterData, index: 0 | 1, value: string) => {
    setRegisters(prev => ({
      ...prev,
      [register]: [
        index === 0 ? value : prev[register][0],
        index === 1 ? value : prev[register][1]
      ]
    }));
  };

  const RegisterBlock = ({ 
    letter, 
    values, 
    color, 
    isFullWidth = false 
  }: { 
    letter: string; 
    values: [string, string]; 
    color: string; 
    isFullWidth?: boolean;
  }) => (
    <div 
      className={`${isFullWidth ? 'w-full' : 'w-1/2'} h-20 flex items-center justify-center px-4 ${color} border-2 border-gray-300`}
    >
      <span className="text-white text-4xl font-bold mr-6">{letter}</span>
      <div className="flex gap-3">
        <input
          type="text"
          value={values[0]}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
            updateRegister(letter as keyof RegisterData, 0, val);
          }}
          className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono"
          maxLength={1}
        />
        <input
          type="text"
          value={values[1]}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
            updateRegister(letter as keyof RegisterData, 1, val);
          }}
          className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono"
          maxLength={1}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#2c2c2c] h-full border-3 border-solid border-[#3F3F46] flex flex-col items-center justify-center p-3 pb-2 pt-0">
      <img src={RegTitle} className="w-45.5 h-[10%]" />


      <div className="w-full max-w-md space-y-2">
        <RegisterBlock 
          letter="A" 
          values={registers.A} 
          color="bg-blue-800" 
          isFullWidth={true}
        />
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="B" 
            values={registers.B} 
            color="bg-purple-400" 
          />
          <RegisterBlock 
            letter="C" 
            values={registers.C} 
            color="bg-cyan-400" 
          />
        </div>
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="D" 
            values={registers.D} 
            color="bg-orange-500" 
          />
          <RegisterBlock 
            letter="E" 
            values={registers.E} 
            color="bg-pink-500" 
          />
        </div>
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="H" 
            values={registers.H} 
            color="bg-blue-500" 
          />
          <RegisterBlock 
            letter="L" 
            values={registers.L} 
            color="bg-green-500" 
          />
        </div>
      </div>
    </div>
  );
}