import LOGO from "../assets/20.png";
import profile from "../assets/Profile.png";
import Git from "../assets/Git.png";
import { InformationCircleIcon, MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "../contexts/ThemeContext";

interface NavbarProps {
  onShowInstructions: () => void;
  onProfileClick: () => void;
}

export default function Navbar({ onShowInstructions, onProfileClick }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        background: isDark
          ? "rgba(10, 10, 26, 0.85)"
          : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <img src={LOGO} style={{ width: "116px", height: "40px", marginRight: "14px" }} alt="Logo" />

      {/* Title with gradient */}
      <h2
        style={{
          fontSize: "15px",
          fontWeight: 700,
          margin: 0,
          background: isDark
            ? "linear-gradient(135deg, #38bdf8, #34d399)"
            : "linear-gradient(135deg, #0ea5e9, #059669)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.01em",
        }}
      >
        Learn Microprocessor the Easy Way
      </h2>

      {/* Right side actions */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Info button */}
        <button
          onClick={onShowInstructions}
          title="View valid instructions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            background: "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <InformationCircleIcon
            style={{
              width: "22px",
              height: "22px",
              color: isDark ? "#38bdf8" : "#0ea5e9",
            }}
          />
        </button>


        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            background: "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isDark ? (
            <SunIcon style={{ width: "20px", height: "20px", color: "#fbbf24" }} />
          ) : (
            <MoonIcon style={{ width: "20px", height: "20px", color: "#64748b" }} />
          )}
        </button>

        {/* Profile */}
        <img
          src={profile}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            cursor: "pointer",
            border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            transition: "border-color 0.2s ease",
          }}
          alt="Profile"
          onClick={onProfileClick}
        />

        {/* GitHub */}
        <a
          href="https://github.com/KhantNyrrThwin/OpGO-.git"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <img
            src={Git}
            style={{ width: "34px", height: "34px" }}
            alt="GitHub"
          />
        </a>
      </div>
    </div>
  );
}
