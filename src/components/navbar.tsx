import LOGO from "../assets/20.png"
import profile from "../assets/Profile.png"
import Git from "../assets/Git.png"


export default function Navbar(){
    return(
    <div className="bg-[#121212] h-15 flex flex-row items-center">
        <img src={LOGO} className="w-42.25 pr-5" />
        <h2 className="font-bold text-white pl-5">Learn Microprocessor the Easy Way</h2>
        <div className="h-15 ml-auto flex items-center justify-center gap-5 px-4">
            <img src={profile} className="size-12" />
            <a href="https://github.com/KhantNyrrThwin/OpGO-.git" >
                <img src={Git} className="size-13.5" />
            </a>
        </div>
    </div>
    
    )
}