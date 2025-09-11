import LOGO from "../assets/20.png";
import profile from "../assets/Profile.png";
import Git from "../assets/Git.png";
import { InformationCircleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useTheme } from "../contexts/ThemeContext";

interface NavbarProps {
  onShowInstructions: () => void;
  onProfileClick: () => void;
}

export default function Navbar({ onShowInstructions, onProfileClick }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`${isDark ? 'bg-[#121212]' : 'bg-white border-b border-gray-200'} h-15 flex flex-row items-center px-4`}>
      <img src={LOGO} className="w-29 h-10 mr-4" alt="Logo" />
      <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Learn Microprocessor the Easy Way</h2>
      <div className="ml-auto flex items-center gap-5">
        <InformationCircleIcon
          className={`${isDark ? 'text-blue-300 hover:text-blue-400' : 'text-blue-600 hover:text-blue-700'} cursor-pointer size-10 transition`}
          onClick={onShowInstructions}
          title="View valid instructions"
        />

        <button
          onClick={toggleTheme}
          className={`rounded-md p-1.5 border ${isDark ? 'border-gray-700 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'} transition`}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? (
            <SunIcon className="size-7 text-yellow-400" />
          ) : (
            <MoonIcon className="size-7 text-gray-700" />
          )}
        </button>

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
