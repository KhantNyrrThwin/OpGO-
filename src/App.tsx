import './App.css';
import Navbar from './components/navbar';
import Flags from './components/flags';
import Registers from './components/register';
import InstructionInput from './components/InstructionInput';
import ControlBar from './components/controlbar';


function App() {
  return (
    <>
      <Navbar />
      <div className="flex flex-row w-full h-[calc(100vh-48px)]">
        
        
        <div className="w-[45%] bg-[#d9d9d9] flex flex-col">
          <ControlBar />
          <InstructionInput />
        </div>


       
        <div className="w-[35%] bg-[#3F3F46] flex flex-col">
          <div className="h-[30%] bg-green-500">
            <Flags />
          </div>
          <div className="h-[70%] bg-green-700">
            <Registers />
          </div>
        </div>

    
        <div className="w-[20%] bg-black text-white p-2">
          <h2 className="text-lg font-semibold mb-2">User Data Grid</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left">Address</th>
                <th className="text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2000H</td>
                <td>08H</td>
              </tr>
              <tr>
                <td>2001H</td>
                <td>00H</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
