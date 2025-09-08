import LOGO from "../assets/20.png";
import profile from "../assets/Profile.png";
import Git from "../assets/Git.png";
import { InformationCircleIcon } from '@heroicons/react/24/solid';

interface NavbarProps {
  onShowInstructions: () => void;
  onProfileClick: () => void;
}

export default function Navbar({ onShowInstructions, onProfileClick }: NavbarProps) {
  return (
    <div className="bg-[#121212] h-15 flex flex-row items-center px-4">
      <img src={LOGO} className="w-29 h-10 mr-4" alt="Logo" />
      <h2 className="font-bold text-white text-lg">Learn Microprocessor the Easy Way</h2>
      <div className="ml-auto flex items-center gap-5">
        <InformationCircleIcon
          className="cursor-pointer text-blue-300 size-10 hover:text-blue-400 transition"
          onClick={onShowInstructions}
          title="View valid instructions"
        />

        {/* ✅ Switch to Profile page */}
        <img
          src={profile}
          className="size-10 rounded-full cursor-pointer"
          alt="Profile"
          onClick={onProfileClick}
        />

        <a href="https://github.com/KhantNyrrThwin/OpGO-.git" target="_blank" rel="noopener noreferrer">
          <img src={Git} className="size-10" alt="GitHub" />
        </a>
      </div>
    </div>
  );
}
