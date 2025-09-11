import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import RegTitle from "../assets/Register Title.png"
import type { Registers as RegistersType } from "../functions/types";
import { useTheme } from "../contexts/ThemeContext";

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [registers, setRegisters] = useState<RegisterData>({
    A: ["0", "0"],
    B: ["0", "0"],
    C: ["0", "0"],
    D: ["0", "0"],
    E: ["0", "0"],
    H: ["0", "0"],
    L: ["0", "0"],
  });

  // Refs to track previous values
  const prevRegisters = useRef<RegisterData | null>(null);
  
  // Refs for GSAP animations
  const registerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    A: null, B: null, C: null, D: null, E: null, H: null, L: null
  });
  
  // Flag to prevent animations on first load
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const handleSetRegisters = (e: CustomEvent) => {
      const next: RegistersType = e.detail;
      
      // Skip animations on first load
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setRegisters(next as RegisterData);
        prevRegisters.current = next as RegisterData;
        return;
      }
      
      // Check which registers changed and trigger enhanced animations
      Object.keys(next).forEach((key) => {
        const regKey = key as keyof RegisterData;
        if (prevRegisters.current && 
            (next[regKey][0] !== prevRegisters.current[regKey][0] || 
             next[regKey][1] !== prevRegisters.current[regKey][1])) {
          
          const ref = registerRefs.current[key];
          if (ref) {
            gsap.to(ref, {
              scale: 1.1,
              duration: 0.5,
              ease: "power2.out",
              yoyo: true,
              repeat: 1
            });
          }
        }
      });
      
      setRegisters(next as RegisterData);
      prevRegisters.current = next as RegisterData;
    };

    const handleRequestRegisters = () => {
      window.dispatchEvent(new CustomEvent('getRegisters', { detail: registers }));
    };

    window.addEventListener('setRegisters', handleSetRegisters as EventListener);
    window.addEventListener('requestRegisters', handleRequestRegisters);

    return () => {
      window.removeEventListener('setRegisters', handleSetRegisters as EventListener);
      window.removeEventListener('requestRegisters', handleRequestRegisters);
    };
  }, [registers]);

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
      ref={(el) => { registerRefs.current[letter] = el; }}
      className={`${isFullWidth ? 'w-full' : 'w-1/2'} h-20 flex items-center justify-center px-4 ${color} border-2 ${isDark ? 'border-gray-300' : 'border-gray-200'} transition-colors duration-200`}
    >
      <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-4xl font-bold mr-6`}>{letter}</span>
      <div className="flex gap-3">
        <input
          type="text"
          value={values[0]}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
            updateRegister(letter as keyof RegisterData, 0, val);
          }}
          className={`w-10 h-10 text-center ${isDark ? 'text-white border-white hover:bg-white/10' : 'text-gray-900 border-gray-400 hover:bg-gray-100'} bg-transparent border-2 rounded text-xl font-mono transition-colors duration-200`}
          maxLength={1}
        />
        <input
          type="text"
          value={values[1]}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
            updateRegister(letter as keyof RegisterData, 1, val);
          }}
          className={`w-10 h-10 text-center ${isDark ? 'text-white border-white hover:bg-white/10' : 'text-gray-900 border-gray-400 hover:bg-gray-100'} bg-transparent border-2 rounded text-xl font-mono transition-colors duration-200`}
          maxLength={1}
        />
      </div>
    </div>
  );

  return (
    <div className={`${isDark ? 'bg-[#2c2c2c] border-[#3F3F46]' : 'bg-white border-gray-200'} h-full border-3 border-solid flex flex-col items-center justify-center p-3 pb-2 pt-0`}>
      <img
        src={isDark ? RegTitle : "/assets/Register Title Light.png"}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = RegTitle; }}
        className="w-45.5 h-[10%]"
      />

      <div className="w-full max-w-md space-y-2">
        <RegisterBlock 
          letter="A" 
          values={registers.A} 
          color={`${isDark ? 'bg-blue-800' : 'bg-blue-100'}`} 
          isFullWidth={true}
        />
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="B" 
            values={registers.B} 
            color={`${isDark ? 'bg-purple-400' : 'bg-purple-100'}`} 
          />
          <RegisterBlock 
            letter="C" 
            values={registers.C} 
            color={`${isDark ? 'bg-cyan-400' : 'bg-cyan-100'}`} 
          />
        </div>
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="D" 
            values={registers.D} 
            color={`${isDark ? 'bg-orange-500' : 'bg-orange-100'}`} 
          />
          <RegisterBlock 
            letter="E" 
            values={registers.E} 
            color={`${isDark ? 'bg-pink-500' : 'bg-pink-100'}`} 
          />
        </div>
        
        <div className="flex gap-2">
          <RegisterBlock 
            letter="H" 
            values={registers.H} 
            color={`${isDark ? 'bg-blue-500' : 'bg-blue-100'}`} 
          />
          <RegisterBlock 
            letter="L" 
            values={registers.L} 
            color={`${isDark ? 'bg-green-500' : 'bg-green-100'}`} 
          />
        </div>
      </div>
    </div>
  );
}