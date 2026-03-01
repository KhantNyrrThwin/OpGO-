import "./App.css";
import { useState } from "react";
import Navbar from "./components/navbar";
import ErrorPanel from "./components/ErrorPanel";
import InstructionInput from "./components/InstructionInput";
import ControlBar from "./components/controlbar";
import UserGrid from "./components/user_data";
import FileNameDialog from "./components/FileNameDialog";
import InstructionInfo from "./components/InstructionInfo";
import Profile from "./pages/Profile"; // ✅ import Profile page
import LandingPage from "./pages/LandingPage";
import { FileProvider, useFileContext } from "./contexts/FileContext";
import { useTheme } from "./contexts/ThemeContext";

function Simulator({ showMemory, setShowMemory }: { showMemory: boolean; setShowMemory: (v: boolean) => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { showFileNameDialog, setShowFileNameDialog, handleSaveWithName, fileName } =
    useFileContext();

  const handleSaveWithNameWrapper = async (newFileName: string) => {
    const content = await getCurrentContent();
    await handleSaveWithName(newFileName, content);
  };

  const getCurrentContent = (): Promise<string> => {
    return new Promise((resolve) => {
      const handleContent = (event: CustomEvent) => {
        resolve(event.detail);
        window.removeEventListener("getContent", handleContent as EventListener);
      };
      window.addEventListener("getContent", handleContent as EventListener);
      window.dispatchEvent(new CustomEvent("requestContent"));
    });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "calc(100vh - 56px)",
          background: isDark ? "#0f0f1a" : "#f1f5f9",
          position: "relative",
        }}
      >
        {/* Left panel — Code editor */}
        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            background: isDark ? "#16162a" : "#ffffff",
            borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          <ControlBar onToggleMemory={() => setShowMemory(!showMemory)} showMemory={showMemory} />
          <InstructionInput />
        </div>

        {/* Right panel — Errors Panel */}
        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: isDark ? "#1a1a2e" : "#ffffff", // Match a standard background
          }}
        >
          <ErrorPanel />
        </div>

        {/* Memory slide-out drawer — from right edge */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            pointerEvents: showMemory ? "auto" : "none",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowMemory(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              opacity: showMemory ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "340px",
              height: "100%",
              background: isDark ? "#1a1a2e" : "#ffffff",
              borderLeft: `1px solid ${isDark ? "rgba(56,189,248,0.15)" : "rgba(14,165,233,0.12)"}`,
              boxShadow: isDark
                ? "-12px 0 40px rgba(0,0,0,0.5)"
                : "-12px 0 40px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              transform: showMemory ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Drawer header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#38bdf8" : "#0ea5e9"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                  }}
                >
                  Memory
                </span>
              </div>
              <button
                onClick={() => setShowMemory(false)}
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: "none",
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  lineHeight: 1,
                  transition: "background 0.2s ease",
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer content */}
            <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
              <UserGrid />
            </div>
          </div>
        </div>
      </div>

      <FileNameDialog
        isOpen={showFileNameDialog}
        currentFileName={fileName}
        onSave={handleSaveWithNameWrapper}
        onCancel={() => setShowFileNameDialog(false)}
      />
    </>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "simulator" | "instructions" | "profile">(
    "landing"
  );
  const [showMemory, setShowMemory] = useState(false);

  if (currentPage === "landing") {
    return <LandingPage onSelectSoftware={() => setCurrentPage("simulator")} />;
  }

  return (
    <FileProvider>
      <Navbar
        onShowInstructions={() => setCurrentPage("instructions")}
        onProfileClick={() => setCurrentPage("profile")}
      />

      {currentPage === "instructions" && (
        <InstructionInfo goBack={() => setCurrentPage("simulator")} />
      )}

      {currentPage === "profile" && (
        <Profile />
      )}

      {currentPage === "simulator" && <Simulator showMemory={showMemory} setShowMemory={setShowMemory} />}
    </FileProvider>
  );
}

export default App;

