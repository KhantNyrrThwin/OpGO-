import { useState } from "react"
import FlagsTitle from "../assets/Flag Title.png"
import Active from "../assets/Active.png"
import Unactive from "../assets/Unactive.png"


export default function Flags(){
    const [zeroFlag, setZeroFlag] = useState(0)
    const [signFlag, setSignFlag] = useState(0)
    const [carryFlag, setCarryFlag] = useState(0)

    const setZero = (value: number) => setZeroFlag(value)
    const setSign = (value: number) => setSignFlag(value)
    const setCarry = (value: number) => setCarryFlag(value)

    return(
    <div className="bg-[#2c2c2c] h-full border-3 border-solid border-[#3F3F46] flex flex-col items-center justify-center">
       <img src={FlagsTitle} className="w-35.5 h-[15%] mt-0" />
       <div className="flex flex-row w-[100%]   h-[85%] justify-center ">
            <div className="w-[30%]  flex justify-center ">
                <div className="w-[90%]">
                <img src={zeroFlag === 1 ? Active : Unactive} className="size-15" />
                <div className="bg-[#06b6d4] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                    <h2 className="font-bold text-center pt-2">ZERO</h2>
                    <h1 className="text-center font-bold text-white text-4xl border-5 border-white w-12">{zeroFlag}</h1>
                </div>
                </div>
            </div>
            <div className="w-[30%] flex justify-center">
            <div className="w-[90%]">
                <img src={signFlag === 1 ? Active : Unactive} className="size-15" />
                <div className="bg-[#f59e0b] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                    <h2 className="font-bold text-center pt-2">SIGN</h2>
                    <h1 className="text-center font-bold text-white text-4xl border-5 border-white w-12">{signFlag}</h1>
                </div>
                </div>
            </div>
            <div className="w-[30%]  flex justify-center">
            <div className="w-[90%]">
                <img src={carryFlag === 1 ? Active : Unactive} className="size-15" />
                <div className="bg-[#ec4899] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                    <h2 className="font-bold text-center pt-2">CARRY</h2>
                    <h1 className="text-center font-bold text-white text-4xl border-5 border-white w-12">{carryFlag}</h1>
                </div>
                </div>
            </div>
       </div>
    </div>
    
    )
}