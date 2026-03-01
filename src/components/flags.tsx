import { useState, useEffect, useRef } from "react"
import { gsap } from "gsap"
import FlagsTitle from "../assets/Flag Title.png"
import Active from "../assets/Active.png"
import Unactive from "../assets/Unactive.png"
import { useTheme } from "../contexts/ThemeContext"

export default function Flags() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [zeroFlag, setZeroFlag] = useState(0)
    const [signFlag, setSignFlag] = useState(0)
    const [carryFlag, setCarryFlag] = useState(0)
    const [parityFlag, setParityFlag] = useState(0)
    const [auxCarryFlag, setAuxCarryFlag] = useState(0)

    // Refs for GSAP animations
    const zeroRef = useRef<HTMLDivElement>(null)
    const signRef = useRef<HTMLDivElement>(null)
    const carryRef = useRef<HTMLDivElement>(null)
    const parityRef = useRef<HTMLDivElement>(null)
    const auxCarryRef = useRef<HTMLDivElement>(null)

    // Refs to track previous values
    const prevZeroFlag = useRef<number | null>(null)
    const prevSignFlag = useRef<number | null>(null)
    const prevCarryFlag = useRef<number | null>(null)

    // Flag to prevent animations on first load
    const isFirstLoad = useRef(true)

    useEffect(() => {
        const handleSetFlags = (event: CustomEvent) => {
            const flags = event.detail;

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

            setZeroFlag(flags.zero);
            setSignFlag(flags.sign);
            setCarryFlag(flags.carry);

            prevZeroFlag.current = flags.zero
            prevSignFlag.current = flags.sign
            prevCarryFlag.current = flags.carry
        };

        window.addEventListener('setFlags', handleSetFlags as EventListener);

        return () => {
            window.removeEventListener('setFlags', handleSetFlags as EventListener);
        };
    }, []);

    const FlagBlock = ({ flagRef, value, label, bgDark, bgLight, imgSrc }: {
        flagRef: React.RefObject<HTMLDivElement | null>;
        value: number;
        label: string;
        bgDark: string;
        bgLight: string;
        imgSrc: string;
    }) => (
        <div className="w-[18%] flex justify-center">
            <div ref={flagRef} className="w-[90%]">
                <img src={imgSrc} className="size-12" />
                <div className={`${isDark ? bgDark : bgLight} w-[100%] h-[60%] flex flex-col gap-3 items-center`}>
                    <h2 className={`font-bold text-center pt-1 text-sm ${isDark ? '' : 'text-gray-900'}`}>{label}</h2>
                    <h1 className={`w-8 h-8 text-center ${isDark ? 'text-white border-white' : 'text-gray-900 border-gray-400'} bg-transparent border-2 rounded text-lg font-mono flex items-center justify-center`}>{value}</h1>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`${isDark ? 'bg-[#2c2c2c] border-[#3F3F46]' : 'bg-white border-gray-200'} h-full border-3 border-solid flex flex-col items-center justify-center`}>
            <img
                src={isDark ? FlagsTitle : "/assets/Flag Title Light.png"}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FlagsTitle; }}
                className="w-35.5 h-[12%] mt-0"
            />
            <div className="flex flex-row w-[100%] h-[85%] justify-center gap-1">
                <FlagBlock flagRef={zeroRef} value={zeroFlag} label="ZERO" bgDark="bg-[#06b6d4]" bgLight="bg-cyan-100" imgSrc={zeroFlag === 1 ? Active : Unactive} />
                <FlagBlock flagRef={signRef} value={signFlag} label="SIGN" bgDark="bg-[#f59e0b]" bgLight="bg-amber-100" imgSrc={signFlag === 1 ? Active : Unactive} />
                <FlagBlock flagRef={carryRef} value={carryFlag} label="CARRY" bgDark="bg-[#ec4899]" bgLight="bg-pink-100" imgSrc={carryFlag === 1 ? Active : Unactive} />
                <FlagBlock flagRef={parityRef} value={parityFlag} label="PARITY" bgDark="bg-[#8b5cf6]" bgLight="bg-violet-100" imgSrc={parityFlag === 1 ? Active : Unactive} />
                <FlagBlock flagRef={auxCarryRef} value={auxCarryFlag} label="AUX C" bgDark="bg-[#10b981]" bgLight="bg-emerald-100" imgSrc={auxCarryFlag === 1 ? Active : Unactive} />
            </div>
        </div>
    )
}