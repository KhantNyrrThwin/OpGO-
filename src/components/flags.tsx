import { useState, useEffect, useRef } from "react"
import { gsap } from "gsap"
import FlagsTitle from "../assets/Flag Title.png"
import Active from "../assets/Active.png"
import Unactive from "../assets/Unactive.png"

export default function Flags(){
    const [zeroFlag, setZeroFlag] = useState(0)
    const [signFlag, setSignFlag] = useState(0)
    const [carryFlag, setCarryFlag] = useState(0)
    
    // Refs for GSAP animations
    const zeroRef = useRef<HTMLDivElement>(null)
    const signRef = useRef<HTMLDivElement>(null)
    const carryRef = useRef<HTMLDivElement>(null)
    
    // Refs to track previous values
    const prevZeroFlag = useRef<number | null>(null)
    const prevSignFlag = useRef<number | null>(null)
    const prevCarryFlag = useRef<number | null>(null)
    
    // Flag to prevent animations on first load
    const isFirstLoad = useRef(true)

    useEffect(() => {
        const handleSetFlags = (event: CustomEvent) => {
            const flags = event.detail;
            
            // Skip animations on first load
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                setZeroFlag(flags.zero);
                setSignFlag(flags.sign);
                setCarryFlag(flags.carry);
                prevZeroFlag.current = flags.zero;
                prevSignFlag.current = flags.sign;
                prevCarryFlag.current = flags.carry;
                return;
            }
            
            // Simple animation when flags change
            if (flags.zero !== prevZeroFlag.current && zeroRef.current) {
                gsap.to(zeroRef.current, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1
                })
            }
            
            if (flags.sign !== prevSignFlag.current && signRef.current) {
                gsap.to(signRef.current, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1
                })
            }
            
            if (flags.carry !== prevCarryFlag.current && carryRef.current) {
                gsap.to(carryRef.current, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1
                })
            }
            
            // Update flags
            setZeroFlag(flags.zero);
            setSignFlag(flags.sign);
            setCarryFlag(flags.carry);
            
            // Update previous values
            prevZeroFlag.current = flags.zero
            prevSignFlag.current = flags.sign
            prevCarryFlag.current = flags.carry
        };

        window.addEventListener('setFlags', handleSetFlags as EventListener);
        
        return () => {
            window.removeEventListener('setFlags', handleSetFlags as EventListener);
        };
    }, []);

    return(
    <div className="bg-[#2c2c2c] h-full border-3 border-solid border-[#3F3F46] flex flex-col items-center justify-center">
       <img src={FlagsTitle} className="w-35.5 h-[15%] mt-0" />
       <div className="flex flex-row w-[100%] h-[85%] justify-center">
            <div className="w-[30%] flex justify-center">
                <div ref={zeroRef} className="w-[90%]">
                    <img src={zeroFlag === 1 ? Active : Unactive} className="size-15" />
                    <div className="bg-[#06b6d4] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                        <h2 className="font-bold text-center pt-2">ZERO</h2>
                        <h1 className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono flex items-center justify-center">{zeroFlag}</h1>
                    </div>
                </div>
            </div>
            <div className="w-[30%] flex justify-center">
                <div ref={signRef} className="w-[90%]">
                    <img src={signFlag === 1 ? Active : Unactive} className="size-15" />
                    <div className="bg-[#f59e0b] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                        <h2 className="font-bold text-center pt-2">SIGN</h2>
                        <h1 className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono flex items-center justify-center">{signFlag}</h1>
                    </div>
                </div>
            </div>
            <div className="w-[30%] flex justify-center">
                <div ref={carryRef} className="w-[90%]">
                    <img src={carryFlag === 1 ? Active : Unactive} className="size-15" />
                    <div className="bg-[#ec4899] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                        <h2 className="font-bold text-center pt-2">CARRY</h2>
                        <h1 className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono flex items-center justify-center">{carryFlag}</h1>
                    </div>
                </div>
            </div>
       </div>
    </div>
    )
}