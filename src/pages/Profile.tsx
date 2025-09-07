import React from "react";

interface PluginCardProps {
  name: string;
  description: string;
  icon: string;
}

const plugins: PluginCardProps[] = [
  { name: "May Yu Ya Myet Chare", description: "2022-MIIT-CSE-001\nBranch Instructions & Data Flow", icon: "🔀" },
  { name: "Ingyin May", description: "2022-MIIT-CSE-016\nPresentation", icon: "🎤" },
  { name: "Myat Mon Mon Zaw", description: "2022-MIIT-CSE-027\nFrontend Development", icon: "💻" },
  { name: "Pai Min Thway", description: "2022-MIIT-CSE-002\nBranch Instructions & Data Flow", icon: "🔀" },
  { name: "Moe Htet Aung", description: "2022-MIIT-CSE-017\nPowerPoint & Documentation", icon: "📑" },
  { name: "Thi Thi Htun", description: "2022-MIIT-CSE-032\nPowerPoint & Documentation", icon: "📑" },
  { name: "Ei Kinsanar Thwe", description: "2022-MIIT-CSE-004\nFrontend Development", icon: "💻" },
  { name: "Khant Nyar Thwin", description: "2022-MIIT-CSE-018\nUI/UX & Frontend Development", icon: "🎨" },
  { name: "Bhone Myint Maung", description: "2022-MIIT-CSE-034\nLogical / Arithmetic Instructions", icon: "🧠" },
  { name: "Shoon Lae Yi Mon", description: "2022-MIIT-CSE-005\nArithmetic / Logical Instructions", icon: "🔢" },
  { name: "Wai Phyo Aung", description: "2022-MIIT-CSE-019\nPresentation", icon: "🎤" },
  { name: "Khant Htoo Thu", description: "2022-MIIT-CSE-046\nArithmetic / Logical Instructions", icon: "🔢" },
  { name: "Aeint Chit Thu", description: "2022-MIIT-CSE-011\nData Transfer Instructions", icon: "🔄" },
  { name: "Shon Lei Zaw", description: "2022-MIIT-CSE-021\nArithmetic / Logical Instructions", icon: "🔢" },
  { name: "Ye Pyae Aung", description: "2022-MIIT-CSE-053\nPowerPoint & Documentation", icon: "📑" },
];

const PluginCard: React.FC<PluginCardProps> = ({ name, description, icon }) => (
  <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:scale-105 transition-transform text-left">
    <div className="text-3xl">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <p className="text-gray-300 text-base whitespace-pre-line">{description}</p>
    </div>
  </div>
);

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-center px-6 py-12 relative">
      <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
        Project Members'
      </h1>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-10">
        Profile
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plugins.map((plugin, index) => (
          <PluginCard key={index} {...plugin} />
        ))}
      </div>

      {/* Floating Home Button with emoji */}
      <button
        onClick={() => (window.location.href = "/")}
        className="fixed bottom-8 right-8 w-14 h-14 bg-yellow-400 text-black text-2xl font-bold rounded-full shadow-lg hover:bg-yellow-500 transition transform hover:scale-110 flex items-center justify-center"
        title="Return to Home"
      >
        🏠
      </button>
    </div>
  );
};

export default Profile;
