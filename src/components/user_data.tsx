import UserData from "../assets/UserData.png"

export default function UserGrid(){
    return(
        <div className="flex flex-col  items-center">
       <img src={UserData} className="w-35.5 h-[15%] mt-0" />
       <table className="w-full text-sm mt-5">
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
    )
}