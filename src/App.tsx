import "./App.css";
import { useState } from "react";
import Navbar from "./components/navbar";
import Flags from "./components/flags";
import Registers from "./components/register";
import InstructionInput from "./components/InstructionInput";
import ControlBar from "./components/controlbar";
import UserGrid from "./components/user_data";
import FileNameDialog from "./components/FileNameDialog";
import InstructionInfo from "./components/InstructionInfo";
import Profile from "./pages/Profile"; // ✅ import Profile page
import { FileProvider, useFileContext } from "./contexts/FileContext";
import { useTheme } from "./contexts/ThemeContext";

function Simulator() {
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
      <div className="flex flex-row w-full h-[calc(100vh-48px)]">
        <div className={`w-[45%] ${isDark ? 'bg-[#d9d9d9]' : 'bg-white'} flex flex-col`}>
          <ControlBar />
          <InstructionInput />
        </div>
        <div className={`w-[35%] ${isDark ? 'bg-[#3F3F46]' : 'bg-gray-100'} flex flex-col`}>
          <div className={`${isDark ? 'bg-green-500' : 'bg-emerald-200'} h-[35%]`}>
            <Flags />
          </div>
          <div className={`${isDark ? 'bg-green-700' : 'bg-emerald-300'} h-[65%]`}>
            <Registers />
          </div>
        </div>
        <div className={`w-[20%] ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} p-2`}>
          <UserGrid />
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
  const [currentPage, setCurrentPage] = useState<"simulator" | "instructions" | "profile">(
    "simulator"
  );

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

      {currentPage === "simulator" && <Simulator />}
    </FileProvider>
  );
}

export default App;
