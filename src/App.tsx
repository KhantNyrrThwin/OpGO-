import './App.css'
import Navbar from './components/navbar'
import Flags from './components/flags'
import Registers from './components/register'
function App() {
  

  return (
    <>
      <Navbar />
      <div className="flex flex-row w-full" >
        <div className="w-[45%] bg-[#d9d9d9]">
          <div className='h-9 bg-[#D9D9D9]'>
            Buttons
          </div>
          <input type='text' className='bg-[#121212] text-white no-focus w-full' style={{ height: "calc(100vh - 96px)" }} ></input>
        </div>
        <div className="w-[35%] bg-[#3F3F46] flex flex-col">
          <div className="h-[30%] bg-green-500">
            <Flags />
          </div>
          <div className="h-[70%] bg-green-700">
            <Registers />
          </div>
        </div>
        <div className="w-[20%] bg-black text-white">
          User Data
        </div>
      </div>

    </>
  )
}

export default App
