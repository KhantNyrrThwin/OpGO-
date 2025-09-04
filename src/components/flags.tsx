import { useState } from "react"
import FlagsTitle from "../assets/Flag Title.png"
import Active from "../assets/Active.png"
import Unactive from "../assets/Unactive.png"

export default function Flags(){
    const [zeroFlag] = useState(0)
    const [signFlag] = useState(0)
    const [carryFlag] = useState(0)

    

    return(
    <div className="bg-[#2c2c2c] h-full border-3 border-solid border-[#3F3F46] flex flex-col items-center justify-center">
       <img src={FlagsTitle} className="w-35.5 h-[15%] mt-0" />
       <div className="flex flex-row w-[100%]   h-[85%] justify-center ">
            <div className="w-[30%]  flex justify-center ">
                <div className="w-[90%]">
                <img src={zeroFlag === 1 ? Active : Unactive} className="size-15" />
                <div className="bg-[#06b6d4] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                    <h2 className="font-bold text-center pt-2">ZERO</h2>
                    <h1 className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono flex items-center justify-center">{zeroFlag}</h1>
                </div>
                </div>
            </div>
            <div className="w-[30%] flex justify-center">
            <div className="w-[90%]">
                <img src={signFlag === 1 ? Active : Unactive} className="size-15" />
                <div className="bg-[#f59e0b] w-[100%] h-[60%] flex flex-col gap-5 items-center">
                    <h2 className="font-bold text-center pt-2">SIGN</h2>
                    <h1 className="w-10 h-10 text-center text-white bg-transparent border-2 border-white rounded text-xl font-mono flex items-center justify-center">{signFlag}</h1>
                </div>
                </div>
            </div>
            <div className="w-[30%]  flex justify-center">
            <div className="w-[90%]">
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